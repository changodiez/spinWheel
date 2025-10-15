import { useRef, useCallback, useEffect } from 'react';
import { CONFIG } from '../constants/config';

export const useSoundEffects = () => {
  const audioContextRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Inicializar AudioContext solo cuando sea necesario
  const initializeAudio = useCallback(() => {
    if (isInitializedRef.current) return audioContextRef.current;
    
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      isInitializedRef.current = true;
      console.log('AudioContext inicializado correctamente');
    } catch (error) {
      console.warn('AudioContext no soportado:', error);
      return null;
    }
    
    return audioContextRef.current;
  }, []);

  // Reactivar el AudioContext si está suspendido
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      return initializeAudio();
    }
    
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume().then(() => {
        console.log('AudioContext reanudado');
      }).catch(error => {
        console.warn('Error al reanudar AudioContext:', error);
      });
    }
    
    return audioContextRef.current;
  }, [initializeAudio]);

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
      
      // Configurar volumen más suave
      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.1);
    } catch (error) {
      console.warn('Error playing tick sound:', error);
    }
  }, [getAudioContext]);

  const playWin = useCallback(() => {
    const ctx = getAudioContext();
    if (!ctx) return;

    try {
      // Fanfarria de victoria más elaborada
      const notes = [
        { freq: 523.25, duration: 0.2 }, // C5
        { freq: 659.25, duration: 0.2 }, // E5
        { freq: 783.99, duration: 0.3 }, // G5
        { freq: 1046.50, duration: 0.5 } // C6
      ];
      
      notes.forEach((note, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        
        oscillator.frequency.value = note.freq;
        oscillator.type = 'sine';
        
        const startTime = ctx.currentTime + i * 0.15;
        
        // Envolvente ADSR
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);
      });
    } catch (error) {
      console.warn('Error playing win sound:', error);
    }
  }, [getAudioContext]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().then(() => {
          console.log('AudioContext cerrado');
        });
      }
    };
  }, []);

  return { 
    playTick, 
    playWin,
    // Método para forzar la inicialización si es necesario
    initializeAudio 
  };
};