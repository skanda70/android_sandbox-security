// AppSelectionModal Component
// Modal dialog for selecting an app to deep scan

import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';

/**
 * App Selection Modal - Shows list of installed apps for selection
 * @param {Object} props
 * @param {boolean} props.visible - Whether modal is visible
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onSelectApp - Callback when app is selected
 * @param {Array} props.apps - Array of installed apps
 * @param {boolean} props.loading - Whether apps are still loading
 */
const AppSelectionModal = ({ visible, onClose, onSelectApp, apps, loading }) => {
    const renderAppItem = ({ item }) => (
        <TouchableOpacity
            style={styles.appItem}
            onPress={() => onSelectApp(item)}
            activeOpacity={0.7}
        >
            {item.iconBase64 ? (
                <Image
                    source={{ uri: `data:image/png;base64,${item.iconBase64}` }}
                    style={styles.appIcon}
                />
            ) : (
                <View style={styles.iconPlaceholder}>
                    <MaterialCommunityIcons name="android" size={28} color={COLORS.textMuted} />
                </View>
            )}
            <View style={styles.appInfo}>
                <Text style={styles.appName} numberOfLines={1}>
                    {item.fileName || item.appName || 'Unknown App'}
                </Text>
                <Text style={styles.packageName} numberOfLines={1}>
                    {item.packageName}
                </Text>
            </View>
            <MaterialCommunityIcons
                name="chevron-right"
                size={24}
                color={COLORS.textMuted}
            />
        </TouchableOpacity>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Select App to Scan</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <MaterialCommunityIcons
                                name="close"
                                size={24}
                                color={COLORS.textPrimary}
                            />
                        </TouchableOpacity>
                    </View>

                    {/* Subtitle */}
                    <Text style={styles.subtitle}>
                        Choose an app for deep security analysis
                    </Text>

                    {/* App List */}
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={COLORS.secondary} />
                            <Text style={styles.loadingText}>Loading apps...</Text>
                        </View>
                    ) : (
                        <FlatList
                            data={apps}
                            keyExtractor={(item) => item.packageName || item.id}
                            renderItem={renderAppItem}
                            style={styles.appList}
                            contentContainerStyle={styles.appListContent}
                            showsVerticalScrollIndicator={false}
                            ListEmptyComponent={
                                <View style={styles.emptyContainer}>
                                    <MaterialCommunityIcons
                                        name="application-off"
                                        size={48}
                                        color={COLORS.textMuted}
                                    />
                                    <Text style={styles.emptyText}>No apps found</Text>
                                </View>
                            }
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '75%',
        paddingBottom: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    closeButton: {
        padding: 4,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    appList: {
        flex: 1,
    },
    appListContent: {
        paddingHorizontal: 16,
    },
    appItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 14,
        borderRadius: 12,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    appIcon: {
        width: 48,
        height: 48,
        borderRadius: 10,
    },
    iconPlaceholder: {
        width: 48,
        height: 48,
        borderRadius: 10,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
    },
    appInfo: {
        flex: 1,
        marginLeft: 14,
    },
    appName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    packageName: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    loadingContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 12,
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textMuted,
        marginTop: 12,
    },
});

export default AppSelectionModal;
