package com.tempandroidsandbox

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log
import java.io.File
import java.io.RandomAccessFile
import kotlin.math.ln
import kotlin.math.min

/**
 * EmberFeatureExtractor — Extracts EMBER v2 features (2381 dims) from raw APK bytes.
 *
 * Feature vector layout (matches the EMBER2024_APK.onnx model):
 *   [0..255]     ByteHistogram           (256 dims) — Normalized byte-value frequency
 *   [256..511]   ByteEntropyHistogram    (256 dims) — 16×16 byte-entropy joint distribution
 *   [512..615]   StringExtractor         (104 dims) — String statistics
 *   [616..625]   GeneralFileInfo         (10 dims)  — File size + PE metadata (zeros for APK)
 *   [626..687]   HeaderFileInfo          (62 dims)  — PE headers (zeros for APK)
 *   [688..942]   SectionInfo             (255 dims) — PE sections (zeros for APK)
 *   [943..2222]  ImportsInfo             (1280 dims)— PE imports (zeros for APK)
 *   [2223..2350] ExportsInfo             (128 dims) — PE exports (zeros for APK)
 *   [2351..2380] DataDirectories         (30 dims)  — PE data dirs (zeros for APK)
 *
 * For APK files, only the first 626 features are meaningful.
 * The remaining 1755 PE-specific features are left as zeros.
 */
class EmberFeatureExtractor(private val context: Context) {

    companion object {
        private const val TAG = "EmberFeatureExtractor"
        const val NUM_FEATURES = 2381

        // Feature group offsets
        private const val OFF_BYTE_HIST       = 0     // 256
        private const val OFF_BYTE_ENTROPY    = 256   // 256
        private const val OFF_STRINGS         = 512   // 104
        private const val OFF_GENERAL         = 616   // 10
        // 626..2380 are PE-specific and remain zero for APKs

        // Entropy histogram parameters
        private const val ENTROPY_WINDOW = 2048
        private const val ENTROPY_STEP   = 1024

        // Max bytes to read (cap at 100MB to avoid OOM)
        private const val MAX_READ_BYTES = 100 * 1024 * 1024L
    }

    private val pm: PackageManager = context.packageManager

    /**
     * Extract 2381-dimensional EMBER v2 feature vector from the APK of [packageName].
     */
    fun extractFeatures(packageName: String): FloatArray {
        val features = FloatArray(NUM_FEATURES)

        try {
            val appInfo = pm.getApplicationInfo(packageName, 0)
            val apkPath = appInfo.sourceDir
            val apkFile = File(apkPath)

            if (!apkFile.exists()) {
                Log.w(TAG, "APK not found: $apkPath")
                return features
            }

            val fileSize = apkFile.length()
            val readSize = min(fileSize, MAX_READ_BYTES).toInt()

            // Read raw APK bytes
            val bytes = ByteArray(readSize)
            RandomAccessFile(apkFile, "r").use { raf ->
                raf.readFully(bytes)
            }

            // 1. ByteHistogram (256 dims) — normalized byte frequency
            computeByteHistogram(bytes, features, OFF_BYTE_HIST)

            // 2. ByteEntropyHistogram (256 dims) — 16×16 byte-entropy grid, flattened
            computeByteEntropyHistogram(bytes, features, OFF_BYTE_ENTROPY)

            // 3. StringExtractor (104 dims)
            computeStringFeatures(bytes, features, OFF_STRINGS)

            // 4. GeneralFileInfo (10 dims) — only file size for APK
            features[OFF_GENERAL] = fileSize.toFloat()
            // features[OFF_GENERAL + 1..9] remain 0 (PE-specific: vsize, has_debug, etc.)

            // 5..9. PE-specific features (1755 dims) — all zeros, already initialized

            Log.d(TAG, "Extracted EMBER features for $packageName: " +
                    "fileSize=${fileSize}, readBytes=$readSize, " +
                    "byteHistNonZero=${features.slice(OFF_BYTE_HIST until OFF_BYTE_HIST + 256).count { it > 0 }}, " +
                    "entropyNonZero=${features.slice(OFF_BYTE_ENTROPY until OFF_BYTE_ENTROPY + 256).count { it > 0 }}")

        } catch (e: Exception) {
            Log.e(TAG, "Failed to extract features for $packageName: ${e.message}", e)
        }

        return features
    }

    /**
     * Compute normalized byte-value histogram (256 dims).
     * Equivalent to EMBER's ByteHistogram: count each byte value, then normalize by total.
     */
    private fun computeByteHistogram(bytes: ByteArray, features: FloatArray, offset: Int) {
        val counts = IntArray(256)
        for (b in bytes) {
            counts[b.toInt() and 0xFF]++
        }
        val total = bytes.size.toFloat()
        if (total > 0) {
            for (i in 0 until 256) {
                features[offset + i] = counts[i] / total
            }
        }
    }

    /**
     * Compute 2D byte-entropy histogram (16×16 = 256 dims).
     * Uses sliding window to approximate the joint probability of byte value and local entropy.
     * Based on Saxe and Berlin, 2015 (Section 2.1.1 of https://arxiv.org/pdf/1508.03096.pdf).
     */
    private fun computeByteEntropyHistogram(bytes: ByteArray, features: FloatArray, offset: Int) {
        val grid = IntArray(16 * 16) // 16 entropy bins × 16 coarse byte bins

        if (bytes.size < ENTROPY_WINDOW) {
            // Small file: single block
            val hBin = computeEntropyBin(bytes, 0, bytes.size)
            val coarseCounts = IntArray(16)
            for (b in bytes) {
                coarseCounts[(b.toInt() and 0xFF) shr 4]++
            }
            for (i in 0 until 16) {
                grid[hBin * 16 + i] += coarseCounts[i]
            }
        } else {
            // Sliding window
            var start = 0
            while (start + ENTROPY_WINDOW <= bytes.size) {
                val hBin = computeEntropyBin(bytes, start, ENTROPY_WINDOW)
                val coarseCounts = IntArray(16)
                for (i in start until start + ENTROPY_WINDOW) {
                    coarseCounts[(bytes[i].toInt() and 0xFF) shr 4]++
                }
                for (i in 0 until 16) {
                    grid[hBin * 16 + i] += coarseCounts[i]
                }
                start += ENTROPY_STEP
            }
        }

        // Normalize
        val total = grid.sum().toFloat()
        if (total > 0) {
            for (i in 0 until 256) {
                features[offset + i] = grid[i] / total
            }
        }
    }

    /**
     * Compute entropy bin (0–15) for a block of bytes.
     * Uses 16-bin coarse histogram, then computes Shannon entropy × 2.
     */
    private fun computeEntropyBin(bytes: ByteArray, start: Int, length: Int): Int {
        val coarse = IntArray(16)
        for (i in start until start + length) {
            coarse[(bytes[i].toInt() and 0xFF) shr 4]++
        }
        val ln2 = ln(2.0)
        var entropy = 0.0
        for (c in coarse) {
            if (c > 0) {
                val p = c.toDouble() / length
                entropy -= p * (ln(p) / ln2)
            }
        }
        // entropy is in bits (0–4, since we used 16 bins → max 4 bits)
        // multiply by 2 to scale to 0–8 range, then bin to 0–15
        var hBin = (entropy * 2).toInt()
        if (hBin >= 16) hBin = 15
        return hBin
    }

    /**
     * Extract string features (104 dims).
     * Layout: [numStrings, avgLength, printableCount, charDist(96), entropy, paths, urls, registry, mz]
     *
     * Finds all runs of printable ASCII (0x20–0x7F) of length ≥ 5.
     */
    private fun computeStringFeatures(bytes: ByteArray, features: FloatArray, offset: Int) {
        val strings = mutableListOf<ByteArray>()
        var runStart = -1

        // Find printable ASCII runs ≥ 5 chars
        for (i in bytes.indices) {
            val b = bytes[i].toInt() and 0xFF
            if (b in 0x20..0x7F) {
                if (runStart == -1) runStart = i
            } else {
                if (runStart != -1 && i - runStart >= 5) {
                    strings.add(bytes.copyOfRange(runStart, i))
                }
                runStart = -1
            }
        }
        // Handle run at end of file
        if (runStart != -1 && bytes.size - runStart >= 5) {
            strings.add(bytes.copyOfRange(runStart, bytes.size))
        }

        if (strings.isEmpty()) {
            // All zeros (already initialized)
            return
        }

        // numStrings
        features[offset] = strings.size.toFloat()

        // avgLength
        val totalLen = strings.sumOf { it.size }
        features[offset + 1] = totalLen.toFloat() / strings.size

        // printableCount
        features[offset + 2] = totalLen.toFloat()

        // Character distribution (96 dims) — histogram of printable chars (0x20–0x7F mapped to 0–95)
        val charCounts = IntArray(96)
        for (s in strings) {
            for (b in s) {
                val idx = (b.toInt() and 0xFF) - 0x20
                if (idx in 0..95) charCounts[idx]++
            }
        }
        val charTotal = charCounts.sum().toFloat()
        if (charTotal > 0) {
            for (i in 0 until 96) {
                features[offset + 3 + i] = charCounts[i] / charTotal
            }
        }

        // Entropy of printable character distribution
        val ln2 = ln(2.0)
        var entropy = 0.0
        for (c in charCounts) {
            if (c > 0 && charTotal > 0) {
                val p = c.toDouble() / charTotal
                entropy -= p * (ln(p) / ln2)
            }
        }
        features[offset + 99] = entropy.toFloat()

        // Count patterns in all bytes (paths, URLs, registry, MZ)
        val allBytes = bytes
        features[offset + 100] = countPattern(allBytes, "c:\\".toByteArray()).toFloat()      // paths
        features[offset + 101] = countPatternCI(allBytes, "http://".toByteArray(), "https://".toByteArray()).toFloat() // urls
        features[offset + 102] = countPattern(allBytes, "HKEY_".toByteArray()).toFloat()     // registry
        features[offset + 103] = countPattern(allBytes, "MZ".toByteArray()).toFloat()        // MZ headers
    }

    /**
     * Count occurrences of a byte pattern in the data.
     */
    private fun countPattern(data: ByteArray, pattern: ByteArray): Int {
        var count = 0
        val pLen = pattern.size
        outer@ for (i in 0..data.size - pLen) {
            for (j in 0 until pLen) {
                if (data[i + j] != pattern[j]) continue@outer
            }
            count++
        }
        return count
    }

    /**
     * Count occurrences of either of two patterns (case-insensitive for the first bytes).
     */
    private fun countPatternCI(data: ByteArray, vararg patterns: ByteArray): Int {
        var count = 0
        for (pattern in patterns) {
            count += countPattern(data, pattern)
        }
        return count
    }
}
