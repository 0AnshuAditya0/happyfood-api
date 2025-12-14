export const theme = {
  colors: {
    // Strawberry Brand Colors
    primary: {
      red: '#E11D48',         // Strawberry Red (Rose 600)
      redLight: '#F43F5E',    // Light Strawberry (Rose 500)
      redDark: '#BE123C',     // Deep Strawberry (Rose 700)
      green: '#10B981',       // Stem Green (Emerald 500)
    },
    
    // Secondary Colors (Vibrant fruit colors)
    secondary: {
      blue: '#3B82F6',
      blueLight: '#60A5FA',
      purple: '#8B5CF6',
      purpleLight: '#A78BFA',
      cyan: '#06B6D4',
      cyanLight: '#22D3EE',
      pink: '#EC4899',
      pinkLight: '#F472B6',
      yellow: '#F59E0B',
    },
    
    // Neutral Colors
    gray: {
      50: '#FFF1F2',  // Rose Tinted White
      100: '#FFE4E6', // Rose 100
      200: '#FECDD3', // Rose 200
      300: '#FDA4AF', // Rose 300
      400: '#FB7185', // Rose 400
      500: '#F43F5E', // Rose 500
      600: '#E11D48', // Rose 600
      700: '#BE123C', // Rose 700
      800: '#9F1239', // Rose 800
      900: '#881337', // Rose 900
    },
    
    // Background Colors
    background: {
      cream: '#FFF1F2',      // Very light pink
      white: '#FFFFFF',
      lightRed: '#FFF5F5',
    },
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #E11D48 0%, #BE123C 100%)', // Strawberry Gradient
    green: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',   // Stem Gradient
    blue: 'linear-gradient(135deg, #60A5FA 0%, #3B82F6 100%)',
    purple: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
    cyan: 'linear-gradient(135deg, #22D3EE 0%, #06B6D4 100%)',
    pink: 'linear-gradient(135deg, #F472B6 0%, #EC4899 100%)',
  },
  
  shadows: {
    sm: '0 1px 2px 0 rgba(225, 29, 72, 0.05)',
    md: '0 4px 6px -1px rgba(225, 29, 72, 0.1)',
    lg: '0 10px 15px -3px rgba(225, 29, 72, 0.1)',
    xl: '0 20px 25px -5px rgba(225, 29, 72, 0.15)',
  },
};

export const getGradient = (type) => theme.gradients[type] || theme.gradients.primary;

export const chartColors = [
  theme.colors.primary.red,
  theme.colors.primary.green,
  theme.colors.secondary.blue,
  theme.colors.secondary.yellow,
  theme.colors.secondary.purple,
];
