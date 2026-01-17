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
} from 'react-native';
import { COLORS, APP_CONFIG } from '../utils/constants';

/**
 * Settings Screen - App configuration
 * Toggle switches for scan settings and app information display
 */
const SettingsScreen = () => {
    const [realTimeScan, setRealTimeScan] = useState(true);
    const [threatAlerts, setThreatAlerts] = useState(true);

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
                {/* Scan Settings Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Scan Settings</Text>
                    <View style={styles.card}>
                        {renderToggleSetting(
                            '🔄',
                            'Real-time Scan',
                            'Automatically scan new files',
                            realTimeScan,
                            setRealTimeScan
                        )}
                        <View style={styles.divider} />
                        {renderToggleSetting(
                            '🔔',
                            'Threat Alerts',
                            'Receive notifications for threats',
                            threatAlerts,
                            setThreatAlerts
                        )}
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
                        {renderInfoRow('Backend Status', APP_CONFIG.backendStatus, true)}
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
                                A security-focused application for analyzing Android files and
                                protecting your device from potential threats.
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
        paddingTop: 24,
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
        paddingBottom: 30,
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
});

export default SettingsScreen;
