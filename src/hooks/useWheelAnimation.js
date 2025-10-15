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
  
  const { playTick, playWin } = useSoundEffects();

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

    // Reproducir sonido de tick al cruzar premios
    const angleDiff = Math.abs(newAngle - lastTickAngleRef.current);
    if (angleDiff > CONFIG.PHYSICS.TICK_INTERVAL) {
      playTick();
      lastTickAngleRef.current = newAngle;
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
      playWin();
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
    
    stopAnimation();
    lastTickAngleRef.current = angle;
    
    setWinner(null);
    const randomVelocity = -(
      CONFIG.PHYSICS.MIN_VELOCITY + 
      Math.random() * (CONFIG.PHYSICS.MAX_VELOCITY - CONFIG.PHYSICS.MIN_VELOCITY)
    );
    
    setVelocity(randomVelocity);
    setSpinning(true);
  }, [spinning, angle, stopAnimation]);

  return { 
    angle, 
    velocity,
    spinning, 
    winner, 
    startSpin 
  };
};