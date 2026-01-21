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
import { getRecentFiles, scanFile } from '../services/api';
import FileCard from '../components/FileCard';
import ScanButton from '../components/ScanButton';

// Import the logo
const AppLogo = require('../assets/logo.png');

/**
 * Home Screen - Main landing page
 * Shows app title, scan button, and recent files
 */
const HomeScreen = ({ navigation }) => {
    const [recentFiles, setRecentFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scanning, setScanning] = useState(false);

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

    // Handle scan button press
    const handleScan = async () => {
        setScanning(true);
        try {
            // Get first installed app to demo scanning
            if (recentFiles.length > 0) {
                const appToScan = recentFiles[0];
                const result = await scanFile({
                    fileName: appToScan.fileName,
                    fileType: appToScan.fileType,
                    fileSize: appToScan.fileSize,
                    packageName: appToScan.packageName,
                    hash: appToScan.hash || `sha256-${appToScan.id}`,
                });

                // Navigate to scan result screen with file and result data
                navigation.navigate('ScanResult', {
                    file: {
                        fileName: appToScan.fileName,
                        fileType: appToScan.fileType,
                        fileSize: appToScan.fileSize,
                        hash: appToScan.hash || `sha256-${appToScan.id}`,
                    },
                    result: result,
                });
            } else {
                // Fallback if no apps found
                const mockFile = {
                    fileName: 'sample_app.apk',
                    fileType: 'apk',
                    fileSize: '15.2 MB',
                    hash: 'sha256-sample123...',
                };
                const result = await scanFile(mockFile);
                navigation.navigate('ScanResult', {
                    file: mockFile,
                    result: result,
                });
            }
        } catch (error) {
            console.error('Scan failed:', error);
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
