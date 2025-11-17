// Script de simulación de 1000 tiros
// Ejecutar en la consola del navegador después de cargar la app

const DEFAULT_PRIZES = [
  "Tote", "Sticker", "Cool Cap", "Tattoo", "Socks", "T-Shirt", "Mug", "Label", "PeraWallet", "Pin", "Lanyard"
];

const PRIZE_WEIGHTS = {
  'PeraWallet': 0.4, // PeraWallet tiene 40% de probabilidad comparado con otros premios
};

function calculateProbabilities(prizes, canSelectPeraWalletFn = null) {
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
    return PRIZE_WEIGHTS[prizeName] || 1.0;
  });
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  return {
    probabilities: weights.map(w => w / totalWeight),
    prizes: availablePrizes
  };
}

function selectWeightedWinner(prizes, canSelectPeraWalletFn = null) {
  if (prizes.length === 0) return 0;
  
  const { probabilities, prizes: availablePrizes } = calculateProbabilities(prizes, canSelectPeraWalletFn);
  
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
    
    for (let i = 0; i < prizes.length; i++) {
      const prizeName = typeof prizes[i] === 'string' ? prizes[i] : prizes[i].name;
      if (prizeName === selectedPrizeName) {
        selectedIndex = i;
        break;
      }
    }
  }
  
  return selectedIndex;
}

// Función de simulación
function simulateSpins(numSpins = 1000) {
  const prizes = DEFAULT_PRIZES;
  const canSelectPeraWallet = () => true; // Siempre permitir PeraWallet en la simulación
  
  // Calcular probabilidades teóricas
  const { probabilities, prizes: availablePrizes } = calculateProbabilities(prizes, canSelectPeraWallet);
  const theoreticalProbs = {};
  
  for (let i = 0; i < availablePrizes.length; i++) {
    const prize = availablePrizes[i];
    const prizeName = typeof prize === 'string' ? prize : prize.name;
    theoreticalProbs[prizeName] = probabilities[i];
  }
  
  // Contador de resultados
  const counts = {};
  prizes.forEach(prize => {
    counts[prize] = 0;
  });
  
  // Ejecutar simulaciones
  console.log(`🎲 Simulando ${numSpins} tiros...`);
  const startTime = performance.now();
  
  for (let i = 0; i < numSpins; i++) {
    const winnerIndex = selectWeightedWinner(prizes, canSelectPeraWallet);
    const winnerPrize = prizes[winnerIndex];
    counts[winnerPrize]++;
  }
  
  const endTime = performance.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Mostrar resultados
  console.log(`\n✅ Simulación completada en ${duration}s\n`);
  console.log('📊 RESULTADOS DE LA SIMULACIÓN:');
  console.log('═'.repeat(80));
  console.log(`${'Premio'.padEnd(20)} | ${'Teórico'.padEnd(12)} | ${'Simulado'.padEnd(12)} | ${'Diferencia'.padEnd(12)} | ${'% Real'.padEnd(10)}`);
  console.log('─'.repeat(80));
  
  const totalWeight = prizes.reduce((sum, prize) => {
    const weight = PRIZE_WEIGHTS[prize] || 1.0;
    return sum + weight;
  }, 0);
  
  prizes.forEach(prize => {
    const weight = PRIZE_WEIGHTS[prize] || 1.0;
    const theoreticalProb = weight / totalWeight;
    const theoreticalCount = theoreticalProb * numSpins;
    const actualCount = counts[prize];
    const actualPercent = (actualCount / numSpins * 100).toFixed(2);
    const theoreticalPercent = (theoreticalProb * 100).toFixed(2);
    const difference = actualCount - theoreticalCount;
    const diffPercent = (difference / theoreticalCount * 100).toFixed(2);
    
    console.log(
      `${prize.padEnd(20)} | ${theoreticalPercent.padStart(6)}% (${Math.round(theoreticalCount).toString().padStart(4)}) | ${actualCount.toString().padStart(4)} (${actualPercent.padStart(6)}%) | ${difference >= 0 ? '+' : ''}${difference.toFixed(0).padStart(4)} (${diffPercent.padStart(6)}%) | ${actualPercent.padStart(6)}%`
    );
  });
  
  console.log('═'.repeat(80));
  console.log(`\n📈 Estadísticas:`);
  console.log(`   Total de tiros: ${numSpins}`);
  console.log(`   PeraWallet: ${counts['PeraWallet']} veces (${(counts['PeraWallet'] / numSpins * 100).toFixed(2)}%)`);
  console.log(`   Otros premios promedio: ${((numSpins - counts['PeraWallet']) / (prizes.length - 1)).toFixed(1)} veces por premio`);
  
  return counts;
}

// Exportar para uso en consola
if (typeof window !== 'undefined') {
  window.simulateSpins = simulateSpins;
  console.log('✅ Script de simulación cargado. Ejecuta: simulateSpins(1000)');
}

// Si se ejecuta con Node.js
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { simulateSpins, selectWeightedWinner, calculateProbabilities };
}

