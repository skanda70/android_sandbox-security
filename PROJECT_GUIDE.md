# Android Sandbox Security Project - Comprehensive Guide

## Project Overview
**Android Sandbox** (Hexlab) is a behavior-based security analysis application for Android that combines traditional permission-based security scanning with machine learning-based malware detection using the EMBER2024 model.

**Tech Stack**: React Native (JavaScript frontend) + Kotlin (Android native implementation)
**Languages**: 52.7% Kotlin, 47.3% JavaScript

---

## 📁 Project Structure & File Breakdown

### **Root Configuration Files**
| File | Purpose |
|------|---------|
| `app.json` | React Native app configuration (name, version, plugins) |
| `babel.config.js` | Babel transpiler configuration for JavaScript transformation |
| `metro.config.js` | Metro bundler configuration for React Native builds |
| `package.json` | Node dependencies and project scripts |
| `index.js` | React Native app entry point |

---

## 🎨 Frontend (JavaScript / React Native)

### **Main Entry Point**
#### `src/App.js`
**Purpose**: Main navigation orchestrator
**Functionality**:
- Sets up bottom tab navigation (Home, History, Settings)
- Creates stack navigators for nested screens
- Configures global navigation container
- Defines tab icon styling and focus states

**Key Features**:
- Uses `@react-navigation/native` for navigation
- Uses `@react-navigation/bottom-tabs` for tab-based UI
- **Props Used**: None (functional component)
- **State Used**: None (purely structural)
- **Hooks Used**: None

---

### **🏠 Screens (User Interfaces)**

#### **1. `src/screens/HomeScreen.js`**
**Purpose**: Main landing page with quick scan button and recent apps
**Functionality**:
- Displays app logo and title
- Shows primary scan button with loading animation
- Lists recently scanned/installed apps
- Modal selection for app deep scanning
- Fetches installed apps on demand

**Key Features**:
- **useState** hooks:
  - `recentFiles`: Stores list of scanned files
  - `allApps`: List of installed apps for selection
  - `loading`: Loading state for files
  - `appsLoading`: Loading state for app list
  - `scanning`: ML scan animation state
  - `modalVisible`: App selection modal visibility
  
- **useEffect** hooks:
  - Initial fetch of recent files on component mount
  
- **Functions**:
  - `fetchRecentFiles()`: Gets scan history from API
  - `handleScan()`: Opens modal and fetches installed apps
  - `handleAppSelect()`: Performs ML analysis on selected app
  - `handleFilePress()`: Navigates to detailed scan results

**Props Received**: `navigation` object (React Navigation prop)

---

#### **2. `src/screens/HistoryScreen.js`**
**Purpose**: Displays all previously scanned files grouped by date
**Functionality**:
- Groups scans into Today, Yesterday, Earlier
- Pull-to-refresh capability
- Lists files with risk badges
- Navigates to scan result details on tap

**Key Features**:
- **useState** hooks:
  - `history`: Object with today/yesterday/earlier arrays
  - `loading`: Initial load state
  - `refreshing`: Pull-to-refresh state
  
- **useEffect** hooks:
  - Fetches history on mount
  
- **Functions**:
  - `fetchHistory()`: Gets complete scan history
  - `onRefresh()`: Handles pull-to-refresh gesture
  - `renderDateSection()`: Renders grouped file cards
  - `handleFilePress()`: Navigates to details

**Props Received**: `navigation` object

---

#### **3. `src/screens/ScanResultScreen.js`** (Largest file - 53KB)
**Purpose**: Displays detailed security analysis results in two modes
**Functionality**:
- **ML-Only Mode**: Shows animated EMBER2024 model scan with live progress
- **Full Report Mode**: Comprehensive security assessment with permissions breakdown
- Displays risk assessment, permissions, malware analysis, ML classification
- Provides action buttons (settings, uninstall)

**Key Features**:
- **useState** hooks:
  - `permissions`: Detailed permission array
  - `malwareAnalysis`: Behavior-based threat analysis
  - `mlAnalysis`: ML model predictions
  - `loading`: Data fetch state
  - `showAllPermissions`: Permission list expansion toggle
  - `scanAnimating`: ML scan animation state
  - `scanStatus`: Current scan stage message
  
