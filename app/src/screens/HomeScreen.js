// HomeScreen
// Main landing screen with scan button and recent files list

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    StatusBar,
    Image,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';
import { getRecentFiles, scanFile, analyzeApp, getDetailedPermissions, getMalwareAnalysis, getInstalledApps } from '../services/api';
import FileCard from '../components/FileCard';
import ScanButton from '../components/ScanButton';
import AppSelectionModal from '../components/AppSelectionModal';

// Import the logo
const AppLogo = require('../assets/logo.png');

/**
 * Home Screen - Main landing page
 * Shows app title, scan button, and recent files
 */
const HomeScreen = ({ navigation }) => {
    const [recentFiles, setRecentFiles] = useState([]);
    const [allApps, setAllApps] = useState([]);
    const [loading, setLoading] = useState(false);
    const [appsLoading, setAppsLoading] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Fetch recent files on mount
    useEffect(() => {
        fetchRecentFiles();
    }, []);

    const fetchRecentFiles = async () => {
        setLoading(true);
        try {
            const files = await getRecentFiles();
            setRecentFiles(files);
        } catch (error) {
            console.error('Failed to fetch recent files:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle scan button press - open app selection modal and fetch apps
    const handleScan = async () => {
        setModalVisible(true);
        setAppsLoading(true);
        try {
            const apps = await getInstalledApps();
            setAllApps(apps);
        } catch (error) {
            console.error('Failed to fetch apps for selection:', error);
        } finally {
            setAppsLoading(false);
        }
    };

    // Handle app selection from modal - perform deep scan
    const handleAppSelect = async (app) => {
        setModalVisible(false);
        setScanning(true);
        try {
            // Perform deep scan: basic analysis + detailed permissions + malware analysis
            const [basicResult, permissions, malwareAnalysis] = await Promise.all([
                analyzeApp(app.packageName),
                getDetailedPermissions(app.packageName),
                getMalwareAnalysis(app.packageName),
            ]);

            // Navigate to scan result screen with comprehensive deep scan data
            navigation.navigate('ScanResult', {
                file: {
                    fileName: app.fileName || app.appName,
                    fileType: 'apk',
                    fileSize: app.fileSize || 'N/A',
                    hash: app.hash || `sha256-${app.packageName}`,
                    packageName: app.packageName,
                    iconBase64: app.iconBase64,
                },
                result: {
                    risk: basicResult.risk,
                    confidence: basicResult.confidence,
                    action: basicResult.action,
                    packageName: app.packageName,
                    // Deep scan data
                    permissions: permissions,
                    malwareAnalysis: malwareAnalysis,
                },
            });
        } catch (error) {
            console.error('Deep scan failed:', error);
        } finally {
            setScanning(false);
        }
    };

    // Handle file card press - view scan result
    const handleFilePress = (file) => {
        navigation.navigate('ScanResult', {
            file: {
                fileName: file.fileName,
                fileType: file.fileType,
                fileSize: file.fileSize,
                hash: file.hash,
                packageName: file.packageName,
                iconBase64: file.iconBase64,
            },
            result: {
                risk: file.risk,
                confidence: file.confidence,
                action: file.action,
                packageName: file.packageName,
            },
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={AppLogo}
                            style={styles.appLogo}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.title}>Hexlab</Text>
                    <Text style={styles.subtitle}>Security Analysis Platform</Text>
                </View>

                {/* Scan Button Section */}
                <View style={styles.scanSection}>
                    <ScanButton
                        onPress={handleScan}
                        loading={scanning}
                        label="Start Security Scan"
                    />
                    <Text style={styles.scanHint}>
                        Analyze installed apps for permissions and threats
                    </Text>
                </View>

                {/* Recent Files Section */}
                <View style={styles.recentSection}>
                    <Text style={styles.sectionTitle}>Installed Apps</Text>

                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <Text style={styles.loadingText}>Loading...</Text>
                        </View>
                    ) : recentFiles.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <MaterialCommunityIcons name="shield-search" size={60} color={COLORS.textMuted} style={styles.emptyIcon} />
                            <Text style={styles.emptyText}>No recent scans</Text>
                            <Text style={styles.emptyHint}>
                                Tap "Start Security Scan" to analyze your first app
                            </Text>
                        </View>
                    ) : (
                        recentFiles.map((file) => (
                            <FileCard
                                key={file.id}
                                file={file}
                                onPress={() => handleFilePress(file)}
                            />
                        ))
                    )}
                </View>
            </ScrollView>

            {/* App Selection Modal */}
            <AppSelectionModal
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                onSelectApp={handleAppSelect}
                apps={allApps}
                loading={appsLoading}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    header: {
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
    },
    logoContainer: {
        width: 120,
        height: 120,
        marginBottom: 12,
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 20,
        transform: [{ rotate: '0deg' }],
    },
    appLogo: {
        width: 280,
        height: 280,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.textPrimary,
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 6,
    },
    scanSection: {
        alignItems: 'center',
        paddingVertical: 30,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        marginBottom: 24,
    },
    scanHint: {
        fontSize: 13,
        color: COLORS.textMuted,
        marginTop: 14,
    },
    recentSection: {
        flex: 1,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 16,
        marginLeft: 4,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 40,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    emptyIcon: {
        marginBottom: 16,
        opacity: 0.5,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    emptyHint: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
});

export default HomeScreen;
