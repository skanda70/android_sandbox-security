// ScanButton Component
// Primary action button for initiating file scans

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../utils/constants';

/**
 * Primary scan button component
 * @param {Object} props
 * @param {Function} props.onPress - Callback when button is pressed
 * @param {string} props.label - Button label text
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.disabled - Disable button
 * @param {Object} props.style - Optional additional styles
 */
const ScanButton = ({ onPress, label = 'Start Scan', loading = false, disabled = false, style }) => {
    return (
        <TouchableOpacity
            style={[
                styles.button,
                disabled && styles.buttonDisabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={COLORS.textPrimary} size="small" />
            ) : (
                <>
                    {/* Shield Icon */}
                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>🛡️</Text>
                    </View>
                    <Text style={styles.label}>{label}</Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.secondary,
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
        elevation: 4,
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonDisabled: {
        backgroundColor: COLORS.textMuted,
        opacity: 0.6,
    },
    iconContainer: {
        marginRight: 10,
    },
    icon: {
        fontSize: 24,
    },
    label: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        letterSpacing: 0.5,
    },
});

export default ScanButton;
