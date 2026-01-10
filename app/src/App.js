// Android Sandbox - Main App Entry Point
// Sets up navigation with bottom tabs and stack navigator for scan results

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text, View, StyleSheet } from 'react-native';

import { COLORS } from './utils/constants';
import HomeScreen from './screens/HomeScreen';
import ScanResultScreen from './screens/ScanResultScreen';
import HistoryScreen from './screens/HistoryScreen';
import SettingsScreen from './screens/SettingsScreen';

// Create navigators
const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

/**
 * Tab icon component
 * Displays emoji icon with color based on focus state
 */
const TabIcon = ({ icon, focused }) => (
    <View style={styles.tabIconContainer}>
        <Text style={[styles.tabIcon, focused && styles.tabIconFocused]}>
            {icon}
        </Text>
    </View>
);

/**
 * Home Stack Navigator
 * Contains Home screen and Scan Result screen
 */
const HomeStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background },
            }}
        >
            <Stack.Screen name="HomeMain" component={HomeScreen} />
            <Stack.Screen
                name="ScanResult"
                component={ScanResultScreen}
                options={{
                    presentation: 'card',
                }}
            />
        </Stack.Navigator>
    );
};

/**
 * History Stack Navigator
 * Contains History screen with navigation to Scan Result
 */
const HistoryStack = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background },
            }}
        >
            <Stack.Screen name="HistoryMain" component={HistoryScreen} />
            <Stack.Screen
                name="ScanResult"
                component={ScanResultScreen}
                options={{
                    presentation: 'card',
                }}
            />
        </Stack.Navigator>
    );
};

/**
 * Main Tab Navigator
 * Bottom tabs: Home, History, Settings
 */
const TabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: styles.tabBar,
                tabBarActiveTintColor: COLORS.secondary,
                tabBarInactiveTintColor: COLORS.textMuted,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tab.Screen
                name="Home"
                component={HomeStack}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="History"
                component={HistoryStack}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon icon="📜" focused={focused} />,
                }}
            />
            <Tab.Screen
                name="Settings"
                component={SettingsScreen}
                options={{
                    tabBarIcon: ({ focused }) => <TabIcon icon="⚙️" focused={focused} />,
                }}
            />
        </Tab.Navigator>
    );
};

/**
 * Main App Component
 * Wraps everything in NavigationContainer
 */
const App = () => {
    return (
        <NavigationContainer>
            <TabNavigator />
        </NavigationContainer>
    );
};

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.border,
        borderTopWidth: 1,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    tabIconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIcon: {
        fontSize: 22,
        opacity: 0.6,
    },
    tabIconFocused: {
        opacity: 1,
    },
});

export default App;