- **useRef** hooks (Animation):
  - `scanProgress`: Animated.Value for progress bar
  - `pulseAnim`: Pulsing effect animation
  - `fadeIn`: Fade-in animation for results
  - `slideUp`: Slide-up animation for results
  
- **useEffect** hooks:
  - Decides between ML mode animation or regular data fetch
  
- **Key Functions**:
  - `runScanAnimation()`: Animated 6-stage scanning sequence
  - `fetchDetailedData()`: Gets permissions, malware, ML analysis
  - `getActionColor()`: Maps action status to color
  - `getRiskColor()`: Maps risk level to color
  - `handleUninstall()`: Calls native uninstall via BehaviorModule
  - `handleOpenSettings()`: Opens app settings via native module

**Props Received**: 
- `route.params.file`: File metadata (name, package, icon)
- `route.params.result`: Risk assessment data
- `route.params.scanMode`: 'ml' or undefined
- `navigation` object

---

#### **4. `src/screens/SettingsScreen.js`**
**Purpose**: Configuration and app information screen
**Functionality**:
- Toggle switches for display/security preferences
- Quick actions for device security settings
- App version and status info
- Credits section

**Key Features**:
- **useState** hooks:
  - `showSystemApps`: Boolean toggle
  - `showDetailedRisk`: Boolean toggle
  - `highlightSideloaded`: Boolean toggle
  - `showTrustedApps`: Boolean toggle
  
- **Functions**:
  - `renderToggleSetting()`: Reusable toggle component
  - `renderInfoRow()`: Reusable info display row
  - `openSecuritySettings()`: Opens Android security via Linking API

**Props Received**: None (Settings is top-level tab)

---

### **🧩 Components (Reusable UI Elements)**

#### **1. `src/components/AppSelectionModal.js`**
**Purpose**: Bottom sheet modal for selecting apps to deep scan
**Functionality**:
- Displays list of installed apps with icons
- Shows app name and package
- Animated slide-up presentation
- Loading and empty states

**Key Features**:
- **Functional Component** (No state management)
- **Props**:
  - `visible`: Boolean for modal visibility
  - `onClose`: Callback to close modal
  - `onSelectApp`: Callback with selected app data
  - `apps`: Array of app objects
  - `loading`: Boolean loading state
  
- **Sub-functions**:
  - `renderAppItem()`: Individual app list item renderer

**No Hooks Used**: Purely presentational component receiving all data via props

---

#### **2. `src/components/FileCard.js`**
**Purpose**: Reusable card component displaying file/app scan information
**Functionality**:
- Shows file icon (or app icon from base64)
- Displays file name, type, size
- Shows last scan time in relative format
- Displays risk badge and action status
- Touchable to view details

**Key Features**:
- **Functional Component** (No state management)
- **Props**:
  - `file`: Object with name, type, risk, action, icon
  - `onPress`: Callback on card tap
  - `style`: Optional styling
  
- **Helper Functions**:
  - `formatRelativeTime()`: Converts timestamp to "X min ago" format
  - `getFileIcon()`: Maps file type to icon name
  - `getActionColor()`: Maps action status to color

**No Hooks Used**: Purely presentational component

---

#### **3. `src/components/RiskBadge.js`**
**Purpose**: Color-coded risk level indicator badge
**Functionality**:
- Displays risk level (LOW/MEDIUM/HIGH)
- Shows emoji indicator (🟢/🟡/🔴)
- Color-coded background

**Key Features**:
- **Functional Component** (No state)
- **Props**:
  - `risk`: Risk level string ('LOW', 'MEDIUM', 'HIGH')
  - `style`: Optional styling
  
- **Functions**:
  - `getBadgeColor()`: Returns color code for risk level
  - `getRiskIndicator()`: Returns emoji for risk level

**No Hooks Used**: Purely presentational

---

#### **4. `src/components/ScanButton.js`**
**Purpose**: Primary action button with gradient and loading animation
**Functionality**:
- Displays scan button with gradient background
- Shows loading state with spinner and text
- Can be disabled
- Provides haptic feedback via TouchableOpacity

