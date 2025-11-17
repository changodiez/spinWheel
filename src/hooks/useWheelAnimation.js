import { useState, useRef, useCallback, useEffect } from 'react';
import { useSoundEffects } from './useSoundEffects';
import { selectWeightedWinner, calculateWinnerIndexFromAngle, calculateAngleForIndex } from '../utils/wheelCalculations';
import { CONFIG } from '../constants/config';

export const useWheelAnimation = (prizes) => {
  const [angle, setAngle] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  
  const animationRef = useRef();
  const forcedWinnerRef = useRef(null);
  const targetAngleRef = useRef(null); // Ángulo objetivo donde debe detenerse
  const lastTimeRef = useRef();
  const lastSliceRef = useRef(0);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  
  const { playTick, playWin, initializeAudio } = useSoundEffects();
  
  // Sincronizar refs con el estado
  useEffect(() => {
    angleRef.current = angle;
  }, [angle]);
  
  useEffect(() => {
    velocityRef.current = velocity;
  }, [velocity]);

  useEffect(() => {
    const handleFirstInteraction = () => {
      initializeAudio();
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };

    window.addEventListener('click', handleFirstInteraction);
    window.addEventListener('touchstart', handleFirstInteraction);

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
    };
  }, [initializeAudio]);

  const stopAnimation = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    lastTimeRef.current = null;
  }, []);

  // Función para calcular la velocidad inicial necesaria para detenerse en el ángulo objetivo
  const calculateOptimalVelocity = useCallback((angleToTravel) => {
    // Estimar rango inicial basado en la distancia
    // Para distancias largas, necesitamos velocidades más altas
    const estimatedMinVel = Math.max(CONFIG.PHYSICS.MIN_VELOCITY, angleToTravel * 0.3);
    const estimatedMaxVel = Math.min(CONFIG.PHYSICS.MAX_VELOCITY, angleToTravel * 0.8);
    
    let low = estimatedMinVel;
    let high = estimatedMaxVel;
    let bestVelocity = (low + high) / 2;
    let bestError = Infinity;
    
    // Búsqueda binaria con más iteraciones para mayor precisión
    for (let iter = 0; iter < 300; iter++) {
      const testVelocity = (low + high) / 2;
      
      // Simular la física EXACTAMENTE como en la animación real
      let simulatedAngle = 0;
      let simulatedVelocity = -testVelocity; // Velocidad NEGATIVA como en la animación
      let simTime = 0;
      
      // Simular con deltaTime promedio (16.67ms = 60fps) para simulación determinista
      const simDeltaTime = 0.01667; // Promedio de 60fps
      
      while (Math.abs(simulatedVelocity) > CONFIG.PHYSICS.STOP_THRESHOLD && simTime < 30) {
        // Usar deltaTime fijo pero representativo (promedio de 60fps)
        const delta = Math.min(simDeltaTime, 0.033);
        
        // EXACTAMENTE la misma física: newAngle = angle - velocity * deltaTime
        simulatedAngle = simulatedAngle - simulatedVelocity * delta;
        
        // EXACTAMENTE la misma fricción
        simulatedVelocity = simulatedVelocity * (1 - delta * CONFIG.PHYSICS.FRICTION);
        
        simTime += delta;
      }
      
      const error = Math.abs(simulatedAngle - angleToTravel);
      
      if (error < bestError) {
        bestError = error;
        bestVelocity = testVelocity;
      }
      
      // Búsqueda binaria
      if (simulatedAngle < angleToTravel) {
        low = testVelocity;
        // Si llegamos al límite y aún no alcanzamos, expandir el rango
        if (low >= high - 0.01 && high < CONFIG.PHYSICS.MAX_VELOCITY) {
          high = Math.min(CONFIG.PHYSICS.MAX_VELOCITY, high * 1.5);
        }
      } else {
        high = testVelocity;
        // Si llegamos al límite y nos pasamos, reducir el mínimo
        if (high <= low + 0.01 && low > CONFIG.PHYSICS.MIN_VELOCITY) {
          low = Math.max(CONFIG.PHYSICS.MIN_VELOCITY, low * 0.8);
        }
      }
      
      // Tolerancia muy estricta
      if (error < 0.0005) break;
    }
    
    console.log('🔧 Velocidad óptima calculada:', {
      velocidad: bestVelocity.toFixed(4),
      error: bestError.toFixed(4),
      distanciaObjetivo: angleToTravel.toFixed(4),
      errorPorcentual: ((bestError / angleToTravel) * 100).toFixed(2) + '%',
      rangoUsado: `[${estimatedMinVel.toFixed(2)}, ${estimatedMaxVel.toFixed(2)}]`
    });
    
    return Math.max(CONFIG.PHYSICS.MIN_VELOCITY, Math.min(CONFIG.PHYSICS.MAX_VELOCITY, bestVelocity));
  }, []);

  const animate = useCallback((time) => {
    if (!spinning) {
      stopAnimation();
      return;
    }

    if (!lastTimeRef.current) {
      lastTimeRef.current = time;
      if (prizes.length > 0) {
        const sliceAngle = (Math.PI * 2) / prizes.length;
        const normalizedAngle = ((angleRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const pointerAngle = Math.PI * 1.5; // 3π/2
        const relativeAngle = ((pointerAngle - normalizedAngle) + Math.PI * 2) % (Math.PI * 2);
        lastSliceRef.current = Math.floor(relativeAngle / sliceAngle) % prizes.length;
      }
      animationRef.current = requestAnimationFrame(animate);
      return;
    }

    const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.033);
    lastTimeRef.current = time;
    
    // Física simple: desaceleración constante
    // Usar refs para obtener los valores más actuales
    let currentAngle = angleRef.current;
    let currentVelocity = velocityRef.current;
    
    let newAngle = currentAngle - currentVelocity * deltaTime;
    let newVelocity = currentVelocity * (1 - deltaTime * CONFIG.PHYSICS.FRICTION);
    
    // NO aplicar magnetización - dejar que la física natural determine el resultado
    
    // Actualizar refs inmediatamente
    angleRef.current = newAngle;
    velocityRef.current = newVelocity;

    // Detectar cambios de segmento para el sonido
    if (prizes.length > 0) {
      const sliceAngle = (Math.PI * 2) / prizes.length;
      const normalizedAngle = ((newAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const pointerAngle = Math.PI * 1.5;
      const relativeAngle = ((pointerAngle - normalizedAngle) + Math.PI * 2) % (Math.PI * 2);
      const currentSlice = Math.floor(relativeAngle / sliceAngle) % prizes.length;
      
      if (currentSlice !== lastSliceRef.current) {
        playTick();
        lastSliceRef.current = currentSlice;
      }
    }

    setAngle(newAngle);
    setVelocity(newVelocity);

    // Al detenerse: SIEMPRE mostrar el premio visual (el que está bajo el puntero)
    if (Math.abs(newVelocity) < CONFIG.PHYSICS.STOP_THRESHOLD) {
      setSpinning(false);
      
      // Calcular el premio que está visualmente bajo el puntero
      const visualWinnerIndex = calculateWinnerIndexFromAngle(newAngle, prizes);
      const expectedWinnerIndex = forcedWinnerRef.current;
      const targetAngle = targetAngleRef.current;
      
      // SIEMPRE usar el premio visual (el que realmente tocó)
      const finalIndex = visualWinnerIndex;
      
      const winnerPrize = prizes[finalIndex];
      const winnerPrizeName = typeof winnerPrize === 'string' ? winnerPrize : winnerPrize.name;
      
      // Log detallado para depuración
      if (expectedWinnerIndex !== null && expectedWinnerIndex !== undefined && targetAngle !== null) {
        const expectedPrize = prizes[expectedWinnerIndex];
        const expectedPrizeName = typeof expectedPrize === 'string' ? expectedPrize : expectedPrize.name;
        
        // Calcular diferencia angular
        let angleDiff = targetAngle - newAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        if (finalIndex === expectedWinnerIndex) {
          console.log('✅ Premio visual coincide con el predeterminado:', winnerPrizeName);
        } else {
          console.warn('⚠️ Premio visual difiere del predeterminado:', {
            esperado: expectedPrizeName,
            visual: winnerPrizeName,
            anguloObjetivo: targetAngle.toFixed(3),
            anguloFinal: newAngle.toFixed(3),
            diferenciaAngular: angleDiff.toFixed(3),
            'mostrando': 'visual (el que realmente tocó)'
          });
        }
      }
      
      console.log('🎯 Premio ganador (visual):', winnerPrizeName, 'índice:', finalIndex);
      
      const winnerData = {
        prize: winnerPrizeName,
        index: finalIndex,
        prizeObject: winnerPrize
      };
      
      setWinner(winnerData);
      forcedWinnerRef.current = null;
      targetAngleRef.current = null;
      
      setTimeout(() => {
        playWin();
      }, 300);
      
      stopAnimation();
      return;
    }
    
    animationRef.current = requestAnimationFrame(animate);
  }, [spinning, prizes, playTick, playWin, stopAnimation, calculateWinnerIndexFromAngle]);

  useEffect(() => {
    if (!spinning) {
      stopAnimation();
      return;
    }

    animationRef.current = requestAnimationFrame(animate);
    
    return stopAnimation;
  }, [spinning, animate, stopAnimation]);

  const startSpin = useCallback(() => {
    if (spinning || prizes.length === 0) return;

    initializeAudio();
    stopAnimation();

    // 1. ELEGIR PREMIO con probabilidad ponderada (PeraWallet tiene menos peso)
    const canSelectPeraWallet = () => true; // Por ahora siempre true, se puede agregar lógica de límites después
    const targetIndex = selectWeightedWinner(prizes, canSelectPeraWallet, true);
    forcedWinnerRef.current = targetIndex;
    
    const winnerPrize = prizes[targetIndex];
    const winnerPrizeName = typeof winnerPrize === 'string' ? winnerPrize : winnerPrize.name;
    console.log('🎯 Premio elegido (probabilidad ponderada):', winnerPrizeName, 'índice:', targetIndex);

    // 2. CALCULAR ÁNGULO OBJETIVO: dentro del segmento del premio elegido (con variación natural)
    const N = prizes.length;
    const segmentAngle = (2 * Math.PI) / N;
    
    // Ángulo del centro del segmento objetivo (en coordenadas de la rueda)
    // El segmento targetIndex va de targetIndex * segmentAngle a (targetIndex + 1) * segmentAngle
    const segmentStart = targetIndex * segmentAngle;
    const segmentEnd = (targetIndex + 1) * segmentAngle;
    const segmentCenter = segmentStart + segmentAngle / 2;
    
    // Agregar variación aleatoria dentro del segmento para que se vea más natural
    // Usar 60% del ancho del segmento como rango de variación (dejando 20% de margen en cada lado)
    const variationRange = segmentAngle * 0.6; // 60% del segmento
    const randomOffset = (Math.random() - 0.5) * variationRange; // Entre -30% y +30% del segmento
    const targetSegmentCenter = segmentCenter + randomOffset;
    
    // Convertir a ángulo de la rueda (donde el puntero apunta hacia abajo)
    // El puntero está en Math.PI * 1.5 (270 grados / abajo)
    // Para que el punto del segmento quede bajo el puntero, la rueda debe estar rotada así:
    const baseTargetAngle = Math.PI * 1.5 - targetSegmentCenter;
    
    // Normalizar al rango [0, 2π]
    let normalizedBaseTarget = ((baseTargetAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    
    // 3. AGREGAR VUELTAS EXTRAS para que se vea bonito
    const vueltasExtras = 3 + Math.floor(Math.random() * 2); // 3 o 4 vueltas
    
    // 4. CALCULAR GIRO RELATIVO desde el ángulo actual
    // Queremos ir desde angle hasta normalizedBaseTarget + vueltasExtras * 2π
    const currentAngleNormalized = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    
    // Calcular la diferencia angular más corta hacia el objetivo
    let angleDiff = normalizedBaseTarget - currentAngleNormalized;
    while (angleDiff < 0) angleDiff += Math.PI * 2;
    
    // Agregar las vueltas extras
    const angleToTravel = vueltasExtras * (Math.PI * 2) + angleDiff;
    
    // El ángulo final objetivo
    const targetAngle = angle + angleToTravel;
    targetAngleRef.current = targetAngle;
    
    console.log('🔧 Cálculo de giro:', {
      anguloActual: currentAngleNormalized.toFixed(3),
      anguloObjetivoBase: normalizedBaseTarget.toFixed(3),
      diferencia: angleDiff.toFixed(3),
      vueltasExtras: vueltasExtras,
      distanciaTotal: angleToTravel.toFixed(3)
    });

    // 5. CALCULAR VELOCIDAD INICIAL para recorrer esa distancia
    setWinner(null);
    
    // Calcular velocidad inicial óptima usando simulación física
    const optimalVelocity = calculateOptimalVelocity(angleToTravel);
    const initialVelocity = -optimalVelocity; // Negativo para giro horario
    
    console.log('🔧 Velocidad calculada:', {
      velocidad: optimalVelocity.toFixed(3),
      distanciaAngular: angleToTravel.toFixed(3)
    });
    
    // Actualizar refs inmediatamente
    velocityRef.current = initialVelocity;
    angleRef.current = angle;
    
    // Inicializar el seguimiento de segmentos
    if (prizes.length > 0) {
      const sliceAngle = (Math.PI * 2) / prizes.length;
      const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const pointerAngle = Math.PI * 1.5;
      const relativeAngle = ((pointerAngle - normalizedAngle) + Math.PI * 2) % (Math.PI * 2);
      lastSliceRef.current = Math.floor(relativeAngle / sliceAngle) % prizes.length;
    } else {
      lastSliceRef.current = 0;
    }
    
    // Actualizar estado (esto disparará el useEffect que inicia la animación)
    setVelocity(initialVelocity);
    setSpinning(true);
    lastTimeRef.current = null;
  }, [spinning, angle, prizes, initializeAudio, stopAnimation, animate, calculateAngleForIndex, calculateOptimalVelocity]);

  return { 
    angle, 
    velocity,
    spinning, 
    winner, 
    startSpin 
  };
};