// ScanResultScreen
// Displays security assessment results in SOC-style alert report format
// with permission breakdown, threat details, and action buttons

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Linking,
    Alert,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, RISK_LEVELS, ACTION_STATUS, FILE_TYPE_ICONS } from '../utils/constants';
import RiskBadge from '../components/RiskBadge';
import { getDetailedPermissions, getMalwareAnalysis } from '../services/api';

/**
 * Scan Result Screen - SOC-style alert report
 * Shows file details, risk assessment, confidence, permissions, threats, and action buttons
 */
const ScanResultScreen = ({ route, navigation }) => {
    const { file, result } = route.params;
    const [permissions, setPermissions] = useState([]);
    const [malwareAnalysis, setMalwareAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch detailed data on mount
    useEffect(() => {
        fetchDetailedData();
    }, []);

    const fetchDetailedData = async () => {
        try {
            const packageName = file.packageName || result.packageName;
            if (packageName) {
                const [perms, malware] = await Promise.all([
                    getDetailedPermissions(packageName),
                    getMalwareAnalysis(packageName),
                ]);
                setPermissions(perms);
                setMalwareAnalysis(malware);
            }
        } catch (error) {
            console.error('Failed to fetch detailed data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Get action status color
    const getActionColor = (action) => {
        switch (action) {
            case ACTION_STATUS.ALLOWED:
                return COLORS.actionAllowed;
            case ACTION_STATUS.RESTRICTED:
                return COLORS.actionRestricted;
            case ACTION_STATUS.BLOCKED:
                return COLORS.actionBlocked;
            default:
                return COLORS.textMuted;
        }
    };

    // Get action status icon
    const getActionIcon = (action) => {
        switch (action) {
            case ACTION_STATUS.ALLOWED:
                return '✅';
            case ACTION_STATUS.RESTRICTED:
                return '⚠️';
            case ACTION_STATUS.BLOCKED:
                return '🚫';
            default:
                return '❓';
        }
    };

    // Get file icon
    const getFileIcon = (fileType) => {
        return FILE_TYPE_ICONS[fileType] || FILE_TYPE_ICONS.unknown;
    };

    // Get risk level color
    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'HIGH':
                return COLORS.riskHigh;
            case 'MEDIUM':
                return COLORS.riskMedium;
            case 'LOW':
                return COLORS.riskLow;
            default:
                return COLORS.textMuted;
        }
    };

    // Get permission icon name
    const getPermissionIcon = (iconName) => {
        const iconMap = {
            camera: 'camera',
            microphone: 'microphone',
            location: 'map-marker',
            contacts: 'contacts',
            storage: 'folder',
            phone: 'phone',
            sms: 'message-text',
            calendar: 'calendar',
            network: 'wifi',
            web: 'web',
            'map-marker': 'map-marker',
        };
        return iconMap[iconName] || 'shield-alert';
    };

    // Handle uninstall app
    const handleUninstall = () => {
        const packageName = file.packageName || result.packageName;
        if (packageName) {
            Alert.alert(
                'Uninstall App',
                `Are you sure you want to uninstall ${file.fileName}?`,
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Uninstall',
                        style: 'destructive',
                        onPress: () => {
                            Linking.openURL(`package:${packageName}`).catch(() => {
                                // Fallback for Android
                                Linking.openSettings();
                            });
                        },
                    },
                ]
            );
        }
    };

    // Handle open app settings
    const handleOpenSettings = () => {
        const packageName = file.packageName || result.packageName;
        if (packageName) {
            Linking.openURL(`package:${packageName}`).catch(() => {
                Linking.openSettings();
            });
        }
    };

    // Generate threat explanation
    const getThreatExplanation = () => {
        const explanations = [];

        if (result.risk === RISK_LEVELS.HIGH) {
            explanations.push('This app has requested multiple high-risk permissions that could compromise your privacy.');
        } else if (result.risk === RISK_LEVELS.MEDIUM) {
            explanations.push('This app has some permissions that may pose moderate privacy risks.');
        }

        if (malwareAnalysis) {
            if (malwareAnalysis.suspiciousNameMatch) {
                explanations.push('The app name matches known suspicious patterns.');
            }
            if (malwareAnalysis.matchedComboCount > 0) {
                explanations.push(`Detected ${malwareAnalysis.matchedComboCount} suspicious permission combinations.`);
            }
            if (malwareAnalysis.indicators && malwareAnalysis.indicators.length > 0) {
                explanations.push('Behavioral indicators suggest potential malicious activity.');
            }
        }

        const highRiskPerms = permissions.filter(p => p.riskLevel === 'HIGH');
        if (highRiskPerms.length > 0) {
            const permNames = highRiskPerms.slice(0, 3).map(p => p.shortName).join(', ');
            explanations.push(`High-risk permissions detected: ${permNames}.`);
        }

        if (explanations.length === 0) {
            explanations.push('This app appears to be safe with no significant security concerns.');
        }

        return explanations;
    };

    // Format confidence percentage
    const confidencePercent = Math.round(result.confidence * 100);

    // Group permissions by risk level
    const highRiskPerms = permissions.filter(p => p.riskLevel === 'HIGH');
    const mediumRiskPerms = permissions.filter(p => p.riskLevel === 'MEDIUM');
    const lowRiskPerms = permissions.filter(p => p.riskLevel === 'LOW');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerIcon}>📋</Text>
                    <Text style={styles.headerTitle}>Security Report</Text>
                    <Text style={styles.headerSubtitle}>File Analysis Complete</Text>
                </View>

                {/* File Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>File Details</Text>
                    <View style={styles.card}>
                        <View style={styles.fileHeader}>
                            <Text style={styles.fileIcon}>{getFileIcon(file.fileType)}</Text>
                            <View style={styles.fileInfo}>
                                <Text style={styles.fileName}>{file.fileName}</Text>
                                <Text style={styles.fileHash} numberOfLines={1}>
                                    Hash: {file.hash}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.divider} />

                        <View style={styles.detailsGrid}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>File Type</Text>
                                <Text style={styles.detailValue}>{file.fileType.toUpperCase()}</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>File Size</Text>
                                <Text style={styles.detailValue}>{file.fileSize}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Security Assessment Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security Assessment</Text>

                    {/* Risk Level Card */}
                    <View style={styles.card}>
                        <View style={styles.assessmentRow}>
                            <Text style={styles.assessmentLabel}>Risk Level</Text>
                            <RiskBadge risk={result.risk} style={styles.riskBadge} />
                        </View>

                        <View style={styles.divider} />

                        {/* Confidence Bar */}
                        <View style={styles.confidenceSection}>
                            <View style={styles.confidenceHeader}>
                                <Text style={styles.assessmentLabel}>Detection Confidence</Text>
                                <Text style={styles.confidenceValue}>{confidencePercent}%</Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View
                                    style={[
                                        styles.progressFill,
                                        {
                                            width: `${confidencePercent}%`,
                                            backgroundColor: getActionColor(result.action),
                                        }
                                    ]}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Action Decision Card */}
                    <View style={[styles.card, styles.actionCard, { borderColor: getActionColor(result.action) }]}>
                        <View style={styles.actionHeader}>
                            <Text style={styles.actionIcon}>{getActionIcon(result.action)}</Text>
                            <View>
                                <Text style={styles.actionLabel}>Action Decision</Text>
                                <Text style={[styles.actionValue, { color: getActionColor(result.action) }]}>
                                    {result.action}
                                </Text>
                            </View>
                        </View>

                        <Text style={styles.actionDescription}>
                            {result.action === ACTION_STATUS.BLOCKED &&
                                'This file has been blocked due to high security risk.'}
                            {result.action === ACTION_STATUS.RESTRICTED &&
                                'This file has restricted access due to potential risks.'}
                            {result.action === ACTION_STATUS.ALLOWED &&
                                'This file has passed security checks and is allowed.'}
                        </Text>
                    </View>
                </View>

                {/* Threat Details Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Threat Analysis</Text>
                    <View style={styles.card}>
                        {loading ? (
                            <ActivityIndicator color={COLORS.secondary} />
                        ) : (
                            <>
                                {malwareAnalysis && (
                                    <View style={styles.threatScoreRow}>
                                        <View style={styles.threatScoreCircle}>
                                            <Text style={styles.threatScoreValue}>{malwareAnalysis.threatScore}</Text>
                                            <Text style={styles.threatScoreLabel}>Score</Text>
                                        </View>
                                        <View style={styles.threatInfo}>
                                            <Text style={[styles.threatLevel, { color: getRiskColor(malwareAnalysis.threatLevel) }]}>
                                                {malwareAnalysis.threatLevel} THREAT
                                            </Text>
                                            <Text style={styles.threatStatus}>
                                                {malwareAnalysis.isSafe ? '✓ App appears safe' : '⚠ Potential risks detected'}
                                            </Text>
                                        </View>
                                    </View>
                                )}
                                <View style={styles.divider} />
                                <Text style={styles.explanationTitle}>Why this assessment?</Text>
                                {getThreatExplanation().map((explanation, index) => (
                                    <View key={index} style={styles.explanationRow}>
                                        <MaterialCommunityIcons
                                            name={result.risk === RISK_LEVELS.LOW ? 'check-circle' : 'alert-circle'}
                                            size={16}
                                            color={result.risk === RISK_LEVELS.LOW ? COLORS.riskLow : COLORS.riskMedium}
                                        />
                                        <Text style={styles.explanationText}>{explanation}</Text>
                                    </View>
                                ))}
                            </>
                        )}
                    </View>
                </View>

                {/* Permission Breakdown Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Permission Breakdown</Text>
                    <View style={styles.card}>
                        {loading ? (
                            <ActivityIndicator color={COLORS.secondary} />
                        ) : permissions.length === 0 ? (
                            <Text style={styles.noPermissions}>No special permissions required</Text>
                        ) : (
                            <>
                                {/* Permission Stats */}
                                <View style={styles.permissionStats}>
                                    <View style={[styles.permStat, { backgroundColor: COLORS.riskHigh + '20' }]}>
                                        <Text style={[styles.permStatNum, { color: COLORS.riskHigh }]}>{highRiskPerms.length}</Text>
                                        <Text style={styles.permStatLabel}>High</Text>
                                    </View>
                                    <View style={[styles.permStat, { backgroundColor: COLORS.riskMedium + '20' }]}>
                                        <Text style={[styles.permStatNum, { color: COLORS.riskMedium }]}>{mediumRiskPerms.length}</Text>
                                        <Text style={styles.permStatLabel}>Medium</Text>
                                    </View>
                                    <View style={[styles.permStat, { backgroundColor: COLORS.riskLow + '20' }]}>
                                        <Text style={[styles.permStatNum, { color: COLORS.riskLow }]}>{lowRiskPerms.length}</Text>
                                        <Text style={styles.permStatLabel}>Low</Text>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {/* Permission List */}
                                {permissions.slice(0, 8).map((perm, index) => (
                                    <View key={index} style={styles.permissionRow}>
                                        <View style={[styles.permIcon, { backgroundColor: getRiskColor(perm.riskLevel) + '20' }]}>
                                            <MaterialCommunityIcons
                                                name={getPermissionIcon(perm.icon)}
                                                size={18}
                                                color={getRiskColor(perm.riskLevel)}
                                            />
                                        </View>
                                        <View style={styles.permInfo}>
                                            <Text style={styles.permName}>{perm.shortName}</Text>
                                            <Text style={styles.permDesc} numberOfLines={1}>{perm.description}</Text>
                                        </View>
                                        <View style={[styles.permRiskBadge, { backgroundColor: getRiskColor(perm.riskLevel) + '20' }]}>
                                            <Text style={[styles.permRiskText, { color: getRiskColor(perm.riskLevel) }]}>
                                                {perm.riskLevel}
                                            </Text>
                                        </View>
                                    </View>
                                ))}
                                {permissions.length > 8 && (
                                    <Text style={styles.morePerms}>+{permissions.length - 8} more permissions</Text>
                                )}
                            </>
                        )}
                    </View>
                </View>

                {/* Action Buttons Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions</Text>
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.settingsButton]}
                            onPress={handleOpenSettings}
                        >
                            <MaterialCommunityIcons name="cog" size={20} color={COLORS.secondary} />
                            <Text style={styles.settingsButtonText}>App Settings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.actionButton, styles.uninstallButton]}
                            onPress={handleUninstall}
                        >
                            <MaterialCommunityIcons name="delete" size={20} color={COLORS.riskHigh} />
                            <Text style={styles.uninstallButtonText}>Uninstall</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Back Button */}
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.backButtonText}>← Back to Home</Text>
                </TouchableOpacity>
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
        paddingTop: 24,
        paddingBottom: 20,
    },
    headerIcon: {
        fontSize: 36,
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: COLORS.border,
        marginBottom: 12,
    },
    fileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    fileIcon: {
        fontSize: 32,
        marginRight: 14,
    },
    fileInfo: {
        flex: 1,
    },
    fileName: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    fileHash: {
        fontSize: 11,
        color: COLORS.textMuted,
        fontFamily: 'monospace',
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginVertical: 14,
    },
    detailsGrid: {
        flexDirection: 'row',
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    assessmentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    assessmentLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    riskBadge: {
        paddingHorizontal: 14,
        paddingVertical: 6,
    },
    confidenceSection: {
        marginTop: 4,
    },
    confidenceHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    confidenceValue: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    progressBar: {
        height: 10,
        backgroundColor: COLORS.surface,
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 5,
    },
    actionCard: {
        borderWidth: 2,
    },
    actionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionIcon: {
        fontSize: 28,
        marginRight: 14,
    },
    actionLabel: {
        fontSize: 12,
        color: COLORS.textMuted,
        marginBottom: 2,
    },
    actionValue: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: 1,
    },
    actionDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        lineHeight: 18,
    },
    // Threat Analysis styles
    threatScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    threatScoreCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    threatScoreValue: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    threatScoreLabel: {
        fontSize: 10,
        color: COLORS.textMuted,
    },
    threatInfo: {
        flex: 1,
    },
    threatLevel: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    threatStatus: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    explanationTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    explanationRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    explanationText: {
        flex: 1,
        fontSize: 13,
        color: COLORS.textSecondary,
        marginLeft: 8,
        lineHeight: 18,
    },
    // Permission styles
    noPermissions: {
        fontSize: 14,
        color: COLORS.textMuted,
        textAlign: 'center',
        paddingVertical: 20,
    },
    permissionStats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    permStat: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 12,
    },
    permStatNum: {
        fontSize: 22,
        fontWeight: '800',
    },
    permStatLabel: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    permissionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    permIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    permInfo: {
        flex: 1,
    },
    permName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    permDesc: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    permRiskBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    permRiskText: {
        fontSize: 10,
        fontWeight: '700',
    },
    morePerms: {
        fontSize: 12,
        color: COLORS.secondary,
        textAlign: 'center',
        marginTop: 10,
    },
    // Action buttons styles
    actionButtonsContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 12,
        borderWidth: 1,
    },
    settingsButton: {
        backgroundColor: COLORS.secondary + '15',
        borderColor: COLORS.secondary,
    },
    settingsButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.secondary,
        marginLeft: 8,
    },
    uninstallButton: {
        backgroundColor: COLORS.riskHigh + '15',
        borderColor: COLORS.riskHigh,
    },
    uninstallButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.riskHigh,
        marginLeft: 8,
    },
    backButton: {
        alignItems: 'center',
        paddingVertical: 16,
        marginTop: 10,
    },
    backButtonText: {
        fontSize: 15,
        color: COLORS.secondary,
        fontWeight: '600',
    },
});

export default ScanResultScreen;
