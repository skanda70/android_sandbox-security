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
} from 'react-native';
import { COLORS } from '../utils/constants';
import { getRecentFiles, scanFile } from '../services/api';
import FileCard from '../components/FileCard';
import ScanButton from '../components/ScanButton';

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
            },
            result: {
                risk: file.risk,
                confidence: file.confidence,
                action: file.action,
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
                    <Text style={styles.appIcon}>🛡️</Text>
                    <Text style={styles.title}>Android Sandbox</Text>
                    <Text style={styles.subtitle}>Security Analysis Platform</Text>
                </View>

                {/* Scan Button Section */}
                <View style={styles.scanSection}>
                    <ScanButton
                        onPress={handleScan}
                        loading={scanning}
                        label="Start Scan"
                    />
                    <Text style={styles.scanHint}>
                        Analyze files for security threats
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
                            <Text style={styles.emptyIcon}>📁</Text>
                            <Text style={styles.emptyText}>No recent scans</Text>
                            <Text style={styles.emptyHint}>
                                Tap "Start Scan" to analyze your first file
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
        paddingTop: 30,
        paddingBottom: 20,
    },
    appIcon: {
        fontSize: 48,
        marginBottom: 12,
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
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 14,
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
        fontSize: 40,
        marginBottom: 12,
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
