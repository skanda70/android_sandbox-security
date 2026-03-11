package com.tempandroidsandbox

import android.content.Context
import android.content.pm.PackageManager
import android.util.Log

/**
 * NetworkAnalyzer - Analyzes app network capabilities and data risks
 * Detects apps with potentially dangerous network behavior patterns
 */
class NetworkAnalyzer(private val context: Context) {

    companion object {
        private const val TAG = "NetworkAnalyzer"

        // Network-related permissions
        private val NETWORK_PERMISSIONS = listOf(
            "android.permission.INTERNET",
            "android.permission.ACCESS_NETWORK_STATE",
            "android.permission.ACCESS_WIFI_STATE",
            "android.permission.CHANGE_WIFI_STATE",
            "android.permission.CHANGE_NETWORK_STATE"
        )

        // Permissions that combined with INTERNET are risky (data exfiltration)
        private val DATA_EXFIL_PERMISSIONS = listOf(
            "android.permission.READ_CONTACTS",
            "android.permission.READ_SMS",
            "android.permission.READ_CALL_LOG",
            "android.permission.ACCESS_FINE_LOCATION",
            "android.permission.ACCESS_COARSE_LOCATION",
            "android.permission.READ_EXTERNAL_STORAGE",
            "android.permission.CAMERA",
            "android.permission.RECORD_AUDIO",
            "android.permission.READ_PHONE_STATE"
        )
    }

    /**
     * Analyze network capabilities and risks for an app
     */
    fun analyzeApp(packageName: String): Map<String, Any> {
        val pm: PackageManager = context.packageManager

        return try {
            val packageInfo = pm.getPackageInfo(packageName, PackageManager.GET_PERMISSIONS)
            val permissions = packageInfo.requestedPermissions?.toList() ?: emptyList()

            val hasInternet = permissions.contains("android.permission.INTERNET")
            val networkPerms = permissions.filter { it in NETWORK_PERMISSIONS }
            val dataExfilPerms = permissions.filter { it in DATA_EXFIL_PERMISSIONS }

            // Calculate data exfiltration risk
            val exfilRiskScore = if (hasInternet && dataExfilPerms.isNotEmpty()) {
                minOf(100, dataExfilPerms.size * 20)
            } else 0

            // Determine risk level
            val riskLevel = when {
                exfilRiskScore >= 60 -> "HIGH"
                exfilRiskScore >= 30 -> "MEDIUM"
                else -> "LOW"
            }

            // Check for cleartext traffic (less secure)
            val usesCleartext = try {
                val appInfo = pm.getApplicationInfo(packageName, PackageManager.GET_META_DATA)
                // Check if app targets lower SDK or explicitly allows cleartext
                appInfo.targetSdkVersion < 28
            } catch (e: Exception) {
                false
            }

            mapOf(
                "hasInternet" to hasInternet,
                "networkPermissions" to networkPerms,
                "networkPermissionCount" to networkPerms.size,
                "dataExfilPermissions" to dataExfilPerms,
                "dataExfilPermissionCount" to dataExfilPerms.size,
                "exfilRiskScore" to exfilRiskScore,
                "riskLevel" to riskLevel,
                "usesCleartext" to usesCleartext,
                "canAccessWifi" to permissions.contains("android.permission.ACCESS_WIFI_STATE"),
                "canChangeNetwork" to permissions.contains("android.permission.CHANGE_NETWORK_STATE"),
                "networkCapabilities" to buildNetworkCapabilityList(permissions)
            )
        } catch (e: Exception) {
            Log.e(TAG, "Error analyzing network for $packageName: ${e.message}")
            mapOf(
                "hasInternet" to false,
                "networkPermissions" to emptyList<String>(),
                "networkPermissionCount" to 0,
                "dataExfilPermissions" to emptyList<String>(),
                "dataExfilPermissionCount" to 0,
                "exfilRiskScore" to 0,
                "riskLevel" to "UNKNOWN",
                "usesCleartext" to false,
                "canAccessWifi" to false,
                "canChangeNetwork" to false,
                "networkCapabilities" to emptyList<String>()
            )
        }
    }

    /**
     * Build human-readable network capability list
     */
    private fun buildNetworkCapabilityList(permissions: List<String>): List<String> {
        val capabilities = mutableListOf<String>()

        if (permissions.contains("android.permission.INTERNET")) {
            capabilities.add("Internet Access")
        }
        if (permissions.contains("android.permission.ACCESS_NETWORK_STATE")) {
            capabilities.add("Network State Monitoring")
        }
        if (permissions.contains("android.permission.ACCESS_WIFI_STATE")) {
            capabilities.add("WiFi State Access")
        }
        if (permissions.contains("android.permission.CHANGE_WIFI_STATE")) {
            capabilities.add("WiFi Control")
        }
        if (permissions.contains("android.permission.CHANGE_NETWORK_STATE")) {
            capabilities.add("Network Control")
        }
        if (permissions.contains("android.permission.BLUETOOTH")) {
            capabilities.add("Bluetooth Access")
        }
        if (permissions.contains("android.permission.BLUETOOTH_ADMIN")) {
            capabilities.add("Bluetooth Control")
        }
        if (permissions.contains("android.permission.NFC")) {
            capabilities.add("NFC Access")
        }

        return capabilities
    }
}
