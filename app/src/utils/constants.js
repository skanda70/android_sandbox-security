// Android Sandbox - App Constants
// Defines colors, risk levels, and action statuses for the security app

export const COLORS = {
  // Primary colors
  primary: '#1E3A5F',
  primaryLight: '#2E5077',
  secondary: '#3498DB',
  
  // Background colors
  background: '#0D1B2A',
  surface: '#1B2838',
  card: '#243447',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B0BEC5',
  textMuted: '#78909C',
  
  // Risk level colors (high contrast)
  riskLow: '#4CAF50',      // Green
  riskMedium: '#FFC107',   // Yellow/Amber
  riskHigh: '#F44336',     // Red
  
  // Action status colors
  actionAllowed: '#4CAF50',
  actionRestricted: '#FF9800',
  actionBlocked: '#F44336',
  
  // Border and divider
  border: '#37474F',
  divider: '#455A64',
};

// Risk levels for file assessment
export const RISK_LEVELS = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
};

// Action status after security assessment
export const ACTION_STATUS = {
  ALLOWED: 'ALLOWED',
  RESTRICTED: 'RESTRICTED',
  BLOCKED: 'BLOCKED',
};

// File type icons (using emoji for simplicity)
export const FILE_TYPE_ICONS = {
  apk: '📦',
  pdf: '📄',
  doc: '📝',
  exe: '⚙️',
  zip: '🗜️',
  unknown: '📁',
};

// App configuration
export const APP_CONFIG = {
  name: 'Android Sandbox',
  version: '1.0.0',
  backendStatus: 'Connected',
};