**Key Features**:
- **Functional Component** (No state)
- **Props**:
  - `onPress`: Button tap callback
  - `label`: Button text
  - `loading`: Boolean loading state
  - `loadingText`: Text shown during loading
  - `disabled`: Boolean to disable button
  - `style`: Optional styling
  
- **Libraries Used**:
  - `react-native-linear-gradient`: For gradient effect

**No Hooks Used**: Purely presentational

---

### **📡 Services**

#### `src/services/api.js`
**Purpose**: Bridge between React Native frontend and native Android module
**Functionality**: All functions interact with the native `BehaviorModule` (Kotlin)

**Key Export Functions**:

1. **`getInstalledApps()`**
   - Calls: `BehaviorModule.getInstalledApps()`
   - Returns: Array of installed app objects
   - Fallback: Mock app list if native unavailable

2. **`analyzeApp(packageName)`**
   - Calls: `BehaviorModule.analyzeApp(packageName)`
   - Returns: Object with `{risk, confidence, action}`
   - Detects: Permissions, threats, etc.

3. **`scanFile(fileMetadata)`**
   - For APK: Uses native analysis
   - For other files: Returns mock results
   - Returns: Risk assessment

4. **`getRecentFiles()`**
   - Fetches: All apps + analyzes each
   - Returns: Array of app objects with scan results
   - Groups: By timestamp

5. **`getScanHistory()`**
   - Fetches: All apps analyzed
   - Returns: Grouped object `{today, yesterday, earlier}`
   - Groups: By date ranges

6. **`getDetailedPermissions(packageName)`**
   - Calls: `BehaviorModule.getDetailedPermissions(packageName)`
   - Returns: Array of permission objects with risk levels
   - Info per permission: `{permission, shortName, riskLevel, category, description, icon}`

7. **`getMalwareAnalysis(packageName)`**
   - Calls: `BehaviorModule.getMalwareAnalysis(packageName)`
   - Returns: Threat scoring object
   - Info: `{threatLevel, threatScore, suspiciousNameMatch, matchedComboCount, isSafe}`

8. **`getMLAnalysis(packageName)`**
   - Calls: `BehaviorModule.getMLAnalysis(packageName)` ⭐ **Most Important for ML**
   - Model: EMBER2024 (2381-dimensional feature vector)
   - Runtime: ONNX Runtime (on-device inference)
   - Returns: `{prediction ('Benign'/'Malicious'), confidence, probabilities, riskLevel, isBenign}`

9. **`monitorAllApps()`**
   - Calls: `BehaviorModule.monitorAllApps()`
   - Returns: Status message
   - Purpose: Debugging/logging all app permissions

**Mock Fallback Functions** (for non-Android testing):
- `getMockPermissions()`: Sample permissions
- `getMockMalwareAnalysis()`: Sample threat analysis
- `getMockMLAnalysis()`: Sample ML prediction
- `getMockScanResult()`: File-type-based mock results
- `getMockApps()`: Sample installed apps

---

### **⚙️ Utilities**

#### `src/utils/constants.js`
**Purpose**: Global constants and theme definitions
**Exports**:

1. **`COLORS` Object**:
   - Primary: `primary`, `primaryLight`, `secondary`
   - Background: `background`, `surface`, `card`
   - Text: `textPrimary`, `textSecondary`, `textMuted`
   - Risk: `riskLow`, `riskMedium`, `riskHigh`
   - Action: `actionAllowed`, `actionRestricted`, `actionBlocked`
   - UI: `border`, `divider`

2. **`RISK_LEVELS`**: `{ LOW, MEDIUM, HIGH }`

3. **`ACTION_STATUS`**: `{ ALLOWED, RESTRICTED, BLOCKED }`

4. **`FILE_TYPE_ICONS`**: Maps file types to Material icons
   - `apk` → 'android'
   - `pdf` → 'file-pdf-box'
   - `exe` → 'application-cog'
   - etc.

5. **`APP_CONFIG`**:
   - `name`: 'Android Sandbox'
   - `version`: '1.0.0'
   - `backendStatus`: 'Connected'

---

## 🤖 Android Native Layer (Kotlin)

### **Core Kotlin Files** (Android Implementation)

#### **1. `android/app/src/main/java/com/tempandroidsandbox/MainActivity.kt`**
**Purpose**: Android app entry point
**Functionality**:
- Initializes React Native
- Bridges JavaScript to native Kotlin code

