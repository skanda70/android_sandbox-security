// HistoryScreen
// Displays list of previously scanned files grouped by date

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    RefreshControl,
} from 'react-native';
import { COLORS } from '../utils/constants';
import { getScanHistory } from '../services/api';
import FileCard from '../components/FileCard';

/**
 * History Screen - Scan history list
 * Shows previously scanned files grouped by date (Today, Yesterday, Earlier)
 */
const HistoryScreen = ({ navigation }) => {
    const [history, setHistory] = useState({ today: [], yesterday: [], earlier: [] });
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch history on mount
    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const data = await getScanHistory();
            setHistory(data);
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setLoading(false);
        }
    };

    // Handle pull-to-refresh
    const onRefresh = async () => {
        setRefreshing(true);
        await fetchHistory();
        setRefreshing(false);
    };

    // Handle file card press - view scan result
    const handleFilePress = (file) => {
        navigation.navigate('ScanResult', {
            file: {
                fileName: file.fileName,
                fileType: file.fileType,
                fileSize: file.fileSize,
                hash: file.hash,
            },
            result: {
                risk: file.risk,
                confidence: file.confidence,
                action: file.action,
            },
        });
    };

    // Render a date group section
    const renderDateSection = (title, files) => {
        if (!files || files.length === 0) return null;

        return (
            <View style={styles.dateSection}>
                <View style={styles.dateLabelContainer}>
                    <Text style={styles.dateLabel}>{title}</Text>
                    <Text style={styles.dateCount}>{files.length} files</Text>
                </View>
                {files.map((file) => (
                    <FileCard
                        key={file.id}
                        file={file}
                        onPress={() => handleFilePress(file)}
                    />
                ))}
            </View>
        );
    };

    // Check if history is empty
    const isHistoryEmpty =
        history.today.length === 0 &&
        history.yesterday.length === 0 &&
        history.earlier.length === 0;

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerIcon}>📜</Text>
                <Text style={styles.title}>Scan History</Text>
                <Text style={styles.subtitle}>Previously analyzed files</Text>
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        tintColor={COLORS.secondary}
                        colors={[COLORS.secondary]}
                    />
                }
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText}>Loading history...</Text>
                    </View>
                ) : isHistoryEmpty ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📂</Text>
                        <Text style={styles.emptyText}>No scan history</Text>
                        <Text style={styles.emptyHint}>
                            Scanned files will appear here
                        </Text>
                    </View>
                ) : (
                    <>
                        {renderDateSection('Today', history.today)}
                        {renderDateSection('Yesterday', history.yesterday)}
                        {renderDateSection('Earlier', history.earlier)}
                    </>
                )}
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
        paddingTop: 16,
        paddingBottom: 30,
    },
    dateSection: {
        marginBottom: 24,
    },
    dateLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    dateCount: {
        fontSize: 12,
        color: COLORS.textMuted,
    },
    loadingContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 14,
    },
    emptyText: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    emptyHint: {
        fontSize: 13,
        color: COLORS.textMuted,
        textAlign: 'center',
    },
});

export default HistoryScreen;
