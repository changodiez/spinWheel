import React, { useEffect, useRef } from 'react';
import './WinnerPopup.css';

// Mapeo de imágenes para cada premio
const PRIZE_IMAGES = {
  "Tote Bag": "🎒",
  "Camiseta": "👕", 
  "QR1": "📱",
  "Gorra": "🧢",
  "Mug": "☕",
  "QR2": "📱",
  "Pin": "📌",
  "Patch": "🧵",
  "QR3": "📱",
  "Luggage Tag": "🏷️",
  "Calcetín": "🧦"
};

const WinnerPopup = ({ winner, onClose, autoCloseTime = 10000 }) => {
  const dialogRef = useRef(null);
  const audioPlayedRef = useRef(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (winner) {
      // Reproducir sonido de victoria SOLO UNA VEZ
      if (!audioPlayedRef.current) {
        playWinSound();
        audioPlayedRef.current = true;
      }

      // Configurar timer de cierre automático (más largo ahora que hay botón)
      timerRef.current = setTimeout(() => {
        onClose();
      }, autoCloseTime);

      // Limpiar al desmontar
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        audioPlayedRef.current = false;
      };
    }
  }, [winner, onClose, autoCloseTime]);

  const playWinSound = () => {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const notes = [
        { freq: 523.25, duration: 0.3, start: 0 },
        { freq: 659.25, duration: 0.3, start: 0.2 },
        { freq: 783.99, duration: 0.4, start: 0.4 },
        { freq: 1046.50, duration: 0.6, start: 0.6 },
        { freq: 1318.51, duration: 0.8, start: 0.8 }
      ];
      
      notes.forEach((note) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = note.freq;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + note.start;
        
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + note.duration);
      });
    } catch (error) {
      console.warn('Error playing popup win sound:', error);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!winner) return null;

  const prizeImage = PRIZE_IMAGES[winner.prize] || "🎁";

  return (
    <div 
      ref={dialogRef}
      className="winner-popup-overlay"
      role="dialog"
      aria-labelledby="winner-title"
      aria-describedby="winner-description"
      aria-modal="true"
    >
      <div className="winner-popup-content">
        {/* Efectos de confeti */}
        <div className="confetti-container">
          {[...Array(50)].map((_, i) => (
            <div 
              key={i}
              className="confetti"
              style={{
                '--delay': `${Math.random() * 3}s`,
                '--duration': `${1 + Math.random() * 2}s`,
                '--x': `${Math.random() * 100}%`,
                '--color': `hsl(${Math.random() * 360}, 100%, 50%)`
              }}
            />
          ))}
        </div>

        <div className="popup-inner">
          {/* Icono de celebración */}
          <div className="celebration-icon">🎉</div>
          
          {/* Título */}
          <h1 id="winner-title" className="popup-title">
            ¡FELICIDADES!
          </h1>
          
          {/* Imagen del producto */}
          <div className="prize-image-container">
            <div className="prize-image" role="img" aria-label={winner.prize}>
              {prizeImage}
            </div>
          </div>
          
          {/* Contenido del premio */}
          <div className="prize-container">
            <p className="prize-label">Has ganado:</p>
            <p className="prize-name">{winner.prize}</p>
          </div>

          {/* Botón de cierre para el botón físico */}
          <div className="close-button-container">
            <button
              onClick={handleClose}
              className="physical-close-button"
              aria-label="Presiona nuevamente para cerrar"
              autoFocus
            >
              <span className="button-text">Presiona nuevamente para cerrar</span>
              <div className="button-glow"></div>
            </button>
            <p className="button-instruction">
              (Usa el mismo botón que giró la ruleta)
            </p>
          </div>
        </div>

        {/* Efecto de brillo alrededor */}
        <div className="popup-glow"></div>
      </div>
    </div>
  );
};

export default WinnerPopup;