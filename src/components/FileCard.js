// FileCard Component
// Reusable card for displaying file information with risk badge and action status

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, FILE_TYPE_ICONS, ACTION_STATUS } from '../utils/constants';
import RiskBadge from './RiskBadge';

/**
 * Format timestamp to relative time (e.g., "2 min ago")
 */
const formatRelativeTime = (timestamp) => {
    if (!timestamp) return '';

    const now = Date.now();
    const scannedTime = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
    const diffMs = now - scannedTime;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin} min ago`;
    if (diffHour < 24) return `${diffHour} hr ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    return new Date(scannedTime).toLocaleDateString();
};

/**
 * Reusable file display card component
 * @param {Object} props
 * @param {Object} props.file - File object with name, type, risk, action
 * @param {Function} props.onPress - Callback when card is pressed
 * @param {Object} props.style - Optional additional styles
 */
const FileCard = ({ file, onPress, style }) => {
    // Get file type icon (fallback)
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

    // Get relative time for last scan
    const lastScanTime = formatRelativeTime(file.scannedAt);

    // Check if we have a valid base64 icon
    const hasAppIcon = file.iconBase64 && file.iconBase64.length > 0;

    return (
        <TouchableOpacity
            style={[styles.card, style]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* App Icon or Fallback File Icon */}
            <View style={styles.iconContainer}>
                {hasAppIcon ? (
                    <Image
                        source={{ uri: `data:image/png;base64,${file.iconBase64}` }}
                        style={styles.appIcon}
                        resizeMode="contain"
                    />
                ) : (
                    <MaterialCommunityIcons
                        name={getFileIcon(file.fileType)}
                        size={24}
                        color={COLORS.secondary}
                    />
                )}
            </View>

            {/* File Details */}
            <View style={styles.details}>
                <Text style={styles.fileName} numberOfLines={1}>
                    {file.fileName}
                </Text>
                <Text style={styles.fileType}>
                    {file.fileType.toUpperCase()} • {file.fileSize}
                </Text>
                {lastScanTime ? (
                    <View style={styles.scanTimeRow}>
                        <MaterialCommunityIcons name="clock-outline" size={11} color={COLORS.textMuted} />
                        <Text style={styles.scanTime}>{lastScanTime}</Text>
                    </View>
                ) : null}
            </View>

            {/* Risk and Action */}
            <View style={styles.status}>
                <RiskBadge risk={file.risk} />
                <View style={styles.actionRow}>
                    <Text style={[styles.action, { color: getActionColor(file.action) }]}>
                        {file.action}
                    </Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textMuted} />
                </View>
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
        overflow: 'hidden',
    },
    appIcon: {
        width: 36,
        height: 36,
        borderRadius: 8,
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
    scanTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    scanTime: {
        fontSize: 10,
        color: COLORS.textMuted,
        marginLeft: 4,
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
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
});

export default FileCard;
