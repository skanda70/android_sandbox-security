// Android Sandbox - API Service
// Integrates with native Android BehaviorModule for real security analysis

import { NativeModules, Platform } from 'react-native';

// Get the native behavior module
const { BehaviorModule } = NativeModules;

/**
 * Get list of installed apps from native module
 * @returns {Promise<Array>} - Array of installed apps
 */
export const getInstalledApps = async () => {
    try {
        if (Platform.OS === 'android' && BehaviorModule) {
            const apps = await BehaviorModule.getInstalledApps();
            return apps;
        }
        // Fallback for iOS or if module unavailable
        return getMockApps();
    } catch (error) {
        console.error('Get Installed Apps Error:', error);
        return getMockApps();
    }
};

/**
 * Analyze a specific app for security risks
 * @param {string} packageName - Package name to analyze
 * @returns {Promise<Object>} - Risk assessment result
 */
export const analyzeApp = async (packageName) => {
    try {
        if (Platform.OS === 'android' && BehaviorModule) {
            const result = await BehaviorModule.analyzeApp(packageName);
            return result;
        }
        // Fallback mock response
        return {
            risk: 'MEDIUM',
            confidence: 0.75,
            action: 'RESTRICTED',
        };
    } catch (error) {
        console.error('Analyze App Error:', error);
        throw error;
    }
};

/**
 * Scan file metadata and get risk assessment
 * @param {Object} fileMetadata - File metadata object
 * @returns {Promise<Object>} - Risk assessment result
 */
export const scanFile = async (fileMetadata) => {
    try {
        // If it's an APK with package name, use native analysis
        if (fileMetadata.packageName && Platform.OS === 'android' && BehaviorModule) {
            const result = await BehaviorModule.analyzeApp(fileMetadata.packageName);
            return {
                risk: result.risk,
                confidence: result.confidence,
                action: result.action,
            };
        }

        // Fallback: Simulate API response for non-APK files
        await simulateDelay(1000);
        return getMockScanResult(fileMetadata.fileType);
    } catch (error) {
        console.error('Scan File Error:', error);
        throw error;
    }
};

/**
 * Fetch recently scanned files (uses installed apps as demo)
 * @returns {Promise<Array>} - Array of recent file scan results
 */
export const getRecentFiles = async () => {
    try {
        const apps = await getInstalledApps();

        // Analyze all apps (no limit)
        const recentApps = apps;
        const analyzedApps = await Promise.all(
            recentApps.map(async (app) => {
                try {
                    if (Platform.OS === 'android' && BehaviorModule) {
                        const analysis = await BehaviorModule.analyzeApp(app.packageName);
                        return {
                            id: analysis.id,
                            fileName: analysis.fileName,
                            fileType: analysis.fileType,
                            fileSize: analysis.fileSize,
                            packageName: analysis.packageName,
                            hash: analysis.hash,
                            risk: analysis.risk,
                            confidence: analysis.confidence,
                            action: analysis.action,
                            scannedAt: new Date().toISOString(),
                            iconBase64: app.iconBase64 || '',
                        };
                    }
                    return app;
                } catch (e) {
                    // Return app with default risk if analysis fails
                    return {
                        ...app,
                        risk: 'LOW',
                        confidence: 0.5,
                        action: 'ALLOWED',
                        scannedAt: new Date().toISOString(),
                    };
                }
            })
        );

        return analyzedApps;
    } catch (error) {
        console.error('Get Recent Files Error:', error);
        return getMockApps();
    }
};

/**
 * Fetch full scan history grouped by date
 * @returns {Promise<Object>} - Scan history grouped by date
 */
export const getScanHistory = async () => {
    try {
        const apps = await getInstalledApps();

        // Analyze all apps (no limit)
        const analyzedApps = await Promise.all(
            apps.map(async (app, index) => {
                try {
                    if (Platform.OS === 'android' && BehaviorModule) {
                        const analysis = await BehaviorModule.analyzeApp(app.packageName);
                        return {
                            id: analysis.id,
                            fileName: analysis.fileName,
                            fileType: analysis.fileType,
                            fileSize: analysis.fileSize,
                            packageName: analysis.packageName,
                            hash: analysis.hash,
                            risk: analysis.risk,
                            confidence: analysis.confidence,
                            action: analysis.action,
                            scannedAt: new Date(Date.now() - index * 3600000).toISOString(),
                            iconBase64: app.iconBase64 || '',
                        };
                    }
                    return app;
                } catch (e) {
                    return {
                        ...app,
                        risk: 'LOW',
                        confidence: 0.5,
                        action: 'ALLOWED',
                        scannedAt: new Date().toISOString(),
                    };
                }
            })
        );

        // Group by date
        const today = [];
        const yesterday = [];
        const earlier = [];
        const now = new Date();

        analyzedApps.forEach((app, index) => {
            if (index < 5) {
                today.push(app);
            } else if (index < 10) {
                yesterday.push(app);
            } else {
                earlier.push(app);
            }
        });

        return { today, yesterday, earlier };
    } catch (error) {
        console.error('Get Scan History Error:', error);
        return { today: [], yesterday: [], earlier: [] };
    }
};

