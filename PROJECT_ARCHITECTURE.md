# Project Architecture

## Overview
This project is an Android sandbox security application with a React Native UI and a native Android security layer. The UI focuses on security analysis workflows (scan, report, history, settings), while the native layer collects app metadata, permissions, and behavior signals to produce a risk assessment. The architecture is designed for on-device analysis and minimal external data transmission.

## High-Level Components
1. React Native App (UI Layer)
- Screens: Home, Scan Result, History, Settings
- Components: FileCard, RiskBadge, ScanButton, AppSelectionModal
- Services: `src/services/api.js` acts as the bridge into native Android modules

2. Native Android Layer (Security Core)
- BehaviorModule: React Native bridge module (Kotlin)
- BehaviorMonitor: permissions and installed-apps enumeration
- Planned: sandbox execution, behavior monitoring, detection engine, logging

3. Documentation and Project Status
- `backend/architecture/` contains data flow and module architecture docs
- `backend/project_status/` tracks milestones and current phase

## Data Flow (End-to-End)
1. App selection
- User taps "Start Security Scan"
- UI requests installed apps from the native layer

2. Analysis
- UI requests analysis for the selected package
- Native layer collects permissions and behavior signals
- Risk scoring and action recommendation returned to UI

3. Reporting
- UI renders a SOC-style report (risk, confidence, permissions, threat analysis)

4. Decision
- User can open app settings or uninstall the app

5. History
- UI stores or retrieves past scans and groups them by date

## React Native UI Architecture
1. Navigation
- Bottom tabs: Home, History, Settings
- Stack screens: Scan Result is pushed from Home or History

2. Screens
- Home: primary scan entry point and recent apps list
- Scan Result: detailed report, threat summary, permissions breakdown, actions
- History: grouped list of previous scans
- Settings: configuration toggles and app metadata

3. UI Components
- FileCard: reusable app/file list tile
- RiskBadge: risk level indicator (LOW, MEDIUM, HIGH)
- ScanButton: primary call to action
- AppSelectionModal: app picker for deep scan

4. API Service Layer (`src/services/api.js`)
- Thin wrapper over `NativeModules.BehaviorModule`
- Provides fallback mock data on non-Android devices

## Native Android Architecture
1. BehaviorModule (Bridge)
- Exposes native functionality to React Native
- Currently implements: `getInstalledApps`
- Planned: `analyzeApp`, `getDetailedPermissions`, `getMalwareAnalysis`,
  `openAppSettings`, `uninstallApp`, and monitoring APIs

2. BehaviorMonitor
- Enumerates installed apps
- Retrieves requested permissions
- Logs behavior (planned expansion)

3. Planned Modules (from `backend/architecture/`)
- File Interception Module
- Sandbox Execution Module
- Behavior Monitoring Module
- Detection and Decision Engine
- Logging and Reporting Module

## Data Model (Current UI Expectations)
1. Installed App object
- `packageName`
- `appName` / `fileName`
- `fileSize`
- `iconBase64`
- `hash`

2. Risk Assessment object
- `risk` (LOW, MEDIUM, HIGH)
- `confidence` (0.0 - 1.0)
- `action` (ALLOWED, RESTRICTED, BLOCKED)
- `riskScore` (0 - 100)
- `permissions` (detailed permission list)
- `malwareAnalysis` (threat metadata)

## Security Considerations
- Designed for on-device analysis without external data transmission
- Minimizes direct system access from the UI layer
- User remains in control of final allow/restrict/block decisions

## Repo Layout (Key Paths)
- `app/` React Native UI
- `app/src/screens/` Screen components
- `app/src/components/` UI building blocks
- `app/src/services/` Native bridge API wrapper
- `backend/android/` Native Android module (Kotlin)
- `backend/architecture/` Architecture docs

## Task to File Map
| Task | Files |
| --- | --- |
| App entry and navigation | `app/src/App.js` |
| Home screen UI and scan trigger | `app/src/screens/HomeScreen.js` |
| App selection modal | `app/src/components/AppSelectionModal.js` |
| Scan result report and actions | `app/src/screens/ScanResultScreen.js` |
| History list and grouping UI | `app/src/screens/HistoryScreen.js` |
| Settings toggles and app info UI | `app/src/screens/SettingsScreen.js` |
| Scan button UI | `app/src/components/ScanButton.js` |
| File/app list card UI | `app/src/components/FileCard.js` |
| Risk badge UI | `app/src/components/RiskBadge.js` |
| Colors, risk levels, config constants | `app/src/utils/constants.js` |
| Native bridge API wrapper and mocks | `app/src/services/api.js` |
| Native module bridge (Kotlin) | `backend/android/app/src/main/java/com/androidsandboxapp/BehaviorModule.kt` |
| Native behavior utilities | `backend/android/app/src/main/java/com/androidsandboxapp/BehaviorMonitor.kt` |
| Android manifest (permissions, app entry) | `backend/android/app/src/main/AndroidManifest.xml` |

## Current vs Target Architecture
1. Current
- UI implemented with mock fallback data
- Native module returns only installed package names

2. Target
- Full sandboxed behavior analysis on device
- Structured risk and threat data returned to UI
- Persistent scan history and settings