#### **2. `BehaviorModule.kt`** (Native Bridge)
**Purpose**: React Native module that exposes Kotlin functions to JavaScript
**Key Exposed Functions** (called from api.js):
- `getInstalledApps()`
- `analyzeApp(packageName)`
- `getDetailedPermissions(packageName)`
- `getMalwareAnalysis(packageName)`
- `getMLAnalysis(packageName)` ⭐ **ML Bridge**
- `monitorAllApps()`
- `uninstallApp(packageName)`
- `openAppSettings(packageName)`

**Architecture**: Implements React Native's `ReactContextBaseJavaModule`

#### **3. `BehaviorMonitor.kt`**
**Purpose**: Runtime app behavior monitoring
**Functionality**:
- Tracks running processes
- Monitors file system access
- Detects suspicious behaviors
- Cross-references with known malware patterns

**Key Methods**:
- `monitorAppBehavior()`: Watches live app activity
- `detectAnomalies()`: Identifies suspicious patterns
- `calculateBehaviorScore()`: Generates threat score

#### **4. `ThreatScoringEngine.kt`** (30KB - Complex Logic)
**Purpose**: Comprehensive threat assessment engine
**Functionality**:
- Combines multiple threat indicators
- Scores apps on 0-100 scale
- Categories: Permission risk, behavior risk, ML risk
- Returns: Risk level (LOW/MEDIUM/HIGH)

**Scoring Factors**:
- Permission count and types
- API call patterns
- Network behavior
- File system access
- Battery/resource usage
- Malware database matches

#### **5. `FeatureExtractor.kt`** (24KB - Feature Engineering)
**Purpose**: Extracts features for ML model input
**Functionality**:
- Parses APK binary structure
- Extracts 2381-dimensional feature vector
- Analyzes bytecode patterns
- Detects code obfuscation

**Output**: Feature vector for EMBER2024 model

#### **6. `EmberFeatureExtractor.kt`**
**Purpose**: EMBER2024-specific feature extraction
**Functionality**:
- Specialized feature computation for EMBER2024
- Extracts PE/APK binary characteristics
- Returns normalized feature vector

#### **7. `OnnxMalwareClassifier.kt`** (ONNX Runtime)
**Purpose**: ML model inference engine
**Functionality**:
- Loads EMBER2024 ONNX model
- Runs on-device inference
- Returns: Prediction (Benign/Malicious) + Confidence

**Model**: EMBER2024 APK Classifier
**Framework**: ONNX Runtime (cross-platform ML)
**Device**: All processing on-device (privacy-focused)

#### **8. `MalwareDetector.kt`**
**Purpose**: Pattern-based malware detection
**Functionality**:
- Signature database matching
- Behavioral pattern recognition
- Heuristic analysis
- Returns: Threat level + indicators

#### **9. `NetworkAnalyzer.kt`**
**Purpose**: Network activity analysis
**Functionality**:
- Monitors network requests
- Detects C&C communications
- Identifies data exfiltration
- Flags suspicious domains

#### **10. `MainApplication.kt`**
**Purpose**: Application initialization
**Functionality**:
- Registers BehaviorModule
- Sets up React Native
- Initializes logger

#### **11. `BehaviorPackage.kt`**
**Purpose**: React Native package definition
**Functionality**:
- Exports BehaviorModule to JavaScript
- Implements ReactPackage interface

---

## 🔄 Data Flow Example

### **User Starts ML Scan**
```
1. HomeScreen → handleScan()
2. User selects app from modal
3. handleAppSelect() calls:
   - analyzeApp(packageName) → BehaviorModule
   - getMLAnalysis(packageName) → BehaviorModule
4. BehaviorModule (Kotlin):
   - FeatureExtractor extracts 2381-d features
   - OnnxMalwareClassifier runs EMBER2024 model
   - Returns: {prediction, confidence, probabilities}
5. Navigate to ScanResultScreen with ML mode
6. runScanAnimation() shows 6-stage progress:
   - Reading APK binary
   - Extracting features
   - Computing vectors
   - Running inference
   - Analyzing output
   - Generating report
7. Results displayed with confidence score
```

