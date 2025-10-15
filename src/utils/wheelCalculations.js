import { CONFIG, PRIZE_COLORS } from '../constants/config';

export const generateColor = (index, total, prizeName) => {
  // Colores especiales para QR codes
  if (PRIZE_COLORS[prizeName]) {
    return PRIZE_COLORS[prizeName];
  }
  
  // Colores base para los demás premios
  const baseColors = [
    '#FF9E6D', '#FFD166', '#06D6A0', '#118AB2', '#073B4C',
    '#EF476F', '#7209B7', '#3A86FF', '#FB5607', '#8338EC', '#FF006E'
  ];
  
  return baseColors[index % baseColors.length];
};

export const calculateWinnerIndex = (angle, prizes) => {
  const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const slice = (Math.PI * 2) / prizes.length;
  const arrowAngle = Math.PI * 1.5;
  const relativeAngle = ((arrowAngle - normalizedAngle) + Math.PI * 2) % (Math.PI * 2);
  
  let winnerIndex = Math.floor(relativeAngle / slice) % prizes.length;
  return winnerIndex < 0 ? winnerIndex + prizes.length : winnerIndex;
};

export const getResponsiveSize = () => {
  return Math.min(CONFIG.WHEEL.SIZE, window.innerWidth - 40);
};

// Función para determinar el color del texto basado en el fondo
export const getTextColor = (backgroundColor) => {
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 128 ? '#000000' : '#FFFFFF';
};