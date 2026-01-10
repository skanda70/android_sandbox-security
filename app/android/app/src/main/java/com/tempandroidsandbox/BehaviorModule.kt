package com.tempandroidsandbox

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableArray
import com.facebook.react.bridge.WritableMap

class BehaviorModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    private val monitor = BehaviorMonitor(reactContext)

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
            val apps = monitor.listInstalledApps()
            val result: WritableArray = Arguments.createArray()
            
            apps.forEach { app ->
                val appMap: WritableMap = Arguments.createMap()
                appMap.putString("id", app["id"] as String)
                appMap.putString("fileName", app["fileName"] as String)
                appMap.putString("packageName", app["packageName"] as String)
                appMap.putString("fileType", app["fileType"] as String)
                appMap.putString("fileSize", app["fileSize"] as String)
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
            val analysis = monitor.analyzeAppRisk(packageName)
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
            val permissions = monitor.getAppPermissions(packageName)
            val result: WritableArray = Arguments.createArray()
            
            permissions.forEach { perm ->
                result.pushString(perm)
            }
            
            promise.resolve(result)
        } catch (e: Exception) {
            promise.reject("ERROR", "Failed to get permissions: ${e.message}")
        }
    }
}
