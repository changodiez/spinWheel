import { CONFIG, PRIZE_COLORS } from '../constants/config';

export const generateColor = (index, total, prizeName) => {
  if (PRIZE_COLORS[prizeName]) {
    return PRIZE_COLORS[prizeName];
  }
  
  const baseColors = [
    '#FF9E6D', '#FFD166', '#06D6A0', '#118AB2', '#073B4C',
    '#EF476F', '#7209B7', '#3A86FF', '#FB5607', '#8338EC', '#FF006E'
  ];
  
  return baseColors[index % baseColors.length];
};

const PRIZE_WEIGHTS = {
  'PeraWallet': 0.3,
};

const calculateProbabilities = (prizes) => {
  const weights = prizes.map(prize => PRIZE_WEIGHTS[prize] || 1.0);
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  return weights.map(w => w / totalWeight);
};

export const selectWeightedWinner = (prizes) => {
  if (prizes.length === 0) return 0;
  
  const probabilities = calculateProbabilities(prizes);
  const random = Math.random();
  
  let cumulative = 0;
  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i];
    if (random <= cumulative) {
      return i;
    }
  }
  
  return prizes.length - 1;
};

export const calculateWinnerIndexFromAngle = (angle, prizes) => {
  if (prizes.length === 0) return 0;
  
  const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const slice = (Math.PI * 2) / prizes.length;
  const pointerAngle = Math.PI * 1.5;
  const relativeAngle = ((pointerAngle - normalizedAngle) + Math.PI * 2) % (Math.PI * 2);
  
  let winnerIndex = Math.floor(relativeAngle / slice) % prizes.length;
  return winnerIndex < 0 ? winnerIndex + prizes.length : winnerIndex;
};

export const calculateAngleForIndex = (targetIndex, prizes) => {
  if (prizes.length === 0) return 0;
  
  const slice = (Math.PI * 2) / prizes.length;
  const pointerAngle = Math.PI * 1.5;
  const targetSliceCenter = targetIndex * slice + slice / 2;
  const targetWheelAngle = pointerAngle - targetSliceCenter;
  
  return ((targetWheelAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
};

export const applyWeightedSelectionWithAngle = (angle, prizes) => {
  if (prizes.length === 0) return { index: 0, finalAngle: angle };
  
  const angleBasedIndex = calculateWinnerIndexFromAngle(angle, prizes);
  const angleBasedPrize = prizes[angleBasedIndex];
  
  let finalIndex = angleBasedIndex;
  
  if (angleBasedPrize === 'PeraWallet') {
    const random = Math.random();
    
    if (random < 0.3) {
      finalIndex = angleBasedIndex;
    } else {
      const otherIndices = prizes
        .map((prize, index) => prize !== 'PeraWallet' ? index : null)
        .filter(index => index !== null);
      
      if (otherIndices.length > 0) {
        const randomOtherIndex = Math.floor(Math.random() * otherIndices.length);
        finalIndex = otherIndices[randomOtherIndex];
      }
    }
  }
  
  let finalAngle = angle;
  if (finalIndex !== angleBasedIndex) {
    finalAngle = calculateAngleForIndex(finalIndex, prizes);
    const originalTurns = Math.floor(angle / (Math.PI * 2));
    finalAngle += originalTurns * (Math.PI * 2);
  }
  
  return { index: finalIndex, finalAngle };
};

export const calculateWinnerIndex = (angle, prizes, useWeightedSelection = true) => {
  if (!useWeightedSelection) {
    return calculateWinnerIndexFromAngle(angle, prizes);
  }
  
  const result = applyWeightedSelectionWithAngle(angle, prizes);
  return result.index;
};

export const getResponsiveSize = () => {
  return Math.min(CONFIG.WHEEL.SIZE, window.innerWidth - 40);
};

