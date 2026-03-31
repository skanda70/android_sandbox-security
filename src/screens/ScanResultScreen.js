// ScanResultScreen
// Displays security assessment results in SOC-style alert report format
// Supports ML-only scan mode with animated scanning overlay

import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    NativeModules,
    Animated,
    Easing,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, RISK_LEVELS, ACTION_STATUS, FILE_TYPE_ICONS } from '../utils/constants';
import RiskBadge from '../components/RiskBadge';
import { getDetailedPermissions, getMalwareAnalysis, getMLAnalysis } from '../services/api';

const ScanResultScreen = ({ route, navigation }) => {
    const { file, result, scanMode } = route.params;
    const isMLMode = scanMode === 'ml';

    const [permissions, setPermissions] = useState([]);
    const [malwareAnalysis, setMalwareAnalysis] = useState(null);
    const [mlAnalysis, setMlAnalysis] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAllPermissions, setShowAllPermissions] = useState(false);

    // Animation states for ML scan mode
    const [scanAnimating, setScanAnimating] = useState(isMLMode);
    const scanProgress = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeIn = useRef(new Animated.Value(0)).current;
    const slideUp = useRef(new Animated.Value(40)).current;
    const [scanStatus, setScanStatus] = useState('Initializing EMBER2024 model...');

    const { BehaviorModule } = NativeModules;

    useEffect(() => {
        if (isMLMode) {
            runScanAnimation();
        } else {
            fetchDetailedData();
        }
    }, []);

    // Animated scanning sequence for ML mode
    const runScanAnimation = () => {
        // Pulse animation loop
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
            ])
        );
        pulse.start();

        // Progress bar + status messages
        const stages = [
            { progress: 0.15, status: 'Reading APK binary data...', delay: 600 },
            { progress: 0.30, status: 'Extracting EMBER features...', delay: 700 },
            { progress: 0.50, status: 'Computing feature vectors (2381-d)...', delay: 800 },
            { progress: 0.70, status: 'Running ONNX inference...', delay: 600 },
            { progress: 0.85, status: 'Analyzing classification output...', delay: 500 },
            { progress: 1.0, status: 'Generating security report...', delay: 400 },
        ];

        let totalDelay = 300;
        stages.forEach((stage) => {
            setTimeout(() => {
                setScanStatus(stage.status);
                Animated.timing(scanProgress, {
                    toValue: stage.progress,
                    duration: stage.delay,
                    easing: Easing.out(Easing.quad),
                    useNativeDriver: false,
                }).start();
            }, totalDelay);
            totalDelay += stage.delay + 200;
        });

        // Finish animation
        setTimeout(() => {
            pulse.stop();
            setScanAnimating(false);
            setLoading(false);
            // Fade in results
            Animated.parallel([
                Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }),
                Animated.timing(slideUp, { toValue: 0, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            ]).start();
        }, totalDelay + 300);
    };

    const fetchDetailedData = async () => {
        try {
            const packageName = file.packageName || result.packageName;
            if (packageName) {
                const [perms, malware, ml] = await Promise.all([
                    getDetailedPermissions(packageName),
                    getMalwareAnalysis(packageName),
                    getMLAnalysis(packageName),
                ]);
                setPermissions(perms);
                setMalwareAnalysis(malware);
                setMlAnalysis(ml);
            }
        } catch (error) {
            console.error('Failed to fetch detailed data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case ACTION_STATUS.ALLOWED: return COLORS.actionAllowed;
            case ACTION_STATUS.RESTRICTED: return COLORS.actionRestricted;
            case ACTION_STATUS.BLOCKED: return COLORS.actionBlocked;
            default: return COLORS.textMuted;
        }
    };

    const getRiskColor = (riskLevel) => {
        switch (riskLevel) {
            case 'HIGH': return COLORS.riskHigh;
            case 'MEDIUM': return COLORS.riskMedium;
            case 'LOW': return COLORS.riskLow;
            default: return COLORS.textMuted;
        }
    };

    const getPermissionIcon = (iconName) => {
        const iconMap = {
            camera: 'camera', microphone: 'microphone', location: 'map-marker',
            contacts: 'contacts', storage: 'folder', phone: 'phone',
            sms: 'message-text', calendar: 'calendar', network: 'wifi',
            web: 'web', 'map-marker': 'map-marker',
        };
        return iconMap[iconName] || 'shield-alert';
    };

    const handleUninstall = () => {
        const packageName = file.packageName || result.packageName;
        if (packageName && BehaviorModule) {
            Alert.alert('Uninstall App', `Are you sure you want to uninstall ${file.fileName}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Uninstall', style: 'destructive', onPress: async () => {
                    try { await BehaviorModule.uninstallApp(packageName); }
                    catch (e) { Alert.alert('Error', 'Unable to uninstall.'); }
                }},
            ]);
        }
    };

    const handleOpenSettings = async () => {
        const packageName = file.packageName || result.packageName;
        if (packageName && BehaviorModule) {
            try { await BehaviorModule.openAppSettings(packageName); }
            catch (e) { Alert.alert('Error', 'Unable to open app settings.'); }
        }
    };

    const confidencePercent = Math.round(result.confidence * 100);
    const mlPrediction = result.mlPrediction || (mlAnalysis && mlAnalysis.prediction) || 'N/A';
    const mlConfidence = result.mlConfidence || (mlAnalysis && mlAnalysis.confidence) || 0;
    const mlConfPercent = Math.round(mlConfidence * 100);
    const mlProbs = result.mlProbabilities || (mlAnalysis && mlAnalysis.probabilities) || {};
    const mlIsBenign = mlPrediction === 'Benign';
    const mlDisplayLabel = mlIsBenign ? 'Safe' : 'Malicious';
    const mlColor = mlIsBenign ? COLORS.riskLow : COLORS.riskHigh;

    // Permission grouping for full mode
    const highRiskPerms = permissions.filter(p => p.riskLevel === 'HIGH');
    const mediumRiskPerms = permissions.filter(p => p.riskLevel === 'MEDIUM');
    const lowRiskPerms = permissions.filter(p => p.riskLevel === 'LOW');

    // ── Scanning Animation Overlay ──
    if (scanAnimating) {
        const progressWidth = scanProgress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.scanOverlay}>
                    <Animated.View style={[styles.scanPulseCircle, { transform: [{ scale: pulseAnim }] }]}>
                        <MaterialCommunityIcons name="brain" size={56} color={COLORS.secondary} />
                    </Animated.View>
                    <Text style={styles.scanTitle}>ML Security Analysis</Text>
                    <Text style={styles.scanAppName}>{file.fileName}</Text>
                    <View style={styles.scanProgressContainer}>
                        <Animated.View style={[styles.scanProgressFill, { width: progressWidth }]} />
                    </View>
                    <Text style={styles.scanStatusText}>{scanStatus}</Text>
                    <View style={styles.scanModelBadge}>
                        <MaterialCommunityIcons name="chip" size={14} color={COLORS.secondary} />
                        <Text style={styles.scanModelText}>EMBER2024 · ONNX Runtime</Text>
                    </View>
                </View>
            </SafeAreaView>
        );
    }

    // ── ML-Only Results Mode ──
    if (isMLMode) {
        return (
            <SafeAreaView style={styles.container}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

                        {/* Header with Back */}
                        <View style={styles.headerBar}>
                            <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.navigate('HomeMain')} activeOpacity={0.7}>
                                <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.textPrimary} />
                                <Text style={styles.headerBackText}>Home</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Result Header */}
                        <View style={styles.mlResultHeader}>
                            <View style={[styles.mlResultIconCircle, { backgroundColor: mlColor + '20' }]}>
                                <MaterialCommunityIcons name={mlIsBenign ? 'shield-check' : 'shield-alert'} size={48} color={mlColor} />
                            </View>
                            <Text style={[styles.mlResultVerdict, { color: mlColor }]}>{mlDisplayLabel}</Text>
                            <Text style={styles.mlResultConfLabel}>{mlConfPercent}% Confidence</Text>
                        </View>

                        {/* App Info Card */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Scanned Application</Text>
                            <View style={styles.card}>
                                <View style={styles.fileHeader}>
                                    {file.iconBase64 ? (
                                        <Image source={{ uri: `data:image/png;base64,${file.iconBase64}` }} style={styles.appIcon} />
                                    ) : (
                                        <Text style={styles.fileIcon}>📦</Text>
                                    )}
                                    <View style={styles.fileInfo}>
                                        <Text style={styles.fileName}>{file.fileName}</Text>
                                        <Text style={styles.fileHash} numberOfLines={1}>Package: {file.packageName || 'N/A'}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* ML Model Details */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Model Information</Text>
                            <View style={styles.card}>
                                <View style={styles.mlDetailRow}>
                                    <MaterialCommunityIcons name="brain" size={20} color={COLORS.secondary} />
                                    <View style={styles.mlDetailContent}>
                                        <Text style={styles.mlDetailLabel}>Model</Text>
                                        <Text style={styles.mlDetailValue}>EMBER2024 APK Classifier</Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.mlDetailRow}>
                                    <MaterialCommunityIcons name="chip" size={20} color={COLORS.secondary} />
                                    <View style={styles.mlDetailContent}>
                                        <Text style={styles.mlDetailLabel}>Runtime</Text>
                                        <Text style={styles.mlDetailValue}>ONNX Runtime (On-Device)</Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.mlDetailRow}>
                                    <MaterialCommunityIcons name="vector-polyline" size={20} color={COLORS.secondary} />
                                    <View style={styles.mlDetailContent}>
                                        <Text style={styles.mlDetailLabel}>Feature Vector</Text>
                                        <Text style={styles.mlDetailValue}>2381-dimensional (raw APK bytes)</Text>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.mlDetailRow}>
                                    <MaterialCommunityIcons name="target" size={20} color={COLORS.secondary} />
                                    <View style={styles.mlDetailContent}>
                                        <Text style={styles.mlDetailLabel}>Classification</Text>
                                        <Text style={styles.mlDetailValue}>Binary (Safe / Malicious)</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Classification Result */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Classification Result</Text>
                            <View style={styles.card}>
                                {/* Prediction Badge */}
                                <View style={styles.mlPredictionRow}>
                                    <View style={[styles.mlIconContainer, { backgroundColor: mlColor + '15' }]}>
                                        <MaterialCommunityIcons name={mlIsBenign ? 'check-decagram' : 'alert-decagram'} size={28} color={mlColor} />
                                    </View>
                                    <View style={styles.mlPredictionInfo}>
                                        <Text style={styles.mlPredictionLabel}>Prediction</Text>
                                        <View style={styles.mlPredictionBadgeRow}>
                                            <View style={[styles.mlPredictionBadge, { backgroundColor: mlColor + '20' }]}>
                                                <Text style={[styles.mlPredictionBadgeText, { color: mlColor }]}>{mlPrediction}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {/* Confidence Bar */}
                                <View style={styles.confidenceSection}>
                                    <View style={styles.confidenceHeader}>
                                        <Text style={styles.assessmentLabel}>Detection Confidence</Text>
                                        <Text style={[styles.confidenceValue, { color: mlColor }]}>{mlConfPercent}%</Text>
                                    </View>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: `${mlConfPercent}%`, backgroundColor: mlColor }]} />
                                    </View>
                                </View>

                                <View style={styles.divider} />

                                {/* Class Probabilities */}
                                <Text style={styles.explanationTitle}>Class Probabilities</Text>
                                {[{ key: 'Benign', label: 'Safe' }, { key: 'Malicious', label: 'Malicious' }].map(({ key: cls, label }) => {
                                    const prob = mlProbs[cls] || 0;
                                    const pct = Math.round(prob * 100);
                                    const clsColor = cls === 'Benign' ? COLORS.riskLow : COLORS.riskHigh;
                                    return (
                                        <View key={cls} style={styles.mlProbRow}>
                                            <Text style={styles.mlProbLabel}>{cls}</Text>
                                            <View style={styles.mlProbBarContainer}>
                                                <View style={[styles.mlProbBar, { width: `${Math.max(pct, 2)}%`, backgroundColor: clsColor }]} />
                                            </View>
                                            <Text style={styles.mlProbValue}>{pct}%</Text>
                                        </View>
                                    );
                                })}
                            </View>
                        </View>

                        {/* Risk Interpretation */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Risk Interpretation</Text>
                            <View style={styles.card}>
                                <View style={[styles.riskInterpretBanner, { backgroundColor: mlColor + '10', borderLeftColor: mlColor }]}>
                                    <MaterialCommunityIcons name={mlIsBenign ? 'information' : 'alert'} size={20} color={mlColor} />
                                    <Text style={[styles.riskInterpretText, { color: mlColor }]}>
                                        {mlIsBenign
                                            ? 'The ML model classifies this application as benign software with no malicious behavior detected in the binary structure.'
                                            : 'The ML model has identified patterns in the APK binary that are consistent with known malicious software.'}
                                    </Text>
                                </View>
                                <View style={styles.divider} />
                                <Text style={styles.explanationTitle}>What does this mean?</Text>
                                {mlIsBenign ? (
                                    <>
                                        <View style={styles.explanationRow}>
                                            <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.riskLow} />
                                            <Text style={styles.explanationText}>No malicious code patterns detected in the APK binary analysis.</Text>
                                        </View>
                                        <View style={styles.explanationRow}>
                                            <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.riskLow} />
                                            <Text style={styles.explanationText}>Binary feature distribution is consistent with legitimate applications.</Text>
                                        </View>
                                        <View style={styles.explanationRow}>
                                            <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.riskLow} />
                                            <Text style={styles.explanationText}>The app can be used safely based on the ML assessment.</Text>
                                        </View>
                                    </>
                                ) : (
                                    <>
                                        <View style={styles.explanationRow}>
                                            <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.riskHigh} />
                                            <Text style={styles.explanationText}>APK binary features match known malware signatures in the training dataset.</Text>
                                        </View>
                                        <View style={styles.explanationRow}>
                                            <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.riskHigh} />
                                            <Text style={styles.explanationText}>This app may contain code designed to steal data, display unwanted ads, or perform unauthorized actions.</Text>
                                        </View>
                                        <View style={styles.explanationRow}>
                                            <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.riskHigh} />
                                            <Text style={styles.explanationText}>Consider uninstalling this application and reporting it.</Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>

                        {/* Actions */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Actions</Text>
                            <View style={styles.actionButtonsContainer}>
                                <TouchableOpacity style={[styles.actionButton, styles.settingsButton]} onPress={handleOpenSettings}>
                                    <MaterialCommunityIcons name="cog" size={20} color={COLORS.secondary} />
                                    <Text style={styles.settingsButtonText}>App Settings</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.actionButton, styles.uninstallButton]} onPress={handleUninstall}>
                                    <MaterialCommunityIcons name="delete" size={20} color={COLORS.riskHigh} />
                                    <Text style={styles.uninstallButtonText}>Uninstall</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Back Button */}
                        <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('HomeMain')} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.secondary} />
                            <Text style={styles.backButtonText}>Back to Home</Text>
                        </TouchableOpacity>

                    </Animated.View>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ── Full Report Mode (from History/Installed Apps list) ──
    const getFileIcon = (fileType) => FILE_TYPE_ICONS[fileType] || FILE_TYPE_ICONS.unknown;

    const getThreatExplanation = () => {
        const explanations = [];
        if (result.risk === RISK_LEVELS.HIGH) explanations.push('This app has requested multiple high-risk permissions that could compromise your privacy.');
        else if (result.risk === RISK_LEVELS.MEDIUM) explanations.push('This app has some permissions that may pose moderate privacy risks.');
        if (malwareAnalysis) {
            if (malwareAnalysis.suspiciousNameMatch) explanations.push('The app name matches known suspicious patterns.');
            if (malwareAnalysis.matchedComboCount > 0) explanations.push(`Detected ${malwareAnalysis.matchedComboCount} suspicious permission combinations.`);
            if (malwareAnalysis.indicators && malwareAnalysis.indicators.length > 0) explanations.push('Behavioral indicators suggest potential malicious activity.');
        }
        const hrPerms = permissions.filter(p => p.riskLevel === 'HIGH');
        if (hrPerms.length > 0) {
            const permNames = hrPerms.slice(0, 3).map(p => p.shortName).join(', ');
            explanations.push(`High-risk permissions detected: ${permNames}.`);
        }
        if (explanations.length === 0) explanations.push('This app appears to be safe with no significant security concerns.');
        return explanations;
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Header with Back Button */}
                <View style={styles.headerBar}>
                    <TouchableOpacity style={styles.headerBackButton} onPress={() => navigation.navigate('HomeMain')} activeOpacity={0.7}>
                        <MaterialCommunityIcons name="chevron-left" size={28} color={COLORS.textPrimary} />
                        <Text style={styles.headerBackText}>Home</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.header}>
                    <Text style={styles.headerIcon}>📋</Text>
                    <Text style={styles.headerTitle}>Security Report</Text>
                    <Text style={styles.headerSubtitle}>File Analysis Complete</Text>
                </View>

                {/* File Details */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>File Details</Text>
                    <View style={styles.card}>
                        <View style={styles.fileHeader}>
                            {file.iconBase64 ? (
                                <Image source={{ uri: `data:image/png;base64,${file.iconBase64}` }} style={styles.appIcon} />
                            ) : (
                                <Text style={styles.fileIcon}>{getFileIcon(file.fileType)}</Text>
                            )}
                            <View style={styles.fileInfo}>
                                <Text style={styles.fileName}>{file.fileName}</Text>
                                <Text style={styles.fileHash} numberOfLines={1}>Hash: {file.hash}</Text>
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

                {/* Security Assessment */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Security Assessment</Text>
                    <View style={styles.card}>
                        <View style={styles.assessmentRow}>
                            <Text style={styles.assessmentLabel}>Risk Level</Text>
                            <RiskBadge risk={result.risk} style={styles.riskBadge} />
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.confidenceSection}>
                            <View style={styles.confidenceHeader}>
                                <Text style={styles.assessmentLabel}>Detection Confidence</Text>
                                <Text style={styles.confidenceValue}>{confidencePercent}%</Text>
                            </View>
                            <View style={styles.progressBar}>
                                <View style={[styles.progressFill, { width: `${confidencePercent}%`, backgroundColor: getActionColor(result.action) }]} />
                            </View>
                        </View>
                    </View>
                </View>

                {/* ML Classification */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>ML Classification</Text>
                    <View style={styles.card}>
                        {loading ? (
                            <ActivityIndicator color={COLORS.secondary} />
                        ) : (mlAnalysis || result.mlAvailable) ? (
                            <>
                                <View style={styles.mlPredictionRow}>
                                    <View style={styles.mlIconContainer}>
                                        <MaterialCommunityIcons name="brain" size={24} color={COLORS.secondary} />
                                    </View>
                                    <View style={styles.mlPredictionInfo}>
                                        <Text style={styles.mlPredictionLabel}>EMBER2024 Model</Text>
                                        <View style={styles.mlPredictionBadgeRow}>
                                            <View style={[styles.mlPredictionBadge, { backgroundColor: mlColor + '20' }]}>
                                                <Text style={[styles.mlPredictionBadgeText, { color: mlColor }]}>{mlPrediction}</Text>
                                            </View>
                                            <Text style={styles.mlConfText}>{mlConfPercent}% confidence</Text>
                                        </View>
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <View style={styles.confidenceSection}>
                                    <View style={styles.confidenceHeader}>
                                        <Text style={styles.assessmentLabel}>ML Confidence</Text>
                                        <Text style={styles.confidenceValue}>{mlConfPercent}%</Text>
                                    </View>
                                    <View style={styles.progressBar}>
                                        <View style={[styles.progressFill, { width: `${mlConfPercent}%`, backgroundColor: mlColor }]} />
                                    </View>
                                </View>
                                <View style={styles.divider} />
                                <Text style={styles.explanationTitle}>Class Probabilities</Text>
                                {[{ key: 'Benign', label: 'Safe' }, { key: 'Malicious', label: 'Malicious' }].map(({ key: cls, label }) => {
                                    const prob = mlProbs[cls] || 0;
                                    const pct = Math.round(prob * 100);
                                    const clsColor = cls === 'Benign' ? COLORS.riskLow : COLORS.riskHigh;
                                    return (
                                        <View key={cls} style={styles.mlProbRow}>
                                            <Text style={styles.mlProbLabel}>{cls}</Text>
                                            <View style={styles.mlProbBarContainer}>
                                                <View style={[styles.mlProbBar, { width: `${Math.max(pct, 2)}%`, backgroundColor: clsColor }]} />
                                            </View>
                                            <Text style={styles.mlProbValue}>{pct}%</Text>
                                        </View>
                                    );
                                })}
                            </>
                        ) : (
                            <View style={styles.mlUnavailable}>
                                <MaterialCommunityIcons name="brain" size={24} color={COLORS.textMuted} />
                                <Text style={styles.mlUnavailableText}>ML analysis not available</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* App Information */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>App Information</Text>
                    <View style={styles.card}>
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconContainer}>
                                <MaterialCommunityIcons name={result.isFromPlayStore ? 'google-play' : (result.isSideloaded ? 'download' : 'store')} size={20} color={result.isFromPlayStore ? COLORS.riskLow : (result.isSideloaded ? COLORS.riskMedium : COLORS.textSecondary)} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Installation Source</Text>
                                <Text style={[styles.infoValue, { color: result.isFromPlayStore ? COLORS.riskLow : (result.isSideloaded ? COLORS.riskMedium : COLORS.textPrimary) }]}>
                                    {result.isFromPlayStore ? '✓ Google Play Store' : (result.isSideloaded ? '⚠ Sideloaded' : 'Third-Party Store')}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconContainer}>
                                <MaterialCommunityIcons name={result.isTrusted ? 'shield-check' : 'shield-outline'} size={20} color={result.isTrusted ? COLORS.riskLow : COLORS.textSecondary} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Publisher Status</Text>
                                <Text style={[styles.infoValue, { color: result.isTrusted ? COLORS.riskLow : COLORS.textPrimary }]}>
                                    {result.isTrusted ? '✓ Verified Publisher' : 'Unverified Publisher'}
                                </Text>
                            </View>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.infoRow}>
                            <View style={styles.infoIconContainer}>
                                <MaterialCommunityIcons name="package-variant" size={20} color={COLORS.textMuted} />
                            </View>
                            <View style={styles.infoContent}>
                                <Text style={styles.infoLabel}>Package Name</Text>
                                <Text style={[styles.infoValue, styles.packageNameText]} numberOfLines={1}>{file.packageName || result.packageName || 'Unknown'}</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* Threat Details - only for MEDIUM/HIGH */}
                {result.risk !== 'LOW' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Threat Analysis</Text>
                        <View style={styles.card}>
                            {loading ? (
                                <ActivityIndicator color={COLORS.secondary} />
                            ) : (
                                <>
                                    {malwareAnalysis && (
                                        <View style={styles.threatScoreRow}>
                                            <View style={styles.threatScoreCircle}>
                                                <Text style={styles.threatScoreValue}>{malwareAnalysis.threatScore}</Text>
                                                <Text style={styles.threatScoreLabel}>Score</Text>
                                            </View>
                                            <View style={styles.threatInfo}>
                                                <Text style={[styles.threatLevel, { color: getRiskColor(malwareAnalysis.threatLevel) }]}>{malwareAnalysis.threatLevel} THREAT</Text>
                                                <Text style={styles.threatStatus}>{malwareAnalysis.isSafe ? '✓ App appears safe' : '⚠ Potential risks detected'}</Text>
                                            </View>
                                        </View>
                                    )}
                                    <View style={styles.divider} />
                                    <Text style={styles.explanationTitle}>Why this assessment?</Text>
                                    {getThreatExplanation().map((explanation, index) => (
                                        <View key={index} style={styles.explanationRow}>
                                            <MaterialCommunityIcons name={result.risk === RISK_LEVELS.LOW ? 'check-circle' : 'alert-circle'} size={16} color={result.risk === RISK_LEVELS.LOW ? COLORS.riskLow : COLORS.riskMedium} />
                                            <Text style={styles.explanationText}>{explanation}</Text>
                                        </View>
                                    ))}
                                </>
                            )}
                        </View>
                    </View>
                )}

                {/* Permission Breakdown - only for MEDIUM/HIGH */}
                {result.risk !== 'LOW' && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Permission Breakdown</Text>
                        <View style={styles.card}>
                            {loading ? (
                                <ActivityIndicator color={COLORS.secondary} />
                            ) : permissions.length === 0 ? (
                                <Text style={styles.noPermissions}>No special permissions required</Text>
                            ) : (
                                <>
                                    <View style={styles.permissionStats}>
                                        <View style={[styles.permStat, { backgroundColor: COLORS.riskHigh + '20' }]}>
                                            <Text style={[styles.permStatNum, { color: COLORS.riskHigh }]}>{highRiskPerms.length}</Text>
                                            <Text style={styles.permStatLabel}>High</Text>
                                        </View>
                                        <View style={[styles.permStat, { backgroundColor: COLORS.riskMedium + '20' }]}>
                                            <Text style={[styles.permStatNum, { color: COLORS.riskMedium }]}>{mediumRiskPerms.length}</Text>
                                            <Text style={styles.permStatLabel}>Medium</Text>
                                        </View>
                                        <View style={[styles.permStat, { backgroundColor: COLORS.riskLow + '20' }]}>
                                            <Text style={[styles.permStatNum, { color: COLORS.riskLow }]}>{lowRiskPerms.length}</Text>
                                            <Text style={styles.permStatLabel}>Low</Text>
                                        </View>
                                    </View>
                                    <View style={styles.divider} />
                                    {(showAllPermissions ? permissions : permissions.slice(0, 8)).map((perm, index) => (
                                        <View key={index} style={styles.permissionRow}>
                                            <View style={[styles.permIcon, { backgroundColor: getRiskColor(perm.riskLevel) + '20' }]}>
                                                <MaterialCommunityIcons name={getPermissionIcon(perm.icon)} size={18} color={getRiskColor(perm.riskLevel)} />
                                            </View>
                                            <View style={styles.permInfo}>
                                                <Text style={styles.permName}>{perm.shortName}</Text>
                                                <Text style={styles.permDesc} numberOfLines={1}>{perm.description}</Text>
                                            </View>
                                            <View style={[styles.permRiskBadge, { backgroundColor: getRiskColor(perm.riskLevel) + '20' }]}>
                                                <Text style={[styles.permRiskText, { color: getRiskColor(perm.riskLevel) }]}>{perm.riskLevel}</Text>
                                            </View>
                                        </View>
                                    ))}
                                    {permissions.length > 8 && (
                                        <TouchableOpacity style={styles.morePermsButton} onPress={() => setShowAllPermissions(!showAllPermissions)}>
                                            <Text style={styles.morePermsText}>{showAllPermissions ? 'Show Less' : `+${permissions.length - 8} more permissions`}</Text>
                                            <MaterialCommunityIcons name={showAllPermissions ? 'chevron-up' : 'chevron-down'} size={18} color={COLORS.secondary} />
                                        </TouchableOpacity>
                                    )}
                                </>
                            )}
                        </View>
                    </View>
                )}

                {/* Actions */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Actions</Text>
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity style={[styles.actionButton, styles.settingsButton]} onPress={handleOpenSettings}>
                            <MaterialCommunityIcons name="cog" size={20} color={COLORS.secondary} />
                            <Text style={styles.settingsButtonText}>App Settings</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionButton, styles.uninstallButton]} onPress={handleUninstall}>
                            <MaterialCommunityIcons name="delete" size={20} color={COLORS.riskHigh} />
                            <Text style={styles.uninstallButtonText}>Uninstall</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('HomeMain')} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="arrow-left" size={18} color={COLORS.secondary} />
                    <Text style={styles.backButtonText}>Back to Home</Text>
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollView: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingBottom: 30 },

    // Scan animation overlay
    scanOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 },
    scanPulseCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.secondary + '15', justifyContent: 'center', alignItems: 'center', marginBottom: 30, borderWidth: 2, borderColor: COLORS.secondary + '40' },
    scanTitle: { fontSize: 22, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 6 },
    scanAppName: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 30 },
    scanProgressContainer: { width: '100%', height: 6, backgroundColor: COLORS.surface, borderRadius: 3, overflow: 'hidden', marginBottom: 16 },
    scanProgressFill: { height: '100%', backgroundColor: COLORS.secondary, borderRadius: 3 },
    scanStatusText: { fontSize: 13, color: COLORS.textMuted, textAlign: 'center', minHeight: 20 },
    scanModelBadge: { flexDirection: 'row', alignItems: 'center', marginTop: 30, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: COLORS.surface, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
    scanModelText: { fontSize: 12, color: COLORS.textSecondary, marginLeft: 6, fontWeight: '600' },

    // Header
    headerBar: { flexDirection: 'row', alignItems: 'center', paddingTop: 12, paddingBottom: 4 },
    headerBackButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingRight: 12, borderRadius: 10 },
    headerBackText: { fontSize: 16, fontWeight: '600', color: COLORS.textPrimary, marginLeft: 2 },
    header: { alignItems: 'center', paddingTop: 8, paddingBottom: 20 },
    headerIcon: { fontSize: 36, marginBottom: 10 },
    headerTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary },
    headerSubtitle: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },

    // ML Result Header (ML mode)
    mlResultHeader: { alignItems: 'center', paddingTop: 10, paddingBottom: 24 },
    mlResultIconCircle: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    mlResultVerdict: { fontSize: 32, fontWeight: '900', letterSpacing: 1 },
    mlResultConfLabel: { fontSize: 14, color: COLORS.textSecondary, marginTop: 6 },

    // Sections & Cards
    section: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
    divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: 14 },

    // File header
    fileHeader: { flexDirection: 'row', alignItems: 'center' },
    fileIcon: { fontSize: 32, marginRight: 14 },
    appIcon: { width: 48, height: 48, borderRadius: 10, marginRight: 14 },
    fileInfo: { flex: 1 },
    fileName: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
    fileHash: { fontSize: 11, color: COLORS.textMuted, fontFamily: 'monospace' },
    detailsGrid: { flexDirection: 'row' },
    detailItem: { flex: 1 },
    detailLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
    detailValue: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },

    // Assessment
    assessmentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    assessmentLabel: { fontSize: 14, color: COLORS.textSecondary },
    riskBadge: { paddingHorizontal: 14, paddingVertical: 6 },
    confidenceSection: { marginTop: 4 },
    confidenceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    confidenceValue: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary },
    progressBar: { height: 10, backgroundColor: COLORS.surface, borderRadius: 5, overflow: 'hidden' },
    progressFill: { height: '100%', borderRadius: 5 },

    // ML detail rows (ML mode)
    mlDetailRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    mlDetailContent: { flex: 1, marginLeft: 12 },
    mlDetailLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
    mlDetailValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },

    // Risk interpretation (ML mode)
    riskInterpretBanner: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, borderRadius: 10, borderLeftWidth: 3 },
    riskInterpretText: { flex: 1, fontSize: 13, marginLeft: 10, lineHeight: 19, fontWeight: '500' },

    // ML classification
    mlPredictionRow: { flexDirection: 'row', alignItems: 'center' },
    mlIconContainer: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.secondary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    mlPredictionInfo: { flex: 1 },
    mlPredictionLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
    mlPredictionBadgeRow: { flexDirection: 'row', alignItems: 'center' },
    mlPredictionBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginRight: 8 },
    mlPredictionBadgeText: { fontSize: 13, fontWeight: '700' },
    mlConfText: { fontSize: 12, color: COLORS.textSecondary },
    mlProbRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    mlProbLabel: { width: 70, fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
    mlProbBarContainer: { flex: 1, height: 8, backgroundColor: COLORS.surface, borderRadius: 4, overflow: 'hidden', marginHorizontal: 8 },
    mlProbBar: { height: '100%', borderRadius: 4 },
    mlProbValue: { width: 36, fontSize: 12, fontWeight: '600', color: COLORS.textPrimary, textAlign: 'right' },
    mlUnavailable: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
    mlUnavailableText: { fontSize: 13, color: COLORS.textMuted, marginLeft: 8 },

    // Threat analysis
    threatScoreRow: { flexDirection: 'row', alignItems: 'center' },
    threatScoreCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
    threatScoreValue: { fontSize: 20, fontWeight: '800', color: COLORS.textPrimary },
    threatScoreLabel: { fontSize: 10, color: COLORS.textMuted },
    threatInfo: { flex: 1 },
    threatLevel: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
    threatStatus: { fontSize: 13, color: COLORS.textSecondary },
    explanationTitle: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 10 },
    explanationRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
    explanationText: { flex: 1, fontSize: 13, color: COLORS.textSecondary, marginLeft: 8, lineHeight: 18 },

    // Permissions
    noPermissions: { fontSize: 14, color: COLORS.textMuted, textAlign: 'center', paddingVertical: 20 },
    permissionStats: { flexDirection: 'row', justifyContent: 'space-around' },
    permStat: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 12 },
    permStatNum: { fontSize: 22, fontWeight: '800' },
    permStatLabel: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
    permissionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
    permIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    permInfo: { flex: 1 },
    permName: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    permDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
    permRiskBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
    permRiskText: { fontSize: 10, fontWeight: '700' },
    morePermsButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: COLORS.divider },
    morePermsText: { fontSize: 13, color: COLORS.secondary, fontWeight: '600', marginRight: 4 },

    // Action buttons
    actionButtonsContainer: { flexDirection: 'row', gap: 12 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
    settingsButton: { backgroundColor: COLORS.secondary + '15', borderColor: COLORS.secondary },
    settingsButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.secondary, marginLeft: 8 },
    uninstallButton: { backgroundColor: COLORS.riskHigh + '15', borderColor: COLORS.riskHigh },
    uninstallButtonText: { fontSize: 14, fontWeight: '600', color: COLORS.riskHigh, marginLeft: 8 },
    backButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 10, marginBottom: 10, backgroundColor: COLORS.secondary + '15', borderRadius: 12, borderWidth: 1, borderColor: COLORS.secondary + '30' },
    backButtonText: { fontSize: 15, color: COLORS.secondary, fontWeight: '600', marginLeft: 8 },

    // App info
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    infoIconContainer: { width: 36, height: 36, borderRadius: 8, backgroundColor: COLORS.surface, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    infoContent: { flex: 1 },
    infoLabel: { fontSize: 12, color: COLORS.textMuted, marginBottom: 2 },
    infoValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
    packageNameText: { fontSize: 11, fontFamily: 'monospace', color: COLORS.textSecondary },
});

export default ScanResultScreen;
