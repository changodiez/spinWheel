import React, { useEffect, useRef } from 'react';
import './WinnerPopup.css'; // Archivo de estilos específico

const WinnerPopup = ({ winner, onClose }) => {
  const dialogRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (winner && dialog) {
      dialog.focus();
      
      // Reproducir sonido de victoria cuando aparece el popup
      playWinSound();
    }
  }, [winner]);

  const playWinSound = () => {
    // Crear contexto de audio para el popup
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Fanfarria de victoria más épica para el popup
      const notes = [
        { freq: 523.25, duration: 0.3, start: 0 },    // C5
        { freq: 659.25, duration: 0.3, start: 0.2 },  // E5
        { freq: 783.99, duration: 0.4, start: 0.4 },  // G5
        { freq: 1046.50, duration: 0.6, start: 0.6 }, // C6
        { freq: 1318.51, duration: 0.8, start: 0.8 }  // E6
      ];
      
      notes.forEach((note) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = note.freq;
        oscillator.type = 'sine';
        
        const startTime = audioContext.currentTime + note.start;
        
        // Envolvente más dramática
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

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
    if (e.key === 'Enter' || e.key === ' ') {
      onClose();
    }
  };

  if (!winner) return null;

  return (
    <div 
      ref={dialogRef}
      className="winner-popup-overlay"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-labelledby="winner-title"
      aria-describedby="winner-description"
      aria-modal="true"
      tabIndex={-1}
    >
      <div 
        className="winner-popup-content"
        onClick={(e) => e.stopPropagation()}
      >
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
          
          {/* Contenido del premio */}
          <div className="prize-container">
            <p className="prize-label">Has ganado:</p>
            <p className="prize-name">{winner.prize}</p>
          </div>
          
          {/* Botón de cerrar */}
          <button
            onClick={onClose}
            className="popup-close-button"
            aria-label="Cerrar mensaje de premio"
            autoFocus
          >
            <span className="button-text">¡Genial! 🎊</span>
            <div className="button-sparkle"></div>
          </button>
        </div>

        {/* Efecto de brillo alrededor */}
        <div className="popup-glow"></div>
      </div>
    </div>
  );
};

export default WinnerPopup;