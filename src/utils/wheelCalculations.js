import { CONFIG } from '../constants/config';

export const generateColor = (index, total) => {
  const hue = (index / total) * 360;
  return `hsl(${hue}, 70%, 60%)`;
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