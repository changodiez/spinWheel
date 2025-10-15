import { useRef, useCallback, useEffect } from 'react';
import { CONFIG } from '../constants/config';

export const useSoundEffects = () => {
  const audioContextRef = useRef(null);

  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      } catch (error) {
        console.warn('AudioContext no soportado:', error);
        return null;
      }
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    
    return audioContextRef.current;
  }, []);

  const playTick = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = CONFIG.SOUND.TICK_FREQUENCY;
      oscillator.type = 'square';
      
      gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (error) {
      console.warn('Error playing tick sound:', error);
    }
  }, [getAudioContext]);

  const playWin = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      CONFIG.SOUND.WIN_NOTES.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = freq;
        oscillator.type = 'sine';
        
        const startTime = ctx.currentTime + i * CONFIG.SOUND.WIN_NOTE_DURATION;
        gainNode.gain.setValueAtTime(0.2, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + CONFIG.SOUND.WIN_NOTE_DURATION);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + CONFIG.SOUND.WIN_NOTE_DURATION);
      });
    } catch (error) {
      console.warn('Error playing win sound:', error);
    }
  }, [getAudioContext]);

  return { playTick, playWin };
};
