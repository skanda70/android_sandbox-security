# Android Sandbox

A clean, examiner-friendly React Native UI for a security-focused Android file analysis app.

## 📱 Features

- **Home Screen**: Scan button and recent files display
- **Scan Result Screen**: SOC-style security assessment report
- **History Screen**: Previously scanned files grouped by date
- **Settings Screen**: Toggle switches for scan settings

## 📂 Project Structure

```
AndroidSandboxApp/
├── src/
│   ├── App.js                 # Main entry with navigation
│   ├── screens/
│   │   ├── HomeScreen.js      # Main landing page
│   │   ├── ScanResultScreen.js # Security report display
│   │   ├── HistoryScreen.js   # Scan history list
│   │   └── SettingsScreen.js  # App settings
│   ├── components/
│   │   ├── FileCard.js        # Reusable file card
│   │   ├── RiskBadge.js       # Color-coded risk badge
│   │   └── ScanButton.js      # Primary action button
│   ├── services/
│   │   └── api.js             # API integration layer
│   └── utils/
│       └── constants.js       # Colors, risk levels, config
├── package.json
├── index.js
├── app.json
├── babel.config.js
└── metro.config.js
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- React Native CLI
- Android Studio (for Android development)
- Xcode (for iOS development on macOS)

### Installation

```bash
# Navigate to project directory
cd AndroidSandboxApp

# Install dependencies
npm install

# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)
npm run ios
```

## 🎨 UI Design

- **Minimal & Clean**: Security-focused design without clutter
- **High Contrast Risk Colors**:
  - 🟢 LOW (Green) - Safe files
  - 🟡 MEDIUM (Yellow) - Potential risks
  - 🔴 HIGH (Red) - Threats detected
- **Dark Theme**: Professional security interface

## 🔌 API Integration

The app sends file metadata to the backend:

```json
{
  "fileName": "example.apk",
  "fileType": "apk",
  "fileSize": "12MB",
  "hash": "sha256-value"
}
```

And receives risk assessment:

```json
{
  "risk": "HIGH",
  "confidence": 0.94,
  "action": "BLOCKED"
}
```

## 🧩 Components

| Component | Description |
|-----------|-------------|
| `FileCard` | Displays file info with risk badge and action status |
| `RiskBadge` | Color-coded badge (LOW/MEDIUM/HIGH) |
| `ScanButton` | Primary button with shield icon |

## 📋 Screens

| Screen | Purpose |
|--------|---------|
| Home | Main landing with scan button and recent files |
| Scan Result | SOC-style security assessment report |
| History | List of previously scanned files |
| Settings | App configuration and info |

## ⚠️ Scope

This is **frontend only**:
- ✅ UI components and navigation
- ✅ API integration layer (placeholder)
- ❌ No malware detection logic
- ❌ No file scanning logic
- ❌ No Android native permissions

## 📄 License

MIT License
