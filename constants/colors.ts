export const COLORS = {
  teal: '#0D3135',
  cream: '#FAF8F3',
  darkTeal: '#0A2528',
  lightCream: '#FEFDFB',
  gold: '#AB9380',
  darkGold: '#8B7660',
  accent: '#4A7D83',
  white: '#FFFFFF',
  text: {
    primary: '#0D3135',
    secondary: '#4A7D83',
    light: '#8B9B9B',
  },
  background: {
    primary: '#FAF8F3',
    secondary: '#F5F3EE',
    card: '#FFFFFF',
  },
  accentColors: {
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
  },
} as const;

// Legacy support - will be removed
export const accent = {
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};
