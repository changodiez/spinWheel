import { useState, useRef, useCallback, useEffect } from 'react';
import { useSoundEffects } from './useSoundEffects';
import { selectWeightedWinner, calculateAngleForIndex, calculateWinnerIndexFromAngle } from '../utils/wheelCalculations';
import { CONFIG } from '../constants/config';

export const useWheelAnimation = (prizes) => {
  const [angle, setAngle] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  
  const requestRef = useRef();
  const lastTimeRef = useRef();
  const lastTickAngleRef = useRef(0);
  const lastSliceRef = useRef(0);
  const targetWinnerIndexRef = useRef(null); // Índice del ganador predeterminado antes del giro
  const targetAngleRef = useRef(null); // Ángulo objetivo donde debe detenerse la rueda
  
  const { playTick, playWin, initializeAudio } = useSoundEffects();

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
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    lastTimeRef.current = null;
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
        const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const pointerAngle = Math.PI * 1.5; // 3π/2
        const relativeAngle = ((pointerAngle - normalizedAngle) + Math.PI * 2) % (Math.PI * 2);
        lastSliceRef.current = Math.floor(relativeAngle / sliceAngle) % prizes.length;
      }
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.033);
    lastTimeRef.current = time;
    
    let newAngle = angle - velocity * deltaTime;
    let newVelocity = velocity * (1 - deltaTime * CONFIG.PHYSICS.FRICTION);
    
    // Aplicar magnetización progresiva hacia el objetivo cuando la velocidad es baja
    // La fuerza aumenta cuando la velocidad disminuye, haciendo que sea más efectiva
    if (targetAngleRef.current !== null && prizes.length > 0) {
      const targetAngle = targetAngleRef.current;
      const absVelocity = Math.abs(newVelocity);
      
      // Calcular diferencia angular (normalizada)
      let angleDiff = targetAngle - newAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      
      const absAngleDiff = Math.abs(angleDiff);
      const sliceAngle = (Math.PI * 2) / prizes.length;
      
      // Aplicar magnetización cuando la velocidad es baja
      // La fuerza aumenta progresivamente cuando la velocidad disminuye
      if (absVelocity < 5.0) {
        // Factor de lentitud: más lento = más fuerza (0 a 1)
        const slownessFactor = Math.max(0, 1 - (absVelocity / 5.0));
        
        // Factor de proximidad: más cerca = más fuerza (dentro de 1.5 segmentos)
        const maxProximity = sliceAngle * 1.5;
        const proximityFactor = absAngleDiff < maxProximity 
          ? Math.max(0, 1 - (absAngleDiff / maxProximity))
          : 0;
        
        // Fuerza de atracción que aumenta cuando está más lento y más cerca
        // Máxima fuerza cuando velocidad < 1.0 y está muy cerca
        const attractionStrength = 0.4 * slownessFactor * proximityFactor;
        
        if (attractionStrength > 0.01) {
          const direction = -Math.sign(angleDiff);
          // La fuerza es proporcional a la distancia, pero limitada
          const maxForce = 0.3;
          const attractionForce = direction * Math.min(absAngleDiff * 1.5, maxForce) * attractionStrength;
          
          newVelocity = newVelocity + attractionForce;
        }
      }
    }

    if (prizes.length > 0) {
      const sliceAngle = (Math.PI * 2) / prizes.length;
      const normalizedAngle = ((newAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const pointerAngle = Math.PI * 1.5;
      const relativeAngle = ((pointerAngle - normalizedAngle) + Math.PI * 2) % (Math.PI * 2);
      const currentSlice = Math.floor(relativeAngle / sliceAngle) % prizes.length;
      
      if (currentSlice !== lastSliceRef.current) {
        playTick(Math.abs(velocity));
        lastSliceRef.current = currentSlice;
      }
    }

    setAngle(newAngle);
    setVelocity(newVelocity);

    if (Math.abs(newVelocity) < CONFIG.PHYSICS.STOP_THRESHOLD) {
      setSpinning(false);
      
      // Calcular el premio que está visualmente bajo el puntero
      let finalIndex = calculateWinnerIndexFromAngle(newAngle, prizes);
      let finalAngle = newAngle;
      
      // Verificar si coincide con el predeterminado
      const expectedIndex = targetWinnerIndexRef.current;
      const targetAngle = targetAngleRef.current;
      
      if (expectedIndex !== null && expectedIndex !== undefined && targetAngle !== null) {
        // Si no coincide, verificar si podemos hacer un ajuste muy sutil
        if (finalIndex !== expectedIndex && prizes.length > 0) {
          const sliceAngle = (Math.PI * 2) / prizes.length;
          
          // Calcular la diferencia angular normalizada
          let angleDiff = targetAngle - newAngle;
          while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
          while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
          
          // Solo ajustar si la diferencia es pequeña (menos de medio segmento)
          // Esto significa que estamos muy cerca del objetivo
          if (Math.abs(angleDiff) < sliceAngle * 0.5) {
            // Ajuste muy sutil: mover hacia el ángulo objetivo
            // Pero solo si estamos muy cerca (dentro de 0.1 radianes)
            if (Math.abs(angleDiff) < 0.1) {
              finalAngle = targetAngle;
              finalIndex = expectedIndex;
              setAngle(finalAngle);
              console.log('🔧 Ajuste sutil aplicado para coincidir con el premio predeterminado');
            }
          }
        }
      }
      
      const winnerPrize = prizes[finalIndex];
      const winnerPrizeName = typeof winnerPrize === 'string' ? winnerPrize : winnerPrize.name;
      
      // Log para depuración
      if (expectedIndex !== null && expectedIndex !== undefined) {
        const expectedPrize = prizes[expectedIndex];
        const expectedPrizeName = typeof expectedPrize === 'string' ? expectedPrize : expectedPrize.name;
        
        if (finalIndex === expectedIndex) {
          console.log('✅ Premio coincide con el predeterminado:', winnerPrizeName);
        } else {
          console.warn('⚠️ Premio visual difiere del predeterminado:', {
            esperado: expectedPrizeName,
            visual: winnerPrizeName,
            diferenciaAngular: ((targetAngle || 0) - finalAngle).toFixed(3)
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
      
      // Resetear referencias
      targetWinnerIndexRef.current = null;
      targetAngleRef.current = null;
      
      setTimeout(() => {
        playWin();
      }, 300);
      
      stopAnimation();
      return;
    }
    
    requestRef.current = requestAnimationFrame(animate);
  }, [spinning, angle, velocity, prizes, playTick, playWin, stopAnimation, calculateWinnerIndexFromAngle]);

  useEffect(() => {
    if (!spinning) {
      stopAnimation();
      return;
    }

    requestRef.current = requestAnimationFrame(animate);
    
    return stopAnimation;
  }, [spinning, animate, stopAnimation]);

  // Función auxiliar para calcular velocidad óptima con mayor precisión
  const calculateOptimalVelocity = useCallback((angleToTravel) => {
    const simDeltaTime = 0.016; // ~60fps
    let low = CONFIG.PHYSICS.MIN_VELOCITY;
    let high = CONFIG.PHYSICS.MAX_VELOCITY;
    let bestVelocity = (low + high) / 2;
    let bestError = Infinity;
    
    // Aumentar iteraciones para mayor precisión
    for (let iter = 0; iter < 50; iter++) {
      const testVelocity = (low + high) / 2;
      
      // Simular desaceleración usando EXACTAMENTE la misma física que la animación real
      let simulatedAngle = 0;
      let simulatedVelocity = testVelocity;
      let simTime = 0;
      let lastSimTime = 0;
      
      while (Math.abs(simulatedVelocity) > CONFIG.PHYSICS.STOP_THRESHOLD && simTime < 20) {
        // Usar el mismo deltaTime limitado que la animación real
        const delta = Math.min((simTime - lastSimTime) || simDeltaTime, 0.033);
        lastSimTime = simTime;
        
        // Actualizar ángulo (igual que en la animación: angle - velocity * deltaTime)
        simulatedAngle += simulatedVelocity * delta;
        
        // Aplicar fricción (igual que en la animación)
        simulatedVelocity *= (1 - delta * CONFIG.PHYSICS.FRICTION);
        
        simTime += delta;
      }
      
      const error = Math.abs(simulatedAngle - angleToTravel);
      
      if (error < bestError) {
        bestError = error;
        bestVelocity = testVelocity;
      }
      
      if (simulatedAngle < angleToTravel) {
        low = testVelocity;
      } else {
        high = testVelocity;
      }
      
      // Parar si el error es muy pequeño
      if (error < 0.005) break;
    }
    
    console.log('🔧 Velocidad calculada:', {
      velocidad: bestVelocity.toFixed(3),
      error: bestError.toFixed(3),
      distanciaObjetivo: angleToTravel.toFixed(3)
    });
    
    return Math.max(CONFIG.PHYSICS.MIN_VELOCITY, Math.min(CONFIG.PHYSICS.MAX_VELOCITY, bestVelocity));
  }, []);

  const startSpin = useCallback(() => {
    if (spinning || prizes.length === 0) return;
    
    initializeAudio();
    stopAnimation();
    
    // Determinar el ganador ANTES del giro usando probabilidades ponderadas
    // Por ahora, canSelectPeraWallet siempre retorna true (se puede agregar lógica de límites después)
    const canSelectPeraWallet = () => true;
    const winnerIndex = selectWeightedWinner(prizes, canSelectPeraWallet, true);
    targetWinnerIndexRef.current = winnerIndex;
    
    const winnerPrize = prizes[winnerIndex];
    const winnerPrizeName = typeof winnerPrize === 'string' ? winnerPrize : winnerPrize.name;
    console.log('✅ Ganador predeterminado (antes del giro):', winnerPrizeName, 'índice:', winnerIndex);
    
    // VERIFICACIÓN CRÍTICA: Calcular y verificar el ángulo objetivo
    let baseTargetAngle = calculateAngleForIndex(winnerIndex, prizes);
    
    // Verificar inmediatamente que el ángulo calculado produce el índice correcto
    const verificationIndex = calculateWinnerIndexFromAngle(baseTargetAngle, prizes);
    if (verificationIndex !== winnerIndex) {
      console.error('❌ ERROR: El ángulo calculado no produce el índice esperado');
      console.error('   Índice esperado:', winnerIndex, 'Índice verificado:', verificationIndex);
      console.error('   Ángulo base:', baseTargetAngle);
      
      // Ajuste de emergencia - buscar un ángulo que funcione
      let adjustedAngle = baseTargetAngle;
      let attempts = 0;
      while (calculateWinnerIndexFromAngle(adjustedAngle, prizes) !== winnerIndex && attempts < 10) {
        adjustedAngle += 0.01; // Pequeño ajuste incremental
        attempts++;
      }
      
      if (calculateWinnerIndexFromAngle(adjustedAngle, prizes) === winnerIndex) {
        console.log('✅ Ángulo ajustado correctamente después de', attempts, 'intentos');
        baseTargetAngle = adjustedAngle;
      }
    }
    
    // Calcular vueltas completas
    const minTurns = 3;
    const maxTurns = 7;
    const numTurns = minTurns + Math.random() * (maxTurns - minTurns);
    const targetAngle = baseTargetAngle + numTurns * (Math.PI * 2);
    targetAngleRef.current = targetAngle;
    
    // VERIFICACIÓN FINAL
    const finalVerificationIndex = calculateWinnerIndexFromAngle(targetAngle, prizes);
    console.log('🔍 Verificación final - Índice desde ángulo objetivo:', finalVerificationIndex, 
                'debería ser:', winnerIndex, 
                '¿Coincide?', finalVerificationIndex === winnerIndex);
    
    // Calcular distancia angular hasta el objetivo
    let angleToTravel = targetAngle - angle;
    
    // Normalizar la diferencia al rango más corto
    while (angleToTravel > Math.PI) angleToTravel -= Math.PI * 2;
    while (angleToTravel < -Math.PI) angleToTravel += Math.PI * 2;
    
    // Asegurar giro positivo (hacia adelante) con vueltas mínimas
    if (angleToTravel < minTurns * Math.PI * 2) {
      angleToTravel += Math.PI * 2 * Math.ceil(minTurns);
    }
    
    // Calcular velocidad inicial con método más preciso
    const initialVelocity = calculateOptimalVelocity(angleToTravel);
    
    if (prizes.length > 0) {
      const sliceAngle = (Math.PI * 2) / prizes.length;
      const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const pointerAngle = Math.PI * 1.5;
      const relativeAngle = ((pointerAngle - normalizedAngle) + Math.PI * 2) % (Math.PI * 2);
      lastSliceRef.current = Math.floor(relativeAngle / sliceAngle) % prizes.length;
    } else {
      lastSliceRef.current = 0;
    }
    lastTickAngleRef.current = angle;
    
    setWinner(null);
    setVelocity(-initialVelocity); // Negativo para giro horario
    setSpinning(true);
    
    console.log('🎯 Iniciando giro:', {
      premioObjetivo: winnerPrizeName,
      indiceObjetivo: winnerIndex,
      velocidad: initialVelocity,
      distanciaAngular: angleToTravel,
      vueltas: numTurns
    });
  }, [spinning, angle, stopAnimation, initializeAudio, prizes, calculateOptimalVelocity]);

  return { 
    angle, 
    velocity,
    spinning, 
    winner, 
    startSpin 
  };
};