import React, { useState, useEffect, useCallback } from 'react';
import { useWheelAnimation } from '../hooks/useWheelAnimation';
import { PRIZES, CONFIG } from '../constants/config';
import { getResponsiveSize } from '../utils/wheelCalculations';
import WheelCanvas from './WheelCanvas';
import FlickerPointer from './FlickerPointer';
import WinnerPopup from './WinnerPopup';
import './SpinWheelAlgoland.css';

const SpinWheelAlgoland = () => {
  const [wheelSize, setWheelSize] = useState(400); // Tamaño inicial más pequeño
  const [showWinner, setShowWinner] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [isPortrait, setIsPortrait] = useState(true); // Asumimos vertical por defecto
  
  const { angle, velocity, spinning, winner, startSpin } = useWheelAnimation(PRIZES);

  // Detectar orientación y calcular tamaños para TV vertical
  useEffect(() => {
    const handleResize = () => {
      const isPortraitMode = window.innerHeight > window.innerWidth;
      setIsPortrait(isPortraitMode);
      
      if (isPortraitMode) {
        // Para TV vertical - optimizar espacio
        const maxSize = Math.min(window.innerWidth * 0.85, window.innerHeight * 0.5);
        setWheelSize(Math.max(350, maxSize));
      } else {
        // Para horizontal (por si acaso)
        const maxSize = Math.min(window.innerHeight * 0.7, window.innerWidth * 0.6);
        setWheelSize(Math.max(400, maxSize));
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Efecto para anuncios de accesibilidad
  useEffect(() => {
    if (spinning) {
      setAnnouncement('La rueda está girando');
      const timer = setTimeout(() => setAnnouncement(''), 100);
      return () => clearTimeout(timer);
    } else if (winner) {
      setAnnouncement(`Has ganado: ${winner.prize}`);
    } else {
      setAnnouncement('Listo para girar la ruleta');
    }
  }, [spinning, winner]);

  useEffect(() => {
    if (winner) {
      setShowWinner(true);
    }
  }, [winner]);

  const handleSpin = useCallback(() => {
    startSpin();
  }, [startSpin]);

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
    <div className={`spin-wheel-container ${isPortrait ? 'portrait-mode' : 'landscape-mode'}`}>
      {/* Anuncios de accesibilidad */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Encabezado - MÁS COMPACTO para vertical */}
      <div className="header">
        <h1 className="title-main">
          <span className="title-line">WHEEL OF</span>
          <span className="title-line accent">FORTUNE!</span>
        </h1>
        <div className="title-underline"></div>
      </div>

      {/* Contenedor de la ruleta - OPTIMIZADO PARA VERTICAL */}
      <div className="wheel-container">
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

      {/* Botón de girar - MÁS GRANDE para TV */}
      <button
        onClick={handleSpin}
        onTouchStart={handleTouchStart}
        disabled={spinning}
        aria-label={spinning ? "Girando la ruleta" : "Girar la ruleta"}
        className={`spin-button tv-button ${spinning ? 'spinning' : ''}`}
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
        autoCloseTime={5000} // 15 segundos para TV
      />

      {/* Efectos de borde */}
      <div className="border-effect top"></div>
      <div className="border-effect bottom"></div>
      
      {/* Efectos de partículas */}
      <div className="particles">
        {[...Array(15)].map((_, i) => ( // Menos partículas para mejor rendimiento
          <div 
            key={i}
            className="particle"
            style={{
              '--delay': `${i * 0.5}s`,
              '--duration': `${3 + Math.random() * 2}s`,
              '--x': `${Math.random() * 100}%`
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default SpinWheelAlgoland;