// ScanResultScreen
// Displays security assessment results in SOC-style alert report format

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
} from 'react-native';
import { COLORS, RISK_LEVELS, ACTION_STATUS, FILE_TYPE_ICONS } from '../utils/constants';
import RiskBadge from '../components/RiskBadge';

/**
 * Scan Result Screen - SOC-style alert report
 * Shows file details, risk assessment, confidence, and action decision
 */
const ScanResultScreen = ({ route, navigation }) => {
    const { file, result } = route.params;

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

    // Format confidence percentage
    const confidencePercent = Math.round(result.confidence * 100);

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
