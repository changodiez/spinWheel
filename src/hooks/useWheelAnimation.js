import { useState, useRef, useCallback, useEffect } from 'react';
import { useSoundEffects } from './useSoundEffects';
import { calculateWinnerIndex, applyWeightedSelectionWithAngle } from '../utils/wheelCalculations';
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
    
    const newAngle = angle - velocity * deltaTime;
    const newVelocity = velocity * (1 - deltaTime * CONFIG.PHYSICS.FRICTION);

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
      
      const result = applyWeightedSelectionWithAngle(newAngle, prizes);
      
      if (Math.abs(result.finalAngle - newAngle) > 0.01) {
        let angleDiff = result.finalAngle - newAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        setAngle(newAngle + angleDiff);
      } else {
        setAngle(result.finalAngle);
      }
      
      const winnerData = {
        prize: prizes[result.index],
        index: result.index
      };
      
      setWinner(winnerData);
      
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
    
    initializeAudio();
    stopAnimation();
    
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
    const randomVelocity = -(
      CONFIG.PHYSICS.MIN_VELOCITY + 
      Math.random() * (CONFIG.PHYSICS.MAX_VELOCITY - CONFIG.PHYSICS.MIN_VELOCITY)
    );
    
    setVelocity(randomVelocity);
    setSpinning(true);
  }, [spinning, angle, stopAnimation, initializeAudio, prizes.length]);

  return { 
    angle, 
    velocity,
    spinning, 
    winner, 
    startSpin 
  };
};