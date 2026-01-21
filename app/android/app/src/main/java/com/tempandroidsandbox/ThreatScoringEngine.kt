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

/**
 * ThreatScoringEngine - Advanced App Risk Analyzer
 * 
 * Implements a weighted, context-aware scoring model to detect malicious 
 * or high-risk behavior while minimizing false positives.
 * 
 * Risk Score: 0-100
 * - LOW (0-19): Safe
 * - MEDIUM (20-44): Monitor
 * - HIGH (45-100): Review
 */
class ThreatScoringEngine(private val context: Context) {

    companion object {
        private const val TAG = "ThreatScoringEngine"
        
        // High-risk permissions: 10 points each
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
        
        // Medium-risk permissions: 4 points each
        private val MEDIUM_RISK_PERMISSIONS = listOf(
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.WRITE_EXTERNAL_STORAGE",
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.READ_PHONE_STATE",
            "android.permission.BLUETOOTH"
        )
        
        // Runtime/Behavioral permissions
        private const val PERM_ACCESSIBILITY = "android.permission.BIND_ACCESSIBILITY_SERVICE"
        private const val PERM_OVERLAY = "android.permission.SYSTEM_ALERT_WINDOW"
        private const val PERM_BOOT = "android.permission.RECEIVE_BOOT_COMPLETED"
        private const val PERM_INTERNET = "android.permission.INTERNET"
        
        // App categories that justify certain permissions
        private val CAMERA_APPS = listOf("camera", "photo", "video", "scanner", "qr", "barcode")
        private val MESSAGING_APPS = listOf("message", "sms", "chat", "whatsapp", "telegram", "messenger", "signal")
        private val SOCIAL_APPS = listOf("social", "facebook", "instagram", "twitter", "tiktok", "snapchat")
        private val CALL_APPS = listOf("phone", "dialer", "call", "zoom", "meet", "teams", "skype")
        private val LOCATION_APPS = listOf("map", "navigation", "gps", "uber", "lyft", "delivery", "weather")
        
        // Trusted package prefixes
        private val TRUSTED_PREFIXES = listOf(
            "com.google.",
            "com.android.",
            "com.samsung.",
            "com.sec.",
            "com.miui.",
            "com.huawei."
        )
    }

    /**
     * Data class for risk factors with explainability
     */
    data class RiskFactor(
        val category: String,
        val description: String,
        val points: Int
    )

    /**
     * List all installed applications with launcher activity
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
     * Get app permissions
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
     * Infer app category from package name and app name
     */
    private fun inferAppCategory(packageName: String, appName: String): String {
        val lowerPkg = packageName.lowercase()
        val lowerName = appName.lowercase()
        
        return when {
            CAMERA_APPS.any { lowerPkg.contains(it) || lowerName.contains(it) } -> "camera"
            MESSAGING_APPS.any { lowerPkg.contains(it) || lowerName.contains(it) } -> "messaging"
            SOCIAL_APPS.any { lowerPkg.contains(it) || lowerName.contains(it) } -> "social"
            CALL_APPS.any { lowerPkg.contains(it) || lowerName.contains(it) } -> "communication"
            LOCATION_APPS.any { lowerPkg.contains(it) || lowerName.contains(it) } -> "location"
            lowerPkg.contains("game") || lowerName.contains("game") -> "game"
            lowerPkg.contains("flashlight") || lowerName.contains("flashlight") -> "utility"
            lowerPkg.contains("calculator") || lowerName.contains("calculator") -> "utility"
            else -> "unknown"
        }
    }

    /**
     * Check if permission is contextually appropriate for app category
     */
    private fun isPermissionContextuallyAppropriate(permission: String, category: String): Boolean {
        return when {
            permission.contains("CAMERA") -> category in listOf("camera", "social", "communication", "messaging")
            permission.contains("RECORD_AUDIO") -> category in listOf("camera", "communication", "social")
            permission.contains("LOCATION") -> category in listOf("location", "social", "communication")
            permission.contains("CONTACTS") -> category in listOf("messaging", "social", "communication")
            permission.contains("SMS") -> category in listOf("messaging")
            permission.contains("CALL_LOG") -> category in listOf("communication")
            else -> true // Other permissions are generally acceptable
        }
    }

    /**
     * Detect suspicious permission combinations
     */
    private fun detectSuspiciousCombos(
        permissions: Set<String>,
        category: String,
        riskFactors: MutableList<RiskFactor>
    ): Boolean {
        val hasInternet = permissions.any { it.contains("INTERNET") }
        val hasSms = permissions.any { it.contains("SMS") }
        val hasContacts = permissions.any { it.contains("CONTACTS") }
        val hasCallLog = permissions.any { it.contains("CALL_LOG") }
        val hasCamera = permissions.any { it.contains("CAMERA") }
        val hasAudio = permissions.any { it.contains("RECORD_AUDIO") }
        val hasLocation = permissions.any { it.contains("LOCATION") }
        
        var hasSuspiciousCombo = false
        
        // SMS + Internet (not messaging app)
        if (hasSms && hasInternet && category != "messaging") {
            riskFactors.add(RiskFactor("Suspicious Combo", "SMS + Internet access (not a messaging app)", 35))
            hasSuspiciousCombo = true
        }
        
        // Contacts + SMS + Internet
        if (hasContacts && hasSms && hasInternet && category !in listOf("messaging", "social")) {
            riskFactors.add(RiskFactor("Suspicious Combo", "Contacts + SMS + Internet (data exfiltration pattern)", 35))
            hasSuspiciousCombo = true
        }
        
        // Call log + SMS + Internet
        if (hasCallLog && hasSms && hasInternet && category != "communication") {
            riskFactors.add(RiskFactor("Suspicious Combo", "Call Log + SMS + Internet (spyware pattern)", 35))
            hasSuspiciousCombo = true
        }
        
        // Surveillance pattern
        if (hasCamera && hasAudio && hasLocation && hasContacts && category !in listOf("social", "communication")) {
            riskFactors.add(RiskFactor("Suspicious Combo", "Camera + Microphone + Location + Contacts (surveillance pattern)", 35))
            hasSuspiciousCombo = true
        }
        
        return hasSuspiciousCombo
    }

    /**
     * Main risk analysis function with full explainability
     */
    fun analyzeAppRisk(packageName: String): Map<String, Any> {
        val pm: PackageManager = context.packageManager
        val riskFactors = mutableListOf<RiskFactor>()
        
        // Get app info
        val appInfo = try {
            pm.getApplicationInfo(packageName, 0)
        } catch (e: Exception) {
            null
        }
        
        val packageInfo = try {
            pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS or PackageManager.GET_SERVICES)
        } catch (e: Exception) {
            null
        }
        
        val permissions = packageInfo?.requestedPermissions?.toSet() ?: emptySet()
        val isSystemApp = appInfo?.let { (it.flags and ApplicationInfo.FLAG_SYSTEM) != 0 } ?: false
        val appName = appInfo?.let { pm.getApplicationLabel(it).toString() } ?: packageName
        
        // Infer app category for context-aware scoring
        val appCategory = inferAppCategory(packageName, appName)
        
        // Check trusted status
        val isTrustedPublisher = TRUSTED_PREFIXES.any { packageName.startsWith(it) }
        val isPrivApp = appInfo?.sourceDir?.contains("/system/priv-app") ?: false
        val isTrusted = isSystemApp || isTrustedPublisher || isPrivApp
        
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
        val isThirdPartyStore = !isFromPlayStore && !isSideloaded && installerPackage != null
        
        // Build flags
        val isDebuggable = appInfo?.let { (it.flags and ApplicationInfo.FLAG_DEBUGGABLE) != 0 } ?: false
        val isTestOnly = appInfo?.let { (it.flags and ApplicationInfo.FLAG_TEST_ONLY) != 0 } ?: false
        
        // Platform/maintenance info
        val targetSdk = appInfo?.targetSdkVersion ?: 0
        val lastUpdateTime = packageInfo?.lastUpdateTime ?: 0L
        val currentTime = System.currentTimeMillis()
        val twoYearsMs = 2L * 365 * 24 * 60 * 60 * 1000
        val isOutdated = lastUpdateTime > 0 && (currentTime - lastUpdateTime) > twoYearsMs
        val hasOldTargetSdk = targetSdk > 0 && targetSdk < 29
        
        // Count permissions
        val highRiskCount = permissions.count { it in HIGH_RISK_PERMISSIONS }
        val mediumRiskCount = permissions.count { it in MEDIUM_RISK_PERMISSIONS }
        
        var riskScore = 0
        var forceHigh = false
        
        if (isTrusted) {
            // Trusted apps are always LOW
            riskScore = 0
            riskFactors.add(RiskFactor("Trusted", "System or verified publisher app", 0))
        } else {
            // === Permission scoring with context awareness ===
            for (perm in permissions) {
                val isAppropriate = isPermissionContextuallyAppropriate(perm, appCategory)
                when {
                    perm in HIGH_RISK_PERMISSIONS -> {
                        val points = if (isAppropriate) 10 else 15 // 1.5x if inappropriate
                        riskScore += points
                        if (!isAppropriate) {
                            riskFactors.add(RiskFactor("Permission", "${perm.substringAfterLast(".")} (unusual for $appCategory app)", points))
                        }
                    }
                    perm in MEDIUM_RISK_PERMISSIONS -> {
                        val points = if (isAppropriate) 4 else 6
                        riskScore += points
                    }
                }
            }
            
            // === Suspicious combos (+35, force HIGH) ===
            val hasSuspiciousCombo = detectSuspiciousCombos(permissions, appCategory, riskFactors)
            if (hasSuspiciousCombo) {
                forceHigh = true
            }
            
            // === Installation signals ===
            if (isSideloaded) {
                val hasHighRiskPerms = highRiskCount > 0
                val points = if (hasHighRiskPerms) 30 else 20
                riskScore += points
                riskFactors.add(RiskFactor("Installation", "Sideloaded (not from Play Store)" + if (hasHighRiskPerms) " with high-risk permissions" else "", points))
            } else if (isThirdPartyStore) {
                riskScore += 15
                riskFactors.add(RiskFactor("Installation", "Installed from third-party store", 15))
            }
            
            // === Debuggable (+30, force HIGH if combined) ===
            if (isDebuggable) {
                riskScore += 30
                riskFactors.add(RiskFactor("Build", "App is debuggable (security vulnerability)", 30))
                if (isSideloaded || hasSuspiciousCombo) {
                    forceHigh = true
                }
            }
            
            // === Test-only (+25) ===
            if (isTestOnly) {
                riskScore += 25
                riskFactors.add(RiskFactor("Build", "Test-only build", 25))
            }
            
            // === Platform signals ===
            if (hasOldTargetSdk) {
                riskScore += 15
                riskFactors.add(RiskFactor("Platform", "Targets outdated Android (SDK $targetSdk < 29)", 15))
            }
            
            if (isOutdated) {
                riskScore += 10
                riskFactors.add(RiskFactor("Maintenance", "Not updated in over 2 years", 10))
            }
            
            // === Runtime/Behavioral signals ===
            if (permissions.contains(PERM_ACCESSIBILITY)) {
                riskScore += 40
                riskFactors.add(RiskFactor("Runtime", "Uses Accessibility Service (can read screen)", 40))
            }
            
            if (permissions.contains(PERM_OVERLAY)) {
                riskScore += 25
                riskFactors.add(RiskFactor("Runtime", "Can draw over other apps (overlay attacks)", 25))
            }
            
            if (permissions.contains(PERM_BOOT) && permissions.contains(PERM_INTERNET)) {
                riskScore += 15
                riskFactors.add(RiskFactor("Runtime", "Auto-starts on boot with internet access", 15))
            }
            
            // Check for excessive services
            val serviceCount = packageInfo?.services?.size ?: 0
            if (serviceCount > 5) {
                riskScore += 10
                riskFactors.add(RiskFactor("Runtime", "Excessive background services ($serviceCount)", 10))
            }
        }
        
        // Cap score
        riskScore = minOf(100, riskScore)
        
        // Determine risk level
        val riskLevel = when {
            isTrusted -> "LOW"
            forceHigh -> "HIGH"
            riskScore >= 45 -> "HIGH"
            riskScore >= 20 -> "MEDIUM"
            else -> "LOW"
        }
        
        val action = when (riskLevel) {
            "HIGH" -> "REVIEW"
            "MEDIUM" -> "MONITOR"
            else -> "SAFE"
        }
        
        // Confidence calculation
        val signalCount = listOf(!isSideloaded, targetSdk > 0, lastUpdateTime > 0).count { it }
        val confidence = minOf(0.99, 0.70 + (permissions.size * 0.01) + (signalCount * 0.05))
        
        val sourceDir = appInfo?.sourceDir ?: ""
        val fileSize = try {
            if (sourceDir.isNotEmpty()) formatFileSize(File(sourceDir).length()) else "Unknown"
        } catch (e: Exception) { "Unknown" }
        
        // Convert risk factors to list of maps for JS
        val riskIndicators = riskFactors.map { "${it.category}: ${it.description} (+${it.points})" }
        val riskBreakdown = riskFactors.map { 
            mapOf("category" to it.category, "description" to it.description, "points" to it.points) 
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
            "scannedAt" to System.currentTimeMillis(),
            "isFromPlayStore" to isFromPlayStore,
            "isSideloaded" to isSideloaded,
            "isDebuggable" to isDebuggable,
            "isTestOnly" to isTestOnly,
            "targetSdk" to targetSdk,
            "isOutdated" to isOutdated,
            "riskScore" to riskScore,
            "appCategory" to appCategory,
            "isTrusted" to isTrusted,
            "riskIndicators" to riskIndicators,
            "riskBreakdown" to riskBreakdown
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
            permission.contains("ACCESSIBILITY") -> "Accessibility"
            permission.contains("ALERT_WINDOW") -> "Overlay"
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
            "android.permission.BIND_ACCESSIBILITY_SERVICE" -> "Read and control screen content"
            "android.permission.SYSTEM_ALERT_WINDOW" -> "Draw over other apps"
            "android.permission.RECEIVE_BOOT_COMPLETED" -> "Start at device boot"
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
            "Accessibility" -> "♿"
            "Overlay" -> "🪟"
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
