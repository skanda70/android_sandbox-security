// RiskBadge Component
// Displays color-coded risk level badge (LOW/MEDIUM/HIGH)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RISK_LEVELS } from '../utils/constants';

/**
 * Color-coded badge component for displaying risk levels
 * @param {Object} props
 * @param {string} props.risk - Risk level: 'LOW', 'MEDIUM', or 'HIGH'
 * @param {Object} props.style - Optional additional styles
 */
const RiskBadge = ({ risk, style }) => {
    // Determine badge color based on risk level
    const getBadgeColor = () => {
        switch (risk) {
            case RISK_LEVELS.LOW:
                return COLORS.riskLow;
            case RISK_LEVELS.MEDIUM:
                return COLORS.riskMedium;
            case RISK_LEVELS.HIGH:
                return COLORS.riskHigh;
            default:
                return COLORS.textMuted;
        }
    };

    // Get risk indicator emoji
    const getRiskIndicator = () => {
        switch (risk) {
            case RISK_LEVELS.LOW:
                return '🟢';
            case RISK_LEVELS.MEDIUM:
                return '🟡';
            case RISK_LEVELS.HIGH:
                return '🔴';
            default:
                return '⚪';
        }
    };

    const badgeColor = getBadgeColor();

    return (
        <View style={[styles.badge, { backgroundColor: badgeColor + '20' }, style]}>
            <Text style={styles.indicator}>{getRiskIndicator()}</Text>
            <Text style={[styles.text, { color: badgeColor }]}>{risk}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    indicator: {
        fontSize: 10,
        marginRight: 4,
    },
    text: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default RiskBadge;