---

## 🎯 Key Architectural Patterns

### **1. React Navigation Pattern**
- Bottom tabs for main sections (Home, History, Settings)
- Stack navigators within tabs for deep linking
- Modal overlays for app selection

### **2. State Management**
- **Local State**: `useState` in screens (recentFiles, loading, etc.)
- **Prop Drilling**: Components receive data from parent screens
- **No Global State**: Simple but effective for this scale

### **3. Native Bridge Pattern**
- JavaScript calls → BehaviorModule (Kotlin)
- Kotlin returns → Promise resolution in JS
- Async/await for clean integration

### **4. Animation Pattern** (ScanResultScreen)
- `useRef` + `Animated` API for smooth 60fps animations
- Loop pulse animation during scanning
- Sequential progress updates with timing delays
- Fade-in on completion

### **5. Mock/Fallback Pattern**
- Try native → Fallback to mock if unavailable
- Enables testing on iOS simulator
- Graceful degradation

---

## 📊 Component Dependency Graph

```
App.js (Navigation Container)
├── HomeStack
│   ├── HomeScreen
│   │   ├── ScanButton (reusable button)
│   │   ├── FileCard (reusable card)
│   │   └── AppSelectionModal (modal overlay)
│   └── ScanResultScreen
│       ├── RiskBadge (risk indicator)
│       └── [Various info displays]
├── HistoryStack
│   ├── HistoryScreen
│   │   └── FileCard (reusable card)
│   └── ScanResultScreen
└── SettingsScreen (standalone)
```

---

## 🚀 Technology Keywords By File

### **HomeScreen.js**
- `useState`, `useEffect`, `useCallback` ✓
- Navigation: `navigation.navigate()` ✓
- Promise.all() for parallel requests ✓

### **HistoryScreen.js**
- `useState`, `useEffect` ✓
- `RefreshControl` for pull-to-refresh ✓
- Array mapping and filtering ✓

### **ScanResultScreen.js**
- `useState`, `useRef`, `useEffect` ✓
- **Animated API**: `Animated.Value()`, `Animated.timing()`, `Animated.loop()` ✓
- **Easing functions**: `Easing.inOut()`, `Easing.out()` ✓
- `Interpolate()` for smooth transitions ✓
- Conditional rendering for two scan modes ✓
- NativeModules for bridge calling ✓

### **AppSelectionModal.js**
- `FlatList` with keyExtractor ✓
- `Modal` component ✓
- Conditional rendering ✓

### **FileCard.js**
- `Image` component for base64 rendering ✓
- `formatRelativeTime()` helper ✓
- Switch statement for status mapping ✓

### **api.js**
- Platform-specific checks ✓
- Try/catch error handling ✓
- Promise.all() for parallel operations ✓
- Mock data fallbacks ✓
- NativeModules destructuring ✓

---

## 🔐 Security Features Implemented

1. **Permission Analysis**: Evaluates dangerous permissions
2. **Behavior Monitoring**: Tracks runtime suspicious activity
3. **ML Classification**: EMBER2024 model detects malware
4. **Threat Scoring**: Combines multiple indicators
5. **Network Monitoring**: Detects C&C communications
6. **Feature Extraction**: 2381-dimensional binary analysis
7. **On-Device Processing**: No data sent to cloud

---

## 📝 Summary Table

| Component | Type | State | Hooks | Purpose |
|-----------|------|-------|-------|---------|
| App.js | Navigation | None | None | Main router |
| HomeScreen | Screen | ✓ | useState, useEffect | Scan launcher |
| HistoryScreen | Screen | ✓ | useState, useEffect | Past scans |
| ScanResultScreen | Screen | ✓ | useState, useRef, useEffect | Results display |
| SettingsScreen | Screen | ✓ | useState | Configuration |
| AppSelectionModal | Component | None | None | Modal selector |
| FileCard | Component | None | None | File display |
| RiskBadge | Component | None | None | Risk indicator |
| ScanButton | Component | None | None | Primary button |
| api.js | Service | None | None | Native bridge |
| constants.js | Utility | None | None | Theme/config |

---

**Project Maintained By**: Skanda, Deekshith, Pratham, Afthab
**License**: Open source
**Version**: 1.0.0
