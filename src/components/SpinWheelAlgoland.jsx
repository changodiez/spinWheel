import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useWheelAnimation } from '../hooks/useWheelAnimation';
import WheelCanvas from './WheelCanvas';
import FlickerPointer from './FlickerPointer';
import WinnerPopup from './WinnerPopup';
import ReferenceOverlay from './ReferenceOverlay';
import ReferenceIMG from '../assets/img/layout2.jpg';
import backgroundVideo from '../assets/background/Spin_Video_BG.mp4';
import headerImg from '../assets/img/header.png';
import buttonImg from '../assets/img/EXPORT EFECTOS/Boton.png';
import { selectWeightedWinner } from '../utils/wheelCalculations';
import './SpinWheelAlgoland.css';

// Mapeo de nombres de premios a textos de ganador
const PRIZE_WIN_TEXTS = {
  "Label": "You win a cool Tag",
  "Mug": "You win a power Mug",
  "Tote": "You win a shiny Tote bag",
  "T-Shirt": "You win an epic T-shirt",
  "Pin": "You win a funky Pin",
  "Sticker": "You win a sticky Sticker",
  "Cool Cap": "You win a cool Cap",
  "Lanyard": "You win a cozy Lanyard",
  "Tattoo": "You win a wild Tattoo",
  "Socks": "You win magic Socks",
  "PeraWallet": "You win a Spin in Pera"
};

// Premios fijos para GitHub Pages (formato objeto para compatibilidad)
const DEFAULT_PRIZES = [
  { name: "PeraWallet", quantity: 10, winText: "You win a Spin in Pera" },
  { name: "Tote", quantity: 10, winText: "You win a shiny Tote bag" },
  { name: "Sticker", quantity: 10, winText: "You win a sticky Sticker" },
  { name: "Cool Cap", quantity: 10, winText: "You win a cool Cap" },
  { name: "Tattoo", quantity: 10, winText: "You win a wild Tattoo" },
  { name: "T-Shirt", quantity: 10, winText: "You win an epic T-shirt" },
  { name: "Socks", quantity: 10, winText: "You win magic Socks" },
  { name: "Mug", quantity: 10, winText: "You win a power Mug" },
  { name: "Label", quantity: 10, winText: "You win a cool Tag" },
  { name: "Pin", quantity: 10, winText: "You win a funky Pin" },
  { name: "Lanyard", quantity: 10, winText: "You win a cozy Lanyard" }
];

