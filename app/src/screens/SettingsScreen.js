// SettingsScreen
// App settings with toggle switches and app information

import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Switch,
    TouchableOpacity,
    Linking,
} from 'react-native';
import { COLORS, APP_CONFIG } from '../utils/constants';

/**
 * Settings Screen - App configuration
 * Toggle switches for scan settings and app information display
 */
const SettingsScreen = () => {
    const [showSystemApps, setShowSystemApps] = useState(false);
    const [showDetailedRisk, setShowDetailedRisk] = useState(true);
    const [highlightSideloaded, setHighlightSideloaded] = useState(true);
    const [showTrustedApps, setShowTrustedApps] = useState(true);

    // Render a toggle setting row
    const renderToggleSetting = (icon, title, description, value, onValueChange) => {
        return (
            <View style={styles.settingRow}>
                <View style={styles.settingIcon}>
                    <Text style={styles.icon}>{icon}</Text>
                </View>
                <View style={styles.settingContent}>
                    <Text style={styles.settingTitle}>{title}</Text>
                    <Text style={styles.settingDescription}>{description}</Text>
                </View>
                <Switch
                    value={value}
                    onValueChange={onValueChange}
                    trackColor={{ false: COLORS.surface, true: COLORS.secondary + '60' }}
                    thumbColor={value ? COLORS.secondary : COLORS.textMuted}
                />
            </View>
        );
    };

    // Render an info row
    const renderInfoRow = (label, value, isStatus = false) => {
        return (
            <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{label}</Text>
                <View style={styles.infoValueContainer}>
                    {isStatus && <View style={styles.statusDot} />}
                    <Text style={[styles.infoValue, isStatus && styles.statusText]}>
                        {value}
                    </Text>
                </View>
            </View>
        );
    };

    // Open device security settings
    const openSecuritySettings = () => {
        Linking.openSettings();
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerIcon}>⚙️</Text>
                <Text style={styles.title}>Settings</Text>
                <Text style={styles.subtitle}>Configure your security preferences</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Display Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Display Settings</Text>
                    <View style={styles.card}>
                        {renderToggleSetting(
                            '📱',
                            'Show System Apps',
                            'Include pre-installed system apps',
                            showSystemApps,
                            setShowSystemApps
                        )}
                        <View style={styles.divider} />
                        {renderToggleSetting(
                            '✅',
                            'Show Trusted Apps',
                            'Display apps from verified publishers',
                            showTrustedApps,
                            setShowTrustedApps
                        )}
                    </View>
                </View>

                {/* Security Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security Analysis</Text>
                    <View style={styles.card}>
                        {renderToggleSetting(
                            '📊',
                            'Detailed Risk Info',
                            'Show risk breakdown and scores',
                            showDetailedRisk,
                            setShowDetailedRisk
                        )}
                        <View style={styles.divider} />
                        {renderToggleSetting(
                            '⚠️',
                            'Highlight Sideloaded',
                            'Flag apps not from Play Store',
                            highlightSideloaded,
                            setHighlightSideloaded
                        )}
                    </View>
                </View>

                {/* Quick Actions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Quick Actions</Text>
                    <View style={styles.card}>
                        <TouchableOpacity style={styles.actionRow} onPress={openSecuritySettings}>
                            <View style={styles.settingIcon}>
                                <Text style={styles.icon}>🔐</Text>
                            </View>
                            <View style={styles.settingContent}>
                                <Text style={styles.settingTitle}>Device Security</Text>
                                <Text style={styles.settingDescription}>Open Android security settings</Text>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* App Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Information</Text>
                    <View style={styles.card}>
                        {renderInfoRow('App Name', APP_CONFIG.name)}
                        <View style={styles.divider} />
                        {renderInfoRow('Version', APP_CONFIG.version)}
                        <View style={styles.divider} />
                        {renderInfoRow('Analysis Engine', 'ThreatScoringEngine v2.0')}
                        <View style={styles.divider} />
                        {renderInfoRow('Status', 'Active', true)}
                    </View>
                </View>

                {/* About Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>About</Text>
                    <View style={styles.card}>
                        <View style={styles.aboutContent}>
                            <Text style={styles.aboutIcon}>🛡️</Text>
                            <Text style={styles.aboutTitle}>Android Sandbox</Text>
                            <Text style={styles.aboutDescription}>
                                Advanced app security analyzer with context-aware risk scoring,
                                runtime behavioral detection, and comprehensive threat analysis.
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text style={styles.footerText}>
                        Built with ❤️ by Skanda, Deekshith and Pratham
                    </Text>
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
    header: {
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    headerIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    subtitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 100,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: COLORS.textSecondary,
        marginBottom: 12,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    card: {
        backgroundColor: COLORS.card,
        borderRadius: 16,
        padding: 4,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    settingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    icon: {
        fontSize: 20,
    },
    settingContent: {
        flex: 1,
        marginRight: 12,
    },
    settingTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    settingDescription: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    divider: {
        height: 1,
        backgroundColor: COLORS.divider,
        marginHorizontal: 14,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    infoLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    infoValueContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.riskLow,
        marginRight: 8,
    },
    statusText: {
        color: COLORS.riskLow,
    },
    aboutContent: {
        alignItems: 'center',
        padding: 24,
    },
    aboutIcon: {
        fontSize: 48,
        marginBottom: 14,
    },
    aboutTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 10,
    },
    aboutDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    footer: {
        alignItems: 'center',
        paddingTop: 20,
        paddingBottom: 10,
    },
    footerText: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    footerSubtext: {
        fontSize: 11,
        color: COLORS.textMuted,
        marginTop: 2,
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    chevron: {
        fontSize: 24,
        color: COLORS.textMuted,
        fontWeight: '300',
    },
});

export default SettingsScreen;
