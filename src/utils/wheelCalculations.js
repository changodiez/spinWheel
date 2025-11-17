import { CONFIG, PRIZE_COLORS } from '../constants/config';

export const generateColor = (index, total, prizeName) => {
  if (PRIZE_COLORS[prizeName]) {
    return PRIZE_COLORS[prizeName];
  }
  
  // Colores basados en la imagen de la ruleta (11 segmentos en orden horario desde arriba)
  const baseColors = [
    '#ffee4e',  // 1. Bright Yellow (amarillo brillante)
    '#1ccac5',  // 2. Teal (verde azulado)
    '#acabfa',  // 3. Light Lavender (lavanda claro)
    '#2d2df0',  // 4. Royal Blue (azul real)
    '#ff7e47',  // 5. Bright Orange (naranja brillante)
    '#05dc95',  // 6. Emerald Green (verde esmeralda)
    '#ff4f7d',  // 7. Hot Pink (rosa fucsia)
    '#00caf8',  // 8. Bright Cyan (cian brillante)
    '#9ed700',  // 9. Lime Green (verde lima)
    '#fc86bf',  // 10. Light Pink (rosa claro)
    '#8947b6'   // 11. Medium Purple (morado medio)
  ];
  
  return baseColors[index % baseColors.length];
};

const PRIZE_WEIGHTS = {
  'PeraWallet': 0.4, // PeraWallet tiene 30% de probabilidad comparado con otros premios
};

const calculateProbabilities = (prizes, canSelectPeraWalletFn = null) => {
  // Filtrar premios disponibles si hay una función de filtrado (ej: límites de PeraWallet)
  let availablePrizes = prizes;
  if (canSelectPeraWalletFn) {
    availablePrizes = prizes.filter((prize, index) => {
      const prizeName = typeof prize === 'string' ? prize : prize.name;
      if (prizeName === 'PeraWallet') {
        return canSelectPeraWalletFn();
      }
      return true;
    });
  }
  
  const weights = availablePrizes.map(prize => {
    const prizeName = typeof prize === 'string' ? prize : prize.name;
    const prizeQuantity = typeof prize === 'string' ? 1 : (prize.quantity || 0);
    
    // Si es PeraWallet y tiene cantidad 0, peso = 0 (no puede salir)
    if (prizeName === 'PeraWallet' && prizeQuantity === 0) {
      return 0;
    }
    
    // Usar el peso configurado o 1.0 por defecto
    return PRIZE_WEIGHTS[prizeName] || 1.0;
  });
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  // Si el peso total es 0 (todos los premios tienen peso 0), evitar división por cero
  if (totalWeight === 0) {
    console.warn('⚠️ Todos los premios tienen peso 0, usando pesos uniformes');
    return {
      probabilities: weights.map(() => 1.0 / weights.length),
      prizes: availablePrizes
    };
  }
  
  return {
    probabilities: weights.map(w => w / totalWeight),
    prizes: availablePrizes
  };
};

export const selectWeightedWinner = (prizes, canSelectPeraWalletFn = null, showLogs = false) => {
  if (prizes.length === 0) return 0;
  
  const { probabilities, prizes: availablePrizes } = calculateProbabilities(prizes, canSelectPeraWalletFn);
  
  // Si se filtraron premios, necesitamos mapear el índice seleccionado al índice original
  const random = Math.random();
  let cumulative = 0;
  let selectedIndex = 0;
  
  for (let i = 0; i < probabilities.length; i++) {
    cumulative += probabilities[i];
    if (random <= cumulative) {
      selectedIndex = i;
      break;
    }
  }
  
  // Si se filtraron premios, encontrar el índice en el array original
  if (canSelectPeraWalletFn && availablePrizes.length !== prizes.length) {
    const selectedPrize = availablePrizes[selectedIndex];
    const selectedPrizeName = typeof selectedPrize === 'string' ? selectedPrize : selectedPrize.name;
    
    // Buscar el índice en el array original
    for (let i = 0; i < prizes.length; i++) {
      const prizeName = typeof prizes[i] === 'string' ? prizes[i] : prizes[i].name;
      if (prizeName === selectedPrizeName) {
        selectedIndex = i;
        break;
      }
    }
  }
  
  if (showLogs) {
    const winnerPrize = prizes[selectedIndex];
    const winnerPrizeName = typeof winnerPrize === 'string' ? winnerPrize : winnerPrize.name;
    
    // Encontrar la probabilidad correcta del premio seleccionado
    let correctProbability = 'N/A';
    for (let i = 0; i < availablePrizes.length; i++) {
      const prize = availablePrizes[i];
      const prizeName = typeof prize === 'string' ? prize : prize.name;
      if (prizeName === winnerPrizeName) {
        correctProbability = probabilities[i]?.toFixed(4) || 'N/A';
        break;
      }
    }
    
    console.log('🎲 Selección ponderada:', {
      premio: winnerPrizeName,
      indice: selectedIndex,
      probabilidad: correctProbability,
      random: random.toFixed(4)
    });
    
    // Log detallado de todos los pesos (solo la primera vez o cuando cambian)
    if (showLogs && Math.random() < 0.1) { // Solo 10% de las veces para no saturar
      console.log('📊 Pesos de premios:', availablePrizes.map((prize, i) => {
        const prizeName = typeof prize === 'string' ? prize : prize.name;
        const weight = PRIZE_WEIGHTS[prizeName] || 1.0;
        return {
          premio: prizeName,
          peso: weight,
          probabilidad: (probabilities[i] * 100).toFixed(2) + '%'
        };
      }));
    }
  }
  
  return selectedIndex;
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
  const pointerAngle = Math.PI * 1.5; // 3π/2 - puntero apuntando hacia abajo
  
  // El centro del segmento targetIndex está en: targetIndex * slice + slice/2
  // Pero necesitamos que cuando la rueda esté en este ángulo, el puntero apunte al centro del segmento
  // Fórmula corregida: ángulo = pointerAngle - (centro_del_segmento)
  const segmentCenter = targetIndex * slice + slice / 2;
  let targetAngle = pointerAngle - segmentCenter;
  
  // Normalizar al rango [0, 2π]
  targetAngle = ((targetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  
  // Verificación de robustez
  const verifiedIndex = calculateWinnerIndexFromAngle(targetAngle, prizes);
  if (verifiedIndex !== targetIndex) {
    console.warn(`Ajustando ángulo: ${targetIndex} -> ${verifiedIndex}, corrigiendo...`);
    // Pequeña corrección empírica
    targetAngle += slice * 0.1;
    targetAngle = ((targetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  }
  
  return targetAngle;
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