const SpinWheelAlgoland = () => {
  const [wheelSize, setWheelSize] = useState(700); // tamaño base, se ajusta a viewport
  const [showWinner, setShowWinner] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [decrementPaused, setDecrementPaused] = useState(false);
  const wsRef = useRef(null);
  
  // Normalizar premios (todos permanecen visibles, incluso con cantidad 0)
  // El peso está vinculado a la cantidad, por lo que premios con cantidad 0 no pueden ser seleccionados
  const availablePrizes = useMemo(() => {
    return prizes
      .map(prize => {
        // Normalizar a formato objeto
        if (typeof prize === 'string') {
          return { 
            name: prize, 
            quantity: 1, // En modo demo, asumir cantidad 1
            winText: PRIZE_WIN_TEXTS[prize] || prize
          };
        }
        const prizeName = prize.name || prize;
        return {
          name: prizeName,
          quantity: typeof prize.quantity === 'number' ? prize.quantity : 0,
          winText: prize.winText || PRIZE_WIN_TEXTS[prizeName] || prizeName
        };
      });
      // Ya no filtramos premios con cantidad 0 - todos permanecen visibles
      // Si cantidad = 0, el peso será 0 y no podrán ser seleccionados
  }, [prizes]);
  
  const { angle, velocity, spinning, winner, startSpin } = useWheelAnimation(availablePrizes);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        setCursorVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      // Si el popup está visible, permitir que se cierre (el popup maneja su propio cierre)
      // pero NO iniciar un nuevo spin
      if (showWinner) {
        // El popup tiene su propio handler de cierre, solo necesitamos evitar iniciar un spin
        return;
      }
      
      // No hacer nada si se hace click en el popup
      if (e.target.closest('.winner-popup-overlay')) {
        return;
      }
      
      // Permitir girar solo si no está girando y hay premios disponibles
      if (!spinning && availablePrizes.length > 0) {
        startSpin();
      }
    };

    document.addEventListener('click', handleGlobalClick);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [spinning, prizes.length, startSpin, showWinner]); 

  useEffect(() => {
    const isGitHubPages = window.location.hostname.includes('github.io');
    setIsDemoMode(isGitHubPages);
    
    if (isGitHubPages) {
      setConnectionStatus('Modo Demo - Premios Fijos');
      setPrizes(DEFAULT_PRIZES);
    } else {
      setConnectionStatus('Conectando al servidor...');
      connectToWebSocket();
    }
  }, []);

  const connectToWebSocket = () => {
    const ws = new WebSocket('ws://localhost:3000');
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('Conectado al servidor WebSocket');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'prizes_update':
            // Normalizar premios que vienen del servidor
            const normalizedPrizes = data.prizes.map(p => {
              if (typeof p === 'string') {
                return { 
                  name: p, 
                  quantity: 0,
                  winText: PRIZE_WIN_TEXTS[p] || p
                };
              }
              const prizeName = p.name || p;
              return {
                name: prizeName,
                quantity: typeof p.quantity === 'number' ? p.quantity : 0,
                winText: p.winText || PRIZE_WIN_TEXTS[prizeName] || prizeName
              };
            });
            setPrizes(normalizedPrizes);
            console.log('📦 Premios actualizados:', normalizedPrizes);
            break;
            
          case 'spin_wheel':
            if (!spinning && availablePrizes.length > 0) {
              startSpin();
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      if (!isDemoMode) {
        setPrizes(DEFAULT_PRIZES);
      }
    };
    
    ws.onerror = (error) => {
      if (!isDemoMode) {
        setPrizes(DEFAULT_PRIZES);
      }
    };
  };
  
  // Listener para la tecla "r" para pausar/reanudar el decremento
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'r' || e.key === 'R') {
        setDecrementPaused(prev => {
          const newState = !prev;
          console.log(newState ? '⏸️ Se detiene el decremento de los ítems.' : '▶️ Decremento reanudado');
          return newState;
        });
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Decrementar cantidad cuando se gana un premio (solo si no está pausado)
  useEffect(() => {
    if (!winner || isDemoMode || decrementPaused) return;
    
    const winnerPrizeName = typeof winner.prize === 'string' ? winner.prize : winner.prize;
    
    // Enviar mensaje al servidor para decrementar
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'decrement_prize',
        prizeName: winnerPrizeName
      }));
      console.log('📤 Decrementando premio:', winnerPrizeName);
    } else {
      // En modo demo, decrementar localmente
      setPrizes(prevPrizes => {
        return prevPrizes.map(prize => {
          const prizeName = typeof prize === 'string' ? prize : prize.name;
          if (prizeName === winnerPrizeName) {
            const currentQuantity = typeof prize === 'string' ? 1 : (prize.quantity || 0);
            return {
              name: prizeName,
              quantity: Math.max(0, currentQuantity - 1)
            };
          }
          return prize;
        });
      });
    }
  }, [winner, isDemoMode, decrementPaused]);

  useEffect(() => {
    const computeWheelSize = () => {
      const minSide = Math.min(window.innerWidth, window.innerHeight);
      const target = Math.floor(minSide * 0.902); // 0.82 * 1.1 = 0.902 (10% más grande)
      const clamped = Math.max(616, Math.min(target, 1056)); // 560*1.1=616, 960*1.1=1056
      setWheelSize(clamped);
    };
    computeWheelSize();
    window.addEventListener('resize', computeWheelSize);
    window.addEventListener('orientationchange', computeWheelSize);
    return () => {
      window.removeEventListener('resize', computeWheelSize);
      window.removeEventListener('orientationchange', computeWheelSize);
    };
  }, []);

  useEffect(() => {
    if (spinning) {
      setAnnouncement('La rueda está girando');
      const timer = setTimeout(() => setAnnouncement(''), 100);
      return () => clearTimeout(timer);
    } else if (winner) {
      setAnnouncement(`Has ganado: ${winner.prize}`);
    } else {
      setAnnouncement('Listo para girar la ruleta');
    }
  }, [spinning, winner]);

  useEffect(() => {
    if (winner) {
      setShowWinner(true);
    }
  }, [winner]);

  // Exponer función de simulación en window para uso desde consola
  useEffect(() => {
    const simulateSpins = (numSpins = 1000) => {
      const canSelectPeraWallet = () => true;
      
      // Contador de resultados
      const counts = {};
      DEFAULT_PRIZES.forEach(prize => {
        const prizeName = typeof prize === 'string' ? prize : prize.name;
        counts[prizeName] = 0;
      });
      
      console.log(`🎲 Simulando ${numSpins} tiros...`);
      const startTime = performance.now();
      
      for (let i = 0; i < numSpins; i++) {
        const winnerIndex = selectWeightedWinner(DEFAULT_PRIZES, canSelectPeraWallet, false);
        const winnerPrize = DEFAULT_PRIZES[winnerIndex];
        const winnerPrizeName = typeof winnerPrize === 'string' ? winnerPrize : winnerPrize.name;
        counts[winnerPrizeName]++;
      }
      
      const endTime = performance.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      
      // Calcular probabilidades teóricas usando la cantidad como peso
      const totalWeight = DEFAULT_PRIZES.reduce((sum, prize) => {
        const prizeName = typeof prize === 'string' ? prize : prize.name;
        const prizeQuantity = typeof prize === 'string' ? 1 : (prize.quantity || 0);
        // Si es PeraWallet y tiene cantidad 0, peso = 0
        if (prizeName === 'PeraWallet' && prizeQuantity === 0) {
          return sum;
        }
        return sum + prizeQuantity;
      }, 0);
      
      // Mostrar resultados
      console.log(`\n✅ Simulación completada en ${duration}s\n`);
      console.log('📊 RESULTADOS DE LA SIMULACIÓN:');
      console.log('═'.repeat(90));
      console.log(`${'Premio'.padEnd(20)} | ${'Cantidad'.padEnd(10)} | ${'Teórico %'.padEnd(12)} | ${'Teórico #'.padEnd(12)} | ${'Simulado #'.padEnd(12)} | ${'Real %'.padEnd(10)} | ${'Diferencia'.padEnd(12)}`);
      console.log('─'.repeat(90));
      
      DEFAULT_PRIZES.forEach(prize => {
        const prizeName = typeof prize === 'string' ? prize : prize.name;
        const prizeQuantity = typeof prize === 'string' ? 1 : (prize.quantity || 0);
        // El peso es igual a la cantidad (0 si es PeraWallet con cantidad 0)
        const weight = (prizeName === 'PeraWallet' && prizeQuantity === 0) ? 0 : prizeQuantity;
        const theoreticalProb = totalWeight > 0 ? weight / totalWeight : 0;
        const theoreticalCount = theoreticalProb * numSpins;
        const actualCount = counts[prizeName] || 0;
        const actualPercent = (actualCount / numSpins * 100).toFixed(2);
        const theoreticalPercent = (theoreticalProb * 100).toFixed(2);
        const difference = actualCount - theoreticalCount;
        const diffPercent = theoreticalCount > 0 ? (difference / theoreticalCount * 100).toFixed(2) : '0.00';
        
        console.log(
          `${prizeName.padEnd(20)} | ${prizeQuantity.toString().padStart(8)} | ${theoreticalPercent.padStart(6)}% | ${Math.round(theoreticalCount).toString().padStart(4)} | ${actualCount.toString().padStart(4)} | ${actualPercent.padStart(6)}% | ${difference >= 0 ? '+' : ''}${difference.toFixed(0).padStart(4)} (${diffPercent.padStart(6)}%)`
        );
      });
      
      console.log('═'.repeat(90));
      console.log(`\n📈 Estadísticas:`);
      console.log(`   Total de tiros: ${numSpins}`);
      const peraWalletCount = counts['PeraWallet'] || 0;
      console.log(`   PeraWallet: ${peraWalletCount} veces (${(peraWalletCount / numSpins * 100).toFixed(2)}%)`);
      const otherPrizesCount = numSpins - peraWalletCount;
      const otherPrizesAvg = otherPrizesCount / (DEFAULT_PRIZES.length - 1);
      console.log(`   Otros premios promedio: ${otherPrizesAvg.toFixed(1)} veces por premio`);
      if (peraWalletCount > 0) {
        console.log(`   Ratio PeraWallet vs Otros: 1:${(otherPrizesAvg / peraWalletCount).toFixed(2)}`);
      }
      
      return counts;
    };
    
    window.simulateSpins = simulateSpins;
    console.log('✅ Función de simulación disponible. Ejecuta: simulateSpins(1000)');
    
    return () => {
      delete window.simulateSpins;
    };
  }, []);

  const handleSpin = useCallback(() => {
    startSpin();
  }, [startSpin]);

  const handleCloseWinner = useCallback(() => {
    setShowWinner(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (spinning) return;
    e.preventDefault();
    handleSpin();
  }, [spinning, handleSpin]);

  return (
    <div
      className={`spin-wheel-stage ${!cursorVisible ? 'no-cursor' : ''}`}
      style={{ cursor: cursorVisible ? 'default' : 'none' }}
    >
      <video
        className="bg-video"
        src={backgroundVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="bg-overlay"></div>

      <div className="spin-wheel-container">
        <div
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement}
        </div>

        <div className="header">
          <h1 className="title-main">
          <img src={headerImg} alt="Header" className="header-img" />
          </h1>
        </div>

        {decrementPaused && (
          <div className="decrement-pause-indicator">
            <span className="pause-icon">⏸️</span>
            <span className="pause-text">Decremento pausado (Presiona R para reanudar)</span>
          </div>
        )}

        <div className={`wheel-container ${showWinner ? 'hidden' : ''}`}>
          <WheelCanvas
            key={availablePrizes.length} // Forzar re-render cuando cambian los premios disponibles
            angle={angle}
            prizes={availablePrizes}
            winnerIndex={winner?.index}
            size={wheelSize}
          />

          <FlickerPointer
            angle={angle}
            prizes={availablePrizes}
            wheelSize={wheelSize}
            velocity={velocity}
          />
        </div>

        <div
          className={`spin-button tv-button ${spinning ? 'spinning' : ''}`}
        >
          <img 
            src={buttonImg} 
            alt="" 
            className="button-bg-image"
            aria-hidden="true"
          />
          <span className="button-text">
            {spinning ? 'SPINNING…' : 'SPIN NOW'}
          </span>
        </div>

        <WinnerPopup
          winner={showWinner ? winner : null}
          onClose={handleCloseWinner}
          autoCloseTime={isDemoMode ? 8000 : 15000}
        />
      </div>
      
      {/* Overlay de referencia - Presiona 'B' para activar/desactivar */}
      <ReferenceOverlay imagePath={ReferenceIMG} />
    </div>
  );
};

export default SpinWheelAlgoland;