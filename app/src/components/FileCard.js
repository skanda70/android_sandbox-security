// FileCard Component
// Reusable card for displaying file information with risk badge and action status

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FILE_TYPE_ICONS, ACTION_STATUS } from '../utils/constants';
import RiskBadge from './RiskBadge';

/**
 * Reusable file display card component
 * @param {Object} props
 * @param {Object} props.file - File object with name, type, risk, action
 * @param {Function} props.onPress - Callback when card is pressed
 * @param {Object} props.style - Optional additional styles
 */
const FileCard = ({ file, onPress, style }) => {
    // Get file type icon
    const getFileIcon = (fileType) => {
        return FILE_TYPE_ICONS[fileType] || FILE_TYPE_ICONS.unknown;
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

    return (
        <TouchableOpacity
            style={[styles.card, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* File Icon */}
            <View style={styles.iconContainer}>
                <Text style={styles.icon}>{getFileIcon(file.fileType)}</Text>
            </View>

            {/* File Details */}
            <View style={styles.details}>
                <Text style={styles.fileName} numberOfLines={1}>
                    {file.fileName}
                </Text>
                <Text style={styles.fileType}>
                    {file.fileType.toUpperCase()} • {file.fileSize}
                </Text>
            </View>

            {/* Risk and Action */}
            <View style={styles.status}>
                <RiskBadge risk={file.risk} />
                <Text style={[styles.action, { color: getActionColor(file.action) }]}>
                    {file.action}
                </Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 14,
        marginVertical: 6,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 10,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 22,
    },
    details: {
        flex: 1,
        marginRight: 12,
    },
    fileName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    fileType: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    status: {
        alignItems: 'flex-end',
    },
    action: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 6,
        letterSpacing: 0.5,
    },
});

export default FileCard;
