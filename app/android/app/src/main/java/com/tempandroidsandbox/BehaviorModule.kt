package com.tempandroidsandbox

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

class BehaviorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val threatEngine = ThreatScoringEngine(reactContext)
    private val networkAnalyzer = NetworkAnalyzer(reactContext)
    private val malwareDetector = MalwareDetector(reactContext)

    override fun getName(): String {
        return "BehaviorModule"
    }

    /**
     * Get list of all installed user apps
     * Called from React Native: BehaviorModule.getInstalledApps()
     */
    @ReactMethod
    fun getInstalledApps(promise: Promise) {
        try {
            val apps = threatEngine.listInstalledApps()
            val result: WritableArray = Arguments.createArray()
            
            apps.forEach { app ->
                val appMap: WritableMap = Arguments.createMap()
                appMap.putString("id", app["id"] as String)
                appMap.putString("fileName", app["fileName"] as String)
                appMap.putString("packageName", app["packageName"] as String)
                appMap.putString("fileType", app["fileType"] as String)
                appMap.putString("fileSize", app["fileSize"] as String)
                appMap.putBoolean("isSystemApp", app["isSystemApp"] as Boolean)
                appMap.putString("iconBase64", app["iconBase64"] as String)
                result.pushMap(appMap)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get installed apps: ${e.message}")
        }
    }

    /**
     * Analyze a specific app for security risks
     * Called from React Native: BehaviorModule.analyzeApp(packageName)
     */
    @ReactMethod
    fun analyzeApp(packageName: String, promise: Promise) {
        try {
            val analysis = threatEngine.analyzeAppRisk(packageName)
            val result: WritableMap = Arguments.createMap()
            
            result.putString("id", analysis["id"] as String)
            result.putString("fileName", analysis["fileName"] as String)
            result.putString("packageName", analysis["packageName"] as String)
            result.putString("fileType", analysis["fileType"] as String)
            result.putString("fileSize", analysis["fileSize"] as String)
            result.putString("hash", analysis["hash"] as String)
            result.putString("risk", analysis["risk"] as String)
            result.putDouble("confidence", analysis["confidence"] as Double)
            result.putString("action", analysis["action"] as String)
            result.putInt("permissionCount", analysis["permissionCount"] as Int)
            result.putInt("highRiskPerms", analysis["highRiskPerms"] as Int)
            result.putInt("mediumRiskPerms", analysis["mediumRiskPerms"] as Int)
            result.putDouble("scannedAt", (analysis["scannedAt"] as Long).toDouble())
            
            // Enhanced risk fields
            result.putBoolean("isFromPlayStore", analysis["isFromPlayStore"] as Boolean)
            result.putBoolean("isSideloaded", analysis["isSideloaded"] as Boolean)
            result.putBoolean("isDebuggable", analysis["isDebuggable"] as Boolean)
            result.putBoolean("isTestOnly", analysis["isTestOnly"] as Boolean)
            result.putInt("targetSdk", analysis["targetSdk"] as Int)
            result.putBoolean("isOutdated", analysis["isOutdated"] as Boolean)
            result.putInt("riskScore", analysis["riskScore"] as Int)
            result.putString("appCategory", analysis["appCategory"] as String)
            result.putBoolean("isTrusted", analysis["isTrusted"] as Boolean)
            
            // Risk indicators (string array)
            val indicators: WritableArray = Arguments.createArray()
            @Suppress("UNCHECKED_CAST")
            (analysis["riskIndicators"] as List<String>).forEach { ind ->
                indicators.pushString(ind)
            }
            result.putArray("riskIndicators", indicators)
            
            // Risk breakdown (array of objects for explainability)
            val breakdown: WritableArray = Arguments.createArray()
            @Suppress("UNCHECKED_CAST")
            (analysis["riskBreakdown"] as List<Map<String, Any>>).forEach { factor ->
                val factorMap: WritableMap = Arguments.createMap()
                factorMap.putString("category", factor["category"] as String)
                factorMap.putString("description", factor["description"] as String)
                factorMap.putInt("points", factor["points"] as Int)
                breakdown.pushMap(factorMap)
            }
            result.putArray("riskBreakdown", breakdown)
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to analyze app: ${e.message}")
        }
    }

    /**
     * Get permissions for a specific app
     * Called from React Native: BehaviorModule.getAppPermissions(packageName)
     */
    @ReactMethod
    fun getAppPermissions(packageName: String, promise: Promise) {
        try {
            val permissions = threatEngine.getAppPermissions(packageName)
            val result: WritableArray = Arguments.createArray()
            
            permissions.forEach { perm ->
                result.pushString(perm)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get permissions: ${e.message}")
        }
    }

    /**
     * Monitor all installed apps and log their permissions
     * Called from React Native: BehaviorModule.monitorAllApps()
     */
    @ReactMethod
    fun monitorAllApps(promise: Promise) {
        try {
            threatEngine.monitorAppBehavior()
            promise.resolve("Monitoring complete - check logcat for results")
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to monitor apps: ${e.message}")
        }
    }

    /**
     * Get detailed permissions with risk levels and descriptions
     * Called from React Native: BehaviorModule.getDetailedPermissions(packageName)
     */
    @ReactMethod
    fun getDetailedPermissions(packageName: String, promise: Promise) {
        try {
            val permissions = threatEngine.getDetailedPermissions(packageName)
            val result: WritableArray = Arguments.createArray()
            
            permissions.forEach { perm ->
                val permMap: WritableMap = Arguments.createMap()
                permMap.putString("permission", perm["permission"] as String)
                permMap.putString("shortName", perm["shortName"] as String)
                permMap.putString("riskLevel", perm["riskLevel"] as String)
                permMap.putString("category", perm["category"] as String)
                permMap.putString("description", perm["description"] as String)
                permMap.putString("icon", perm["icon"] as String)
                result.pushMap(permMap)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get detailed permissions: ${e.message}")
        }
    }

    /**
     * Get network analysis for an app
     * Called from React Native: BehaviorModule.getNetworkAnalysis(packageName)
     */
    @ReactMethod
    fun getNetworkAnalysis(packageName: String, promise: Promise) {
        try {
            val analysis = networkAnalyzer.analyzeApp(packageName)
            val result: WritableMap = Arguments.createMap()
            
            result.putBoolean("hasInternet", analysis["hasInternet"] as Boolean)
            result.putInt("networkPermissionCount", analysis["networkPermissionCount"] as Int)
            result.putInt("dataExfilPermissionCount", analysis["dataExfilPermissionCount"] as Int)
            result.putInt("exfilRiskScore", analysis["exfilRiskScore"] as Int)
            result.putString("riskLevel", analysis["riskLevel"] as String)
            result.putBoolean("usesCleartext", analysis["usesCleartext"] as Boolean)
            result.putBoolean("canAccessWifi", analysis["canAccessWifi"] as Boolean)
            result.putBoolean("canChangeNetwork", analysis["canChangeNetwork"] as Boolean)
            
            // Network capabilities array
            val capabilities: WritableArray = Arguments.createArray()
            @Suppress("UNCHECKED_CAST")
            (analysis["networkCapabilities"] as List<String>).forEach { cap ->
                capabilities.pushString(cap)
            }
            result.putArray("networkCapabilities", capabilities)
            
            // Data exfil permissions array
            val exfilPerms: WritableArray = Arguments.createArray()
            @Suppress("UNCHECKED_CAST")
            (analysis["dataExfilPermissions"] as List<String>).forEach { perm ->
                exfilPerms.pushString(perm)
            }
            result.putArray("dataExfilPermissions", exfilPerms)
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get network analysis: ${e.message}")
        }
    }

    /**
     * Get malware analysis for an app
     * Called from React Native: BehaviorModule.getMalwareAnalysis(packageName)
     */
    @ReactMethod
    fun getMalwareAnalysis(packageName: String, promise: Promise) {
        try {
            val analysis = malwareDetector.analyzeApp(packageName)
            val result: WritableMap = Arguments.createMap()
            
            result.putString("packageName", analysis["packageName"] as String)
            result.putString("appName", analysis["appName"] as String)
            result.putString("threatLevel", analysis["threatLevel"] as String)
            result.putInt("threatScore", analysis["threatScore"] as Int)
            result.putBoolean("suspiciousNameMatch", analysis["suspiciousNameMatch"] as Boolean)
            result.putInt("matchedComboCount", analysis["matchedComboCount"] as Int)
            result.putInt("suspiciousPermCount", analysis["suspiciousPermCount"] as Int)
            result.putInt("indicatorCount", analysis["indicatorCount"] as Int)
            result.putBoolean("isSafe", analysis["isSafe"] as Boolean)
            result.putDouble("scanTimestamp", (analysis["scanTimestamp"] as Long).toDouble())
            
            // Indicators array
            val indicators: WritableArray = Arguments.createArray()
            @Suppress("UNCHECKED_CAST")
            (analysis["indicators"] as List<String>).forEach { ind ->
                indicators.pushString(ind)
            }
            result.putArray("indicators", indicators)
            
            // Suspicious permissions array
            val suspPerms: WritableArray = Arguments.createArray()
            @Suppress("UNCHECKED_CAST")
            (analysis["suspiciousPermissions"] as List<String>).forEach { perm ->
                suspPerms.pushString(perm)
            }
            result.putArray("suspiciousPermissions", suspPerms)
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get malware analysis: ${e.message}")
        }
    }

    /**
     * Get full app details
     * Called from React Native: BehaviorModule.getAppFullDetails(packageName)
     */
    @ReactMethod
    fun getAppFullDetails(packageName: String, promise: Promise) {
        try {
            val details = threatEngine.getAppFullDetails(packageName)
            val result: WritableMap = Arguments.createMap()
            
            result.putString("packageName", details["packageName"] as String)
            result.putString("appName", details["appName"] as String)
            
            if (details.containsKey("error")) {
                result.putString("error", details["error"] as String)
            } else {
                result.putString("versionName", details["versionName"] as String)
                result.putDouble("versionCode", (details["versionCode"] as Long).toDouble())
                result.putString("fileSize", details["fileSize"] as String)
                result.putDouble("installTime", (details["installTime"] as Long).toDouble())
                result.putDouble("updateTime", (details["updateTime"] as Long).toDouble())
                result.putBoolean("isSystemApp", details["isSystemApp"] as Boolean)
                result.putInt("targetSdk", details["targetSdk"] as Int)
                result.putInt("minSdk", details["minSdk"] as Int)
                result.putString("sourceDir", details["sourceDir"] as String)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get app details: ${e.message}")
        }
    }

    /**
     * Open app settings page
     * Called from React Native: BehaviorModule.openAppSettings(packageName)
     */
    @ReactMethod
    fun openAppSettings(packageName: String, promise: Promise) {
        try {
            val intent = android.content.Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
            intent.data = android.net.Uri.parse("package:$packageName")
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to open app settings: ${e.message}")
        }
    }

    /**
     * Trigger app uninstall dialog
     * Called from React Native: BehaviorModule.uninstallApp(packageName)
     */
    @ReactMethod
    fun uninstallApp(packageName: String, promise: Promise) {
        try {
            val intent = android.content.Intent(android.content.Intent.ACTION_DELETE)
            intent.data = android.net.Uri.parse("package:$packageName")
            intent.addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to uninstall app: ${e.message}")
        }
    }
}

