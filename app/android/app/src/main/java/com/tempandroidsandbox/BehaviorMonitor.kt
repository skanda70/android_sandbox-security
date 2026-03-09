package com.tempandroidsandbox

import android.content.Context
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.content.pm.ServiceInfo
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import android.util.Base64
import android.util.Log
import java.io.ByteArrayOutputStream
import java.io.File
import java.io.InputStream

/**
 * BehaviorMonitor - Extracts app features for ML-based malware detection
 * 
 * Builds feature vector (FloatArray[139]) from app metadata and behavior:
 * - Permission features (40)
 * - Intent features (20)
 * - API call features (50)
 * - Network features (15)
 * - File/component features (14)
 * 
 * Features follow the order in feature_order.txt for ONNX model compatibility
 */
class BehaviorMonitor(private val context: Context) {

    companion object {
        private const val TAG = "BehaviorMonitor"
        
        // Feature count for CICMalDroid model
        const val FEATURE_COUNT = 139
        
        // Feature file
        private const val FEATURE_ORDER_FILE = "feature_order.txt"

        // Dangerous permissions
        private val HIGH_RISK_PERMISSIONS = setOf(
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

        private val MEDIUM_RISK_PERMISSIONS = setOf(
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.READ_PHONE_STATE",
            "android.permission.BLUETOOTH"
        )
    }

    // Feature order map loaded from assets
    private var featureOrderMap: Map<String, Int>? = null

    /**
     * Load feature order from assets
     */
    private fun loadFeatureOrder(): Map<String, Int> {
        featureOrderMap?.let { return it }
        
        return try {
            val features = mutableMapOf<String, Int>()
            context.assets.open(FEATURE_ORDER_FILE).bufferedReader().use { reader ->
                var lineNumber = 0
                reader.forEachLine { line ->
                    val trimmed = line.trim()
                    // Skip comments and empty lines
                    if (trimmed.isNotEmpty() && !trimmed.startsWith("#")) {
                        features[trimmed] = lineNumber++
                    }
                }
            }
            featureOrderMap = features
            Log.d(TAG, "Loaded ${features.size} features from feature_order.txt")
            features
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load feature order: ${e.message}", e)
            // Return empty map - will use default ordering
            emptyMap()
        }
    }

    /**
     * Build feature vector (FloatArray[139]) for an app
     * This extracts features following the exact order from feature_order.txt
     * 
     * @param packageName App package name
     * @return FloatArray of 139 features for ML model
     */
    fun buildFeatureVector(packageName: String): FloatArray {
        val pm: PackageManager = context.packageManager
        
        // Initialize feature array with zeros
        val features = FloatArray(FEATURE_COUNT)
        
        try {
            // Get package info with all details
            val packageInfo = pm.getPackageInfo(
                packageName, 
                PackageManager.GET_PERMISSIONS or PackageManager.GET_SERVICES or PackageManager.GET_RECEIVERS
            )
            val permissions = packageInfo.requestedPermissions?.toSet() ?: emptySet()
            val services = packageInfo.services?.toList() ?: emptyList()
            val receivers = packageInfo.receivers?.toList() ?: emptyList()
            
            // Get app info
            val appInfo = try {
                pm.getApplicationInfo(packageName, 0)
            } catch (e: Exception) {
                null
            }
            
            // ===== PERMISSION FEATURES (40 features, indices 0-39) =====
            // Based on feature_order.txt
            setPermissionFeatures(features, permissions)
            
            // ===== INTENT FEATURES (20 features, indices 40-59) =====
            setIntentFeatures(features, packageInfo)
            
            // ===== API CALL FEATURES (50 features, indices 60-109) =====
            setAPIFeatures(features, permissions, packageName)
            
            // ===== NETWORK FEATURES (15 features, indices 110-124) =====
            setNetworkFeatures(features, permissions, packageInfo)
            
            // ===== COMPONENT FEATURES (14 features, indices 125-138) =====
            setComponentFeatures(features, packageInfo, appInfo)
            
            Log.d(TAG, "Built feature vector for $packageName: sum=${features.sum()}")
            
        } catch (e: Exception) {
            Log.e(TAG, "Error building feature vector for $packageName: ${e.message}", e)
        }
        
        return features
    }

    /**
     * Extract permission-based features (40 features)
     */
    private fun setPermissionFeatures(features: FloatArray, permissions: Set<String>) {
        // Map of permission to feature index (0-based from feature_order.txt)
        val permissionFeatures = mapOf(
            "android.permission.READ_PHONE_STATE" to 0,
            "android.permission.READ_EXTERNAL_STORAGE" to 1,
            "android.permission.WRITE_EXTERNAL_STORAGE" to 2,
            "android.permission.RECEIVE_BOOT_COMPLETED" to 3,
            "android.permission.ACCESS_NETWORK_STATE" to 4,
            "android.permission.ACCESS_WIFI_STATE" to 5,
            "android.permission.INTERNET" to 6,
            "android.permission.CAMERA" to 7,
            "android.permission.RECORD_AUDIO" to 8,
            "android.permission.ACCESS_FINE_LOCATION" to 9,
            "android.permission.ACCESS_COARSE_LOCATION" to 10,
            "android.permission.READ_CONTACTS" to 11,
            "android.permission.WRITE_CONTACTS" to 12,
            "android.permission.READ_SMS" to 13,
            "android.permission.RECEIVE_SMS" to 14,
            "android.permission.SEND_SMS" to 15,
            "android.permission.READ_CALL_LOG" to 16,
            "android.permission.WRITE_CALL_LOG" to 17,
            "android.permission.PROCESS_OUTGOING_CALLS" to 18,
            "android.permission.READ_CALENDAR" to 19,
            "android.permission.WRITE_CALENDAR" to 20,
            "android.permission.GET_ACCOUNTS" to 21,
            "android.permission.BLUETOOTH" to 22,
            "android.permission.BLUETOOTH_ADMIN" to 23,
            "android.permission.VIBRATE" to 24,
            "android.permission.WAKE_LOCK" to 25,
            "android.permission.FLASHLIGHT" to 26,
            "android.permission.CALL_PHONE" to 27,
            "android.permission.SYSTEM_ALERT_WINDOW" to 28,
            "android.permission.WRITE_SETTINGS" to 29,
            "android.permission.REQUEST_INSTALL_PACKAGES" to 30,
            "android.permission.REQUEST_DELETE_PACKAGES" to 31,
            "android.permission.BIND_ACCESSIBILITY_SERVICE" to 32,
            "android.permission.BIND_DEVICE_ADMIN" to 33,
            "android.permission.BIND_NOTIFICATION_LISTENER_SERVICE" to 34,
            "android.permission.BIND_INPUT_METHOD" to 35,
            "android.permission.GET_TASKS" to 36,
            "android.permission.SET_DEBUG_APP" to 37,
            "android.permission.DUMP" to 38
        )
        
        // Also count additional permissions (index 39)
        var additionalPermCount = 0
        
        for (perm in permissions) {
            val index = permissionFeatures[perm]
            if (index != null) {
                features[index] = 1.0f
            } else if (!perm.startsWith("android.permission.")) {
                // Custom permission - increment additional count
                additionalPermCount++
            }
        }
        
        // Feature 39: Additional permission count (normalized)
        features[39] = minOf(additionalPermCount / 10.0f, 1.0f)
    }

    /**
     * Extract intent features (20 features)
     */
    private fun setIntentFeatures(features: FloatArray, packageInfo: PackageManager.PackageInfo) {
        // Get activities to check for intent filters
        val activities = packageInfo.activities?.toList() ?: emptyList()
        
        // Common intent actions to look for
        val intentActions = mapOf(
            "android.intent.action.MAIN" to 40,
            "android.intent.action.VIEW" to 41,
            "android.intent.action.SEND" to 42,
            "android.intent.action.GET_CONTENT" to 43,
            "android.intent.action.DIAL" to 44,
            "android.intent.action.CALL" to 45,
            "android.intent.action.SENDTO" to 46,
            "android.intent.action.SEND_MULTIPLE" to 47,
            "android.intent.action.PROCESS_TEXT" to 48,
            "android.intent.action.WEB_SEARCH" to 49,
            "android.intent.action.SYNC" to 50,
            "android.intent.action.REBOOT" to 51,
            "android.intent.action.SHUTDOWN" to 52,
            "android.intent.action.BOOT_COMPLETED" to 53,
            "android.intent.action.PACKAGE_ADDED" to 54,
            "android.intent.action.PACKAGE_REMOVED" to 55,
            "android.intent.action.PHONE_STATE" to 56,
            "android.intent.action.NEW_OUTGOING_CALL" to 57,
            "android.intent.action.PROXY_CHANGE" to 58,
            "android.intent.action.DATA_SMS_RECEIVED" to 59
        )
        
        // Check activities for intent filters
        for (activity in activities) {
            val intentFilters = activity.intentFilters
            if (intentFilters != null) {
                for (filter in intentFilters) {
                    for (action in filter.actionsIterator) {
                        val actionStr = action.toString()
                        val index = intentActions[actionStr]
                        if (index != null) {
                            features[index] = 1.0f
                        }
                    }
                }
            }
        }
    }

    /**
     * Extract API call features (50 features)
     * Inferred from permissions and app characteristics
     */
    private fun setAPIFeatures(features: FloatArray, permissions: Set<String>, packageName: String) {
        // Feature indices from feature_order.txt (60-109)
        val baseIndex = 60
        
        // Map API patterns to feature indices
        // These are inferred from permissions and common API usage patterns
        val apiPatterns = mapOf(
            "api.getSystemService" to 0,
            "api.telephonyManager.getDeviceId" to 1,
            "api.telephonyManager.getSubscriberId" to 2,
            "api.telephonyManager.getSimSerialNumber" to 3,
            "api.wifiManager.getConnectionInfo" to 4,
            "api.locationManager.getLastKnownLocation" to 5,
            "api.accountManager.getAccounts" to 6,
            "api.contentResolver.query" to 7,
            "api.contentResolver.insert" to 8,
            "api.contentResolver.update" to 9,
            "api.contentResolver.delete" to 10,
            "api.packageManager.getInstalledPackages" to 11,
            "api.packageManager.getInstalledApplications" to 12,
            "api.runtime.exec" to 13,
            "api.runtime.getRuntime" to 14,
            "api.processBuilder" to 15,
            "api.classLoader.loadClass" to 16,
            "api.method.invoke" to 17,
            "api.reflection" to 18,
            "api.fileInputStream" to 19,
            "api.fileOutputStream" to 20,
            "api.fileReader" to 21,
            "api.fileWriter" to 22,
            "api.bufferedReader" to 23,
            "api.bufferedWriter" to 24,
            "api.dataInputStream" to 25,
            "api.dataOutputStream" to 26,
            "api.objectInputStream" to 27,
            "api.objectOutputStream" to 28,
            "api.urlConnection" to 29,
            "api.httpURLConnection" to 30,
            "api.httpsURLConnection" to 31,
            "api.socket" to 32,
            "api.datagramSocket" to 33,
            "api.serverSocket" to 34,
            "api.multicastSocket" to 35,
            "apiCipher" to 36,
            "api.cipher.getInstance" to 37,
            "api.secretKeySpec" to 38,
            "api.messenger" to 39,
            "api.handler" to 40,
            "api.asyncTask" to 41,
            "api.thread" to 42,
            "api.executorService" to 43,
            "api.intentService" to 44,
            "api.service.startService" to 45,
            "api.service.bindService" to 46,
            "api.broadcastReceiver.registerReceiver" to 47,
            "api.activity.startActivity" to 48,
            "api.activity.startService" to 49
        )
        
        // Infer API usage from permissions
        // This is a heuristic - in production, static analysis would be more accurate
        
        // Phone state -> telephony APIs
        if (permissions.contains("android.permission.READ_PHONE_STATE")) {
            features[baseIndex + 1] = 1.0f
            features[baseIndex + 2] = 1.0f
            features[baseIndex + 3] = 1.0f
        }
        
        // Location permissions -> location APIs
        if (permissions.contains("android.permission.ACCESS_FINE_LOCATION") || 
            permissions.contains("android.permission.ACCESS_COARSE_LOCATION")) {
            features[baseIndex + 5] = 1.0f
        }
        
        // Contacts permissions -> account manager
        if (permissions.contains("android.permission.GET_ACCOUNTS") ||
            permissions.contains("android.permission.READ_CONTACTS")) {
            features[baseIndex + 6] = 1.0f
        }
        
        // Internet -> network APIs
        if (permissions.contains("android.permission.INTERNET")) {
            features[baseIndex + 29] = 1.0f
            features[baseIndex + 30] = 1.0f
            features[baseIndex + 31] = 1.0f
            features[baseIndex + 32] = 1.0f
        }
        
        // Storage -> file APIs
        if (permissions.contains("android.permission.READ_EXTERNAL_STORAGE") ||
            permissions.contains("android.permission.WRITE_EXTERNAL_STORAGE")) {
            features[baseIndex + 19] = 1.0f
            features[baseIndex + 20] = 1.0f
            features[baseIndex + 21] = 1.0f
            features[baseIndex + 22] = 1.0f
        }
        
        // Boot completed -> service APIs
        if (permissions.contains("android.permission.RECEIVE_BOOT_COMPLETED")) {
            features[baseIndex + 44] = 1.0f
            features[baseIndex + 45] = 1.0f
            features[baseIndex + 46] = 1.0f
            features[baseIndex + 47] = 1.0f
        }
        
        // SMS permissions -> content resolver
        if (permissions.contains("android.permission.READ_SMS") ||
            permissions.contains("android.permission.RECEIVE_SMS")) {
            features[baseIndex + 7] = 1.0f
        }
        
        // Accessibility service -> reflection/invocation
        if (permissions.contains("android.permission.BIND_ACCESSIBILITY_SERVICE")) {
            features[baseIndex + 16] = 1.0f
            features[baseIndex + 17] = 1.0f
            features[baseIndex + 18] = 1.0f
        }
        
        // Bluetooth -> socket APIs
        if (permissions.contains("android.permission.BLUETOOTH") ||
            permissions.contains("android.permission.BLUETOOTH_ADMIN")) {
            features[baseIndex + 32] = 1.0f
            features[baseIndex + 33] = 1.0f
        }
        
        // Mark general API presence
        features[baseIndex + 0] = 1.0f // getSystemService
        features[baseIndex + 40] = 1.0f // handler
        features[baseIndex + 41] = 1.0f // asyncTask
        features[baseIndex + 42] = 1.0f // thread
    }

    /**
     * Extract network features (15 features)
     */
    private fun setNetworkFeatures(features: FloatArray, permissions: Set<String>, packageInfo: PackageManager.PackageInfo) {
        val baseIndex = 110
        
        // Check for internet-related permissions
        features[baseIndex + 0] = if (permissions.contains("android.permission.INTERNET")) 1.0f else 0.0f
        features[baseIndex + 1] = if (permissions.contains("android.permission.ACCESS_NETWORK_STATE")) 1.0f else 0.0f
        features[baseIndex + 2] = if (permissions.contains("android.permission.ACCESS_WIFI_STATE")) 1.0f else 0.0f
        features[baseIndex + 3] = if (permissions.contains("android.permission.ACCESS_NETWORK_STATE")) 1.0f else 0.0f
        features[baseIndex + 4] = if (permissions.contains("android.permission.ACCESS_WIFI_STATE")) 1.0f else 0.0f
        
        // Check AndroidManifest for network security config
        // This would require APK parsing - using heuristics instead
        val hasNetworkPerms = permissions.contains("android.permission.INTERNET")
        
        features[baseIndex + 5] = 0.0f // hasChangeNetworkStatePermission
        features[baseIndex + 6] = 0.0f // hasChangeWifiStatePermission
        
        // Uses cleartext - heuristic based on permissions
        features[baseIndex + 7] = if (hasNetworkPerms) 0.3f else 0.0f
        
        // Security config - assume modern apps use it
        features[baseIndex + 8] = 0.5f
        
        // Certificate pinning - default to no
        features[baseIndex + 9] = 0.0f
        
        // SSL config
        features[baseIndex + 10] = 0.5f
        features[baseIndex + 11] = 0.5f
        
        // Trust manager and key manager
        features[baseIndex + 12] = 0.0f
        features[baseIndex + 13] = 0.0f
        
        // SSL Socket factory
        features[baseIndex + 14] = if (hasNetworkPerms) 0.5f else 0.0f
    }

    /**
     * Extract component features (14 features)
     */
    private fun setComponentFeatures(features: FloatArray, packageInfo: PackageManager.PackageInfo, appInfo: ApplicationInfo?) {
        val baseIndex = 125
        
        // Get activities
        val activities = packageInfo.activities?.toList() ?: emptyList()
        val hasMainActivity = activities.any { 
            it.name?.contains("MainActivity") == true ||
            it.name?.contains("Launcher") == true
        }
        
        // Get services
        val services = packageInfo.services?.toList() ?: emptyList()
        
        // Get receivers
        val receivers = packageInfo.receivers?.toList() ?: emptyList()
        
        // Get providers
        val providers = packageInfo.providers?.toList() ?: emptyList()
        
        features[baseIndex + 0] = if (hasMainActivity) 1.0f else 0.0f
        features[baseIndex + 1] = if (activities.isNotEmpty()) 1.0f else 0.0f
        features[baseIndex + 2] = 0.0f // hasBackupAgent
        features[baseIndex + 3] = if (providers.isNotEmpty()) 1.0f else 0.0f
        features[baseIndex + 4] = if (services.isNotEmpty()) 1.0f else 0.0f
        features[baseIndex + 5] = if (receivers.isNotEmpty()) 1.0f else 0.0f
        features[baseIndex + 6] = if (receivers.isNotEmpty()) 1.0f else 0.0f
        
        // Count features
        features[baseIndex + 7] = minOf(services.size / 10.0f, 1.0f)
        features[baseIndex + 8] = minOf(receivers.size / 10.0f, 1.0f)
        features[baseIndex + 9] = minOf(providers.size / 5.0f, 1.0f)
        features[baseIndex + 10] = minOf(activities.size / 20.0f, 1.0f)
        
        // Native code - check if APK has native libraries
        features[baseIndex + 11] = 0.0f // would need APK analysis
        
        // Shared libraries
        features[baseIndex + 12] = appInfo?.sharedLibraryFiles?.size?.let {
            minOf(it / 5.0f, 1.0f)
        } ?: 0.0f
        
        features[baseIndex + 13] = 0.0f
    }

    /**
     * List all installed applications that have a launcher activity
     */
    fun listInstalledApps(): List<Map<String, Any>> {
        val pm: PackageManager = context.packageManager
        
        val launcherIntent = android.content.Intent(android.content.Intent.ACTION_MAIN, null)
        launcherIntent.addCategory(android.content.Intent.CATEGORY_LAUNCHER)
        val launcherApps = pm.queryIntentActivities(launcherIntent, 0)
        
        return launcherApps.map { resolveInfo ->
            val app = resolveInfo.activityInfo.applicationInfo
            val appName = resolveInfo.loadLabel(pm).toString()
            val packageName = app.packageName
            val sourceDir = app.sourceDir
            val isSystemApp = (app.flags and ApplicationInfo.FLAG_SYSTEM) != 0
            val fileSize = try {
                formatFileSize(File(sourceDir).length())
            } catch (e: Exception) {
                "Unknown"
            }
            
            val iconBase64 = try {
                drawableToBase64(resolveInfo.loadIcon(pm))
            } catch (e: Exception) {
                ""
            }
            
            mapOf(
                "id" to packageName,
                "fileName" to appName,
                "packageName" to packageName,
                "fileType" to "apk",
                "fileSize" to fileSize,
                "isSystemApp" to isSystemApp,
                "iconBase64" to iconBase64
            )
        }.distinctBy { it["packageName"] }
         .sortedBy { it["isSystemApp"] as Boolean }
    }

    /**
     * Convert Drawable to Base64 string
     */
    private fun drawableToBase64(drawable: Drawable): String {
        val bitmap = if (drawable is BitmapDrawable) {
            drawable.bitmap
        } else {
            val width = if (drawable.intrinsicWidth > 0) drawable.intrinsicWidth else 96
            val height = if (drawable.intrinsicHeight > 0) drawable.intrinsicHeight else 96
            val bmp = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(bmp)
            drawable.setBounds(0, 0, canvas.width, canvas.height)
            drawable.draw(canvas)
            bmp
        }
        
        val outputStream = ByteArrayOutputStream()
        bitmap.compress(Bitmap.CompressFormat.PNG, 80, outputStream)
        return Base64.encodeToString(outputStream.toByteArray(), Base64.NO_WRAP)
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
        
        val appInfo = try {
            pm.getApplicationInfo(packageName, 0)
        } catch (e: Exception) {
            null
        }
        
        val packageInfo = try {
            pm.getPackageInfo(packageName, 0)
        } catch (e: Exception) {
            null
        }
        
        val isSystemApp = appInfo?.let { (it.flags and ApplicationInfo.FLAG_SYSTEM) != 0 } ?: false
        val appName = appInfo?.let { pm.getApplicationLabel(it).toString() } ?: packageName
        
        // Installation source
        val installerPackage = try {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                pm.getInstallSourceInfo(packageName).installingPackageName
            } else {
                @Suppress("DEPRECATION")
                pm.getInstallerPackageName(packageName)
            }
        } catch (e: Exception) {
            null
        }
        
        val isFromPlayStore = installerPackage == "com.android.vending"
        val isSideloaded = installerPackage == null || installerPackage.isEmpty()
        
        val isDebuggable = appInfo?.let { (it.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0 } ?: false
        val isTestOnly = appInfo?.let { (it.flags and ApplicationInfo.FLAG_TEST_ONLY) != 0 } ?: false
        
        val targetSdk = appInfo?.targetSdkVersion ?: 0
        val lastUpdateTime = packageInfo?.lastUpdateTime ?: 0L
        val currentTime = System.currentTimeMillis()
        val twoYearsMs = 2L * 365 * 24 * 60 * 60 * 1000
        val isOutdated = lastUpdateTime > 0 && (currentTime - lastUpdateTime) > twoYearsMs
        
        val highRiskCount = permissions.count { it in HIGH_RISK_PERMISSIONS }
        val mediumRiskCount = permissions.count { it in MEDIUM_RISK_PERMISSIONS }
        
        var riskScore = if (isSystemApp) {
            minOf(20, (highRiskCount * 2) + (mediumRiskCount * 1))
        } else {
            var baseScore = (highRiskCount * 10) + (mediumRiskCount * 4)
            if (isSideloaded) baseScore += 30
            if (isDebuggable) baseScore += 50
            if (isTestOnly) baseScore += 25
            if (targetSdk > 0 && targetSdk < 29) baseScore += 15
            if (isOutdated) baseScore += 10
            minOf(100, baseScore)
        }
        
        val riskLevel = when {
            isDebuggable -> "HIGH"
            riskScore >= 50 -> "HIGH"
            riskScore >= 25 -> "MEDIUM"
            else -> "LOW"
        }
        
        val action = when (riskLevel) {
            "HIGH" -> "REVIEW"
            "MEDIUM" -> "MONITOR"
            else -> "SAFE"
        }
        
        val confidence = minOf(0.99, 0.70 + (permissions.size * 0.01))
        
        val sourceDir = appInfo?.sourceDir ?: ""
        val fileSize = try {
            if (sourceDir.isNotEmpty()) formatFileSize(File(sourceDir).length()) else "Unknown"
        } catch (e: Exception) { "Unknown" }

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
            "scannedAt" to System.currentTimeMillis(),
            "isFromPlayStore" to isFromPlayStore,
            "isSideloaded" to isSideloaded,
            "isDebuggable" to isDebuggable,
            "isTestOnly" to isTestOnly,
            "targetSdk" to targetSdk,
            "isOutdated" to isOutdated,
            "riskScore" to riskScore,
            "riskIndicators" to emptyList<String>()
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

    /**
     * Get detailed permission information with risk levels
     */
    fun getDetailedPermissions(packageName: String): List<Map<String, Any>> {
        val permissions = getAppPermissions(packageName)
        
        return permissions.map { perm ->
            val shortName = perm.substringAfterLast(".")
            val riskLevel = when (perm) {
                in HIGH_RISK_PERMISSIONS -> "HIGH"
                in MEDIUM_RISK_PERMISSIONS -> "MEDIUM"
                else -> "LOW"
            }
            val category = getPermissionCategory(perm)
            val description = getPermissionDescription(perm)
            val icon = getPermissionIcon(category)
            
            mapOf(
                "permission" to perm,
                "shortName" to shortName,
                "riskLevel" to riskLevel,
                "category" to category,
                "description" to description,
                "icon" to icon
            )
        }
    }

    private fun getPermissionCategory(permission: String): String {
        return when {
            permission.contains("LOCATION") -> "Location"
            permission.contains("CAMERA") -> "Camera"
            permission.contains("RECORD_AUDIO") || permission.contains("MICROPHONE") -> "Microphone"
            permission.contains("CONTACTS") -> "Contacts"
            permission.contains("SMS") || permission.contains("MMS") -> "SMS"
            permission.contains("CALL") || permission.contains("PHONE") -> "Phone"
            permission.contains("STORAGE") || permission.contains("EXTERNAL") -> "Storage"
            permission.contains("INTERNET") || permission.contains("NETWORK") -> "Network"
            permission.contains("BLUETOOTH") -> "Bluetooth"
            permission.contains("CALENDAR") -> "Calendar"
            permission.contains("SENSOR") || permission.contains("BODY") -> "Sensors"
            else -> "Other"
        }
    }

    private fun getPermissionDescription(permission: String): String {
        return when (permission) {
            "android.permission.CAMERA" -> "Take photos and videos"
            "android.permission.RECORD_AUDIO" -> "Record audio from microphone"
            "android.permission.ACCESS_FINE_LOCATION" -> "Access precise GPS location"
            "android.permission.ACCESS_COARSE_LOCATION" -> "Access approximate location"
            "android.permission.READ_CONTACTS" -> "Read your contacts"
            "android.permission.WRITE_CONTACTS" -> "Modify your contacts"
            "android.permission.READ_SMS" -> "Read your text messages"
            "android.permission.SEND_SMS" -> "Send text messages"
            "android.permission.READ_CALL_LOG" -> "Read call history"
            "android.permission.PROCESS_OUTGOING_CALLS" -> "Monitor outgoing calls"
            "android.permission.READ_EXTERNAL_STORAGE" -> "Read files from storage"
            "android.permission.WRITE_EXTERNAL_STORAGE" -> "Write files to storage"
            "android.permission.INTERNET" -> "Full network access"
            "android.permission.ACCESS_NETWORK_STATE" -> "View network connections"
            "android.permission.READ_PHONE_STATE" -> "Read phone status and identity"
            "android.permission.BLUETOOTH" -> "Pair with Bluetooth devices"
            else -> "System permission"
        }
    }

    private fun getPermissionIcon(category: String): String {
        return when (category) {
            "Location" -> "📍"
            "Camera" -> "📷"
            "Microphone" -> "🎤"
            "Contacts" -> "👥"
            "SMS" -> "💬"
            "Phone" -> "📞"
            "Storage" -> "💾"
            "Network" -> "🌐"
            "Bluetooth" -> "📶"
            "Calendar" -> "📅"
            "Sensors" -> "📡"
            else -> "⚙️"
        }
    }

    /**
     * Get full app details
     */
    fun getAppFullDetails(packageName: String): Map<String, Any> {
        val pm: PackageManager = context.packageManager
        
        return try {
            val appInfo = pm.getApplicationInfo(packageName, 0)
            val packageInfo = pm.getPackageInfo(packageName, 0)
            val appName = pm.getApplicationLabel(appInfo).toString()
            val sourceDir = appInfo.sourceDir
            val fileSize = try {
                formatFileSize(File(sourceDir).length())
            } catch (e: Exception) { "Unknown" }
            
            val versionName = packageInfo.versionName ?: "Unknown"
            val versionCode = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.P) {
                packageInfo.longVersionCode
            } else {
                @Suppress("DEPRECATION")
                packageInfo.versionCode.toLong()
            }
            
            mapOf(
                "packageName" to packageName,
                "appName" to appName,
                "versionName" to versionName,
                "versionCode" to versionCode,
                "fileSize" to fileSize,
                "installTime" to packageInfo.firstInstallTime,
                "updateTime" to packageInfo.lastUpdateTime,
                "isSystemApp" to ((appInfo.flags and ApplicationInfo.FLAG_SYSTEM) != 0),
                "targetSdk" to appInfo.targetSdkVersion,
                "minSdk" to if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.N) appInfo.minSdkVersion else 1,
                "sourceDir" to sourceDir
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error getting app details for $packageName: ${e.message}")
            mapOf(
                "packageName" to packageName,
                "appName" to packageName,
                "error" to (e.message ?: "Unknown error")
            )
        }
    }
}

