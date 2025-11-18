import { CONFIG, PRIZE_COLORS } from '../constants/config';

export const generateColor = (index, total, prizeName) => {
  if (PRIZE_COLORS[prizeName]) {
    return PRIZE_COLORS[prizeName];
  }
  
  // Colores basados en la imagen de la ruleta (11 segmentos en orden horario desde arriba)
  const baseColors = [
'#ffee56',  // 1. Vivid Yellow (amarillo vívido)
'#4ad9d5',  // 2. Bright Aqua (aqua brillante)
'#b4b4ff',  // 3. Soft Periwinkle (periwinkle suave)
'#7a7af7',  // 4. Bright Lavender Blue (azul lavanda brillante)
'#ff8a5c',  // 5. Soft Coral Orange (coral naranja suave)
'#27e3a8',  // 6. Mint Emerald (verde esmeralda menta)
'#ff5f88',  // 7. Neon Pink (rosa neón)
'#00d6ff',  // 8. Electric Cyan (cian eléctrico)
'#b0e231',  // 9. Fresh Lime Green (verde lima fresco)
'#ffa6d2',  // 10. Candy Pink (rosa caramelo)
'#c28ae3'   // 11. Soft Lilac Purple (lila suave)
  ];
  
  return baseColors[index % baseColors.length];
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
  
  // Filtrar premios con peso 0 (cantidad 0) - estos NO pueden ser seleccionados
  availablePrizes = availablePrizes.filter(prize => {
    const prizeName = typeof prize === 'string' ? prize : prize.name;
    const prizeQuantity = typeof prize === 'string' ? 1 : (prize.quantity || 0);
    return prizeQuantity > 0; // Solo incluir premios con cantidad > 0
  });
  
  const weights = availablePrizes.map(prize => {
    const prizeName = typeof prize === 'string' ? prize : prize.name;
    const prizeQuantity = typeof prize === 'string' ? 1 : (prize.quantity || 0);
    
    // El peso es igual a la cantidad del premio
    return prizeQuantity;
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
  
  // Si se filtraron premios (premios con peso 0 fueron eliminados), mapear al índice original
  if (availablePrizes.length !== prizes.length) {
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
      console.log('📊 Pesos de premios (basados en cantidad):', availablePrizes.map((prize, i) => {
        const prizeName = typeof prize === 'string' ? prize : prize.name;
        const prizeQuantity = typeof prize === 'string' ? 1 : (prize.quantity || 0);
        return {
          premio: prizeName,
          cantidad: prizeQuantity,
          peso: prizeQuantity,
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

