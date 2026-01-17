// ScanButton Component
// Primary action button for initiating file scans

import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
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
            style={[styles.container, style]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            <LinearGradient
                colors={disabled ? [COLORS.textMuted, COLORS.textMuted] : [COLORS.secondary, '#2980B9']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradient}
            >
                {loading ? (
                    <ActivityIndicator color={COLORS.textPrimary} size="small" />
                ) : (
                    <>
                        <View style={styles.iconContainer}>
                            <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.textPrimary} />
                        </View>
                        <Text style={styles.label}>{label}</Text>
                    </>
                )}
            </LinearGradient>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 16,
        elevation: 8,
        shadowColor: COLORS.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    gradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        paddingHorizontal: 32,
        borderRadius: 16,
    },
    iconContainer: {
        marginRight: 10,
    },
    label: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        letterSpacing: 0.5,
    },
});

export default ScanButton;
