import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useWheelAnimation } from '../hooks/useWheelAnimation';
import { PRIZES, CONFIG } from '../constants/config';
import { getResponsiveSize } from '../utils/wheelCalculations';
import WheelCanvas from './WheelCanvas';
import FlickerPointer from './FlickerPointer';
import WinnerPopup from './WinnerPopup';
import './SpinWheelAlgoland.css';

const SpinWheelAlgoland = () => {
  const [wheelSize, setWheelSize] = useState(CONFIG.WHEEL.SIZE);
  const [showWinner, setShowWinner] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [audioReady, setAudioReady] = useState(false);
  
  const { angle, velocity, spinning, winner, startSpin } = useWheelAnimation(PRIZES);
  const buttonRef = useRef(null);

  // Efecto para inicializar audio en la primera interacción
  useEffect(() => {
    const handleFirstInteraction = () => {
      setAudioReady(true);
      // Remover listeners después de la primera interacción
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    if (!audioReady) {
      window.addEventListener('click', handleFirstInteraction);
      window.addEventListener('touchstart', handleFirstInteraction);
      window.addEventListener('keydown', handleFirstInteraction);
    }

    return () => {
      window.removeEventListener('click', handleFirstInteraction);
      window.removeEventListener('touchstart', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [audioReady]);

  // Efecto para anuncios de accesibilidad
  useEffect(() => {
    if (spinning) {
      setAnnouncement('La rueda está girando');
      const timer = setTimeout(() => setAnnouncement(''), CONFIG.ACCESSIBILITY.SPIN_ANNOUNCE_DELAY);
      return () => clearTimeout(timer);
    } else if (winner) {
      setAnnouncement(`Has ganado: ${winner.prize}`);
    } else {
      setAnnouncement('Listo para girar la rueda');
    }
  }, [spinning, winner]);

  useEffect(() => {
    if (winner) {
      setShowWinner(true);
    }
  }, [winner]);

  useEffect(() => {
    const handleResize = () => {
      setWheelSize(getResponsiveSize());
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSpin = useCallback(() => {
    if (!audioReady) {
      setAudioReady(true);
    }
    startSpin();
  }, [audioReady, startSpin]);

  const handleCloseWinner = useCallback(() => {
    setShowWinner(false);
  }, []);

  const handleTouchStart = useCallback((e) => {
    if (spinning) return;
    e.preventDefault();
    handleSpin();
  }, [spinning, handleSpin]);

  if (!PRIZES || PRIZES.length === 0) {
    return (
      <div className="spin-wheel-container error">
        <div className="text-2xl text-white font-bold">No hay premios disponibles</div>
      </div>
    );
  }

  return (
    <div className="spin-wheel-container">
      {/* Anuncios de accesibilidad */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Indicador de audio */}
    

      {/* Encabezado */}
      <div className="header">
        <h1 className="title-main">
          <span className="title-line">WHEEL OF</span>
          <span className="title-line accent">FORTUNE!</span>
        </h1>
        <div className="title-underline"></div>
      </div>

      {/* Contenedor de la ruleta */}
      <div className="wheel-container">
        <div className="wheel-wrapper" style={{ width: wheelSize, height: wheelSize }}>
          <WheelCanvas 
            angle={angle} 
            prizes={PRIZES} 
            winnerIndex={winner?.index}
            size={wheelSize}
          />
          
          <FlickerPointer 
            angle={angle} 
            prizes={PRIZES} 
            wheelSize={wheelSize}
            velocity={velocity}
          />
        </div>
      </div>

      {/* Botón de girar */}
      <button
        ref={buttonRef}
        onClick={handleSpin}
        onTouchStart={handleTouchStart}
        disabled={spinning}
        aria-label={spinning ? "Girando la ruleta" : "Girar la ruleta"}
        className={`spin-button ${spinning ? 'spinning' : ''}`}
      >
        <span className="button-text">
          {spinning ? (
            <>
              <span className="spinning-icon">🌀</span>
              GIRANDO...
            </>
          ) : (
            <>
              <span className="spin-icon">🎯</span>
              ¡GIRAR LA RULETA!
            </>
          )}
        </span>
        <div className="button-glow"></div>
      </button>

      {/* Popup de ganador */}
      <WinnerPopup 
        winner={showWinner ? winner : null} 
        onClose={handleCloseWinner} 
      />

      
      {/* Efectos de partículas */}
      <div className="particles">
        {[...Array(100)].map((_, i) => (
          <div key={i} className="particle" style={{
            '--delay': `${i * 0.5}s`,
            '--duration': `${3 + Math.random() * 2}s`,
            '--x': `${Math.random() * 100000}%`
          }}></div>
        ))}
      </div>
    </div>
  );
};

export default SpinWheelAlgoland;