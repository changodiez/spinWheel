import { useState, useRef, useCallback, useEffect } from 'react';
import { useSoundEffects } from './useSoundEffects';
import { calculateWinnerIndex } from '../utils/wheelCalculations';
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
  
  // Asegurarnos de que el hook de sonido se inicialice correctamente
  const { playTick, playWin, initializeAudio } = useSoundEffects();

  // Inicializar audio cuando el componente se monta
  useEffect(() => {
    // Forzar la inicialización del audio en una interacción del usuario
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
      requestRef.current = requestAnimationFrame(animate);
      return;
    }

    const deltaTime = Math.min((time - lastTimeRef.current) / 1000, 0.033);
    lastTimeRef.current = time;
    
    const newAngle = angle - velocity * deltaTime;
    const newVelocity = velocity * (1 - deltaTime * CONFIG.PHYSICS.FRICTION);

    // ✅ DETECCIÓN MEJORADA DE CRUCE DE PREMIOS
    if (prizes.length > 0) {
      const sliceAngle = (Math.PI * 2) / prizes.length;
      const normalizedAngle = ((newAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const currentSlice = Math.floor(normalizedAngle / sliceAngle);
      
      // Solo reproducir sonido cuando realmente cambia de premio
      if (currentSlice !== lastSliceRef.current) {
        playTick(Math.abs(velocity)); // Pasar velocidad para sonido dinámico
        lastSliceRef.current = currentSlice;
      }
    }

    setAngle(newAngle);
    setVelocity(newVelocity);

    // Detener cuando la velocidad es baja
    if (Math.abs(newVelocity) < CONFIG.PHYSICS.STOP_THRESHOLD) {
      setSpinning(false);
      
      const winnerIndex = calculateWinnerIndex(newAngle, prizes);
      const winnerData = {
        prize: prizes[winnerIndex],
        index: winnerIndex
      };
      
      setWinner(winnerData);
      
      // Pequeño delay antes del sonido de victoria
      setTimeout(() => {
        playWin();
      }, 300);
      
      stopAnimation();
      return;
    }
    
    requestRef.current = requestAnimationFrame(animate);
  }, [spinning, angle, velocity, prizes, playTick, playWin, stopAnimation]);

  useEffect(() => {
    if (!spinning) {
      stopAnimation();
      return;
    }

    requestRef.current = requestAnimationFrame(animate);
    
    return stopAnimation;
  }, [spinning, animate, stopAnimation]);

  const startSpin = useCallback(() => {
    if (spinning) return;
    
    // Asegurar que el audio esté inicializado antes de girar
    initializeAudio();
    
    stopAnimation();
    
    // ✅ RESETEAR LAS REFERENCIAS AL COMENZAR NUEVO GIRO
    lastSliceRef.current = 0;
    lastTickAngleRef.current = angle;
    
    setWinner(null);
    const randomVelocity = -(
      CONFIG.PHYSICS.MIN_VELOCITY + 
      Math.random() * (CONFIG.PHYSICS.MAX_VELOCITY - CONFIG.PHYSICS.MIN_VELOCITY)
    );
    
    setVelocity(randomVelocity);
    setSpinning(true);
  }, [spinning, angle, stopAnimation, initializeAudio]);

  return { 
    angle, 
    velocity,
    spinning, 
    winner, 
    startSpin 
  };
};