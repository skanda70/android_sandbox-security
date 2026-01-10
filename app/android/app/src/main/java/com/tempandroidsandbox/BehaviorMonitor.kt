package com.tempandroidsandbox

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.graphics.drawable.Drawable
import android.util.Log
import java.io.File

class BehaviorMonitor(private val context: Context) {

    companion object {
        private const val TAG = "BehaviorMonitor"
        
        // Dangerous permissions that increase risk score
        private val HIGH_RISK_PERMISSIONS = listOf(
            "android.permission.CAMERA",
            "android.permission.RECORD_AUDIO",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.READ_CONTACTS",
            "android.permission.WRITE_CONTACTS",
            "android.permission.READ_SMS",
            "android.permission.SEND_SMS",
            "android.permission.READ_CALL_LOG",
            "android.permission.PROCESS_OUTGOING_CALLS"
        )
        
        private val MEDIUM_RISK_PERMISSIONS = listOf(
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.READ_PHONE_STATE",
            "android.permission.BLUETOOTH"
        )
    }

    /**
     * List all installed applications
     */
    fun listInstalledApps(): List<Map<String, Any>> {
        val pm: PackageManager = context.packageManager
        val packages = pm.getInstalledApplications(PackageManager.GET_META_DATA)
        
        return packages.filter { app ->
            // Filter out system apps, show only user-installed apps
            (app.flags and ApplicationInfo.FLAG_SYSTEM) == 0
        }.map { app ->
            val appName = pm.getApplicationLabel(app).toString()
            val packageName = app.packageName
            val sourceDir = app.sourceDir
            val fileSize = try {
                val file = File(sourceDir)
                formatFileSize(file.length())
            } catch (e: Exception) {
                "Unknown"
            }
            
            mapOf(
                "id" to packageName,
                "fileName" to appName,
                "packageName" to packageName,
                "fileType" to "apk",
                "fileSize" to fileSize
            )
        }
    }

    /**
     * Get permissions for a specific app
     */
    fun getAppPermissions(packageName: String): List<String> {
        val pm: PackageManager = context.packageManager
        return try {
            val packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
            packageInfo.requestedPermissions?.toList() ?: emptyList()
        } catch (e: Exception) {
            Log.e(TAG, "Error getting permissions for $packageName: ${e.message}")
            emptyList()
        }
    }

    /**
     * Analyze app risk based on permissions
     */
    fun analyzeAppRisk(packageName: String): Map<String, Any> {
        val permissions = getAppPermissions(packageName)
        val pm: PackageManager = context.packageManager
        
        // Count dangerous permissions
        val highRiskCount = permissions.count { it in HIGH_RISK_PERMISSIONS }
        val mediumRiskCount = permissions.count { it in MEDIUM_RISK_PERMISSIONS }
        
        // Calculate risk score (0-100)
        val riskScore = minOf(100, (highRiskCount * 15) + (mediumRiskCount * 5))
        
        // Determine risk level
        val riskLevel = when {
            riskScore >= 50 -> "HIGH"
            riskScore >= 25 -> "MEDIUM"
            else -> "LOW"
        }
        
        // Determine action
        val action = when (riskLevel) {
            "HIGH" -> "BLOCKED"
            "MEDIUM" -> "RESTRICTED"
            else -> "ALLOWED"
        }
        
        // Calculate confidence (higher with more permissions analyzed)
        val confidence = minOf(0.99, 0.70 + (permissions.size * 0.01))
        
        // Get app details
        val appInfo = try {
            pm.getApplicationInfo(packageName, 0)
        } catch (e: Exception) {
            null
        }
        
        val appName = appInfo?.let { pm.getApplicationLabel(it).toString() } ?: packageName
        val sourceDir = appInfo?.sourceDir ?: ""
        val fileSize = try {
            if (sourceDir.isNotEmpty()) {
                formatFileSize(File(sourceDir).length())
            } else "Unknown"
        } catch (e: Exception) {
            "Unknown"
        }

        return mapOf(
            "id" to packageName,
            "fileName" to appName,
            "packageName" to packageName,
            "fileType" to "apk",
            "fileSize" to fileSize,
            "hash" to "sha256-${packageName.hashCode().toString(16)}",
            "risk" to riskLevel,
            "confidence" to confidence,
            "action" to action,
            "permissionCount" to permissions.size,
            "highRiskPerms" to highRiskCount,
            "mediumRiskPerms" to mediumRiskCount,
            "scannedAt" to System.currentTimeMillis()
        )
    }

    /**
     * Format file size to human readable string
     */
    private fun formatFileSize(bytes: Long): String {
        return when {
            bytes >= 1024 * 1024 -> String.format("%.1f MB", bytes / (1024.0 * 1024.0))
            bytes >= 1024 -> String.format("%.1f KB", bytes / 1024.0)
            else -> "$bytes B"
        }
    }

    /**
     * Monitor behavior of all installed apps
     * Logs app names and permissions for security analysis
     */
    fun monitorAppBehavior() {
        val apps = listInstalledApps()
        for (app in apps) {
            val packageName = app["packageName"] as String
            val appName = app["fileName"] as String
            val perms = getAppPermissions(packageName)
            Log.d(TAG, "App: $appName ($packageName), Permissions: $perms")
        }
    }
}