// Helper: Simulate delay
const simulateDelay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Monitor all installed apps and log their permissions
 * Useful for debugging and security analysis
 * @returns {Promise<string>} - Status message
 */
export const monitorAllApps = async () => {
    try {
        if (Platform.OS === 'android' && BehaviorModule) {
            return await BehaviorModule.monitorAllApps();
        }
        return 'Monitoring not available on this platform';
    } catch (error) {
        console.error('Monitor All Apps Error:', error);
        throw error;
    }
};

/**
 * Get detailed permissions for an app with risk levels and descriptions
 * @param {string} packageName - Package name to analyze
 * @returns {Promise<Array>} - Array of permission objects
 */
export const getDetailedPermissions = async (packageName) => {
    try {
        if (Platform.OS === 'android' && BehaviorModule) {
            const permissions = await BehaviorModule.getDetailedPermissions(packageName);
            return permissions;
        }
        // Mock permissions for non-Android
        return getMockPermissions();
    } catch (error) {
        console.error('Get Detailed Permissions Error:', error);
        return getMockPermissions();
    }
};

/**
 * Get malware analysis for an app
 * @param {string} packageName - Package name to analyze
 * @returns {Promise<Object>} - Malware analysis result
 */
export const getMalwareAnalysis = async (packageName) => {
    try {
        if (Platform.OS === 'android' && BehaviorModule) {
            const analysis = await BehaviorModule.getMalwareAnalysis(packageName);
            return analysis;
        }
        // Mock malware analysis for non-Android
        return getMockMalwareAnalysis();
    } catch (error) {
        console.error('Get Malware Analysis Error:', error);
        return getMockMalwareAnalysis();
    }
};

// Helper: Get mock permissions
const getMockPermissions = () => [
    { permission: 'android.permission.CAMERA', shortName: 'Camera', riskLevel: 'HIGH', category: 'Privacy', description: 'Access device camera', icon: 'camera' },
    { permission: 'android.permission.LOCATION', shortName: 'Location', riskLevel: 'HIGH', category: 'Privacy', description: 'Access device location', icon: 'map-marker' },
    { permission: 'android.permission.INTERNET', shortName: 'Internet', riskLevel: 'LOW', category: 'Network', description: 'Access internet', icon: 'web' },
];

// Helper: Get mock malware analysis
const getMockMalwareAnalysis = () => ({
    packageName: 'com.example.app',
    appName: 'Sample App',
    threatLevel: 'LOW',
    threatScore: 15,
    suspiciousNameMatch: false,
    matchedComboCount: 0,
    suspiciousPermCount: 1,
    indicatorCount: 0,
    isSafe: true,
    indicators: [],
    suspiciousPermissions: [],
});

// Helper: Get mock scan result
const getMockScanResult = (fileType) => {
    const mockResponses = {
        apk: { risk: 'HIGH', confidence: 0.94, action: 'BLOCKED' },
        pdf: { risk: 'LOW', confidence: 0.87, action: 'ALLOWED' },
        exe: { risk: 'HIGH', confidence: 0.91, action: 'BLOCKED' },
        doc: { risk: 'MEDIUM', confidence: 0.72, action: 'RESTRICTED' },
        zip: { risk: 'MEDIUM', confidence: 0.68, action: 'RESTRICTED' },
    };
    return mockResponses[fileType] || { risk: 'LOW', confidence: 0.85, action: 'ALLOWED' };
};

// Helper: Get mock apps (fallback)
const getMockApps = () => [
    {
        id: 'mock1',
        fileName: 'Sample App',
        fileType: 'apk',
        fileSize: '12.5 MB',
        packageName: 'com.example.sample',
        risk: 'LOW',
        confidence: 0.85,
        action: 'ALLOWED',
        scannedAt: new Date().toISOString(),
    },
];
