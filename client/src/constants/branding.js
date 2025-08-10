import logoImage from '../components/Common/Logo/logo.png';

export const BRAND = {
  name: 'neibrly',
  displayName: 'neibrly',
  tagline: 'Connect with your neighbors',
  description: 'A neighborhood community platform',
  colors: {
    primary: '#4A90E2', // Blue from logo
    secondary: '#F5C842', // Yellow from logo
    accent: '#0f1563' // Black from logo
  },
  logo: {
    primary: logoImage,
    favicon: '/favicon.ico',
    sizes: {
      small: logoImage,
      medium: logoImage,
      large: logoImage
    }
  },
  metadata: {
    title: 'neibrly - Connect with your neighbors',
    description: 'Join your neighborhood community on neibrly'
  }
};