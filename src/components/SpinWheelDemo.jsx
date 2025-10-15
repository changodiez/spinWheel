import React, { useState, useEffect, useCallback } from 'react';
import { useWheelAnimation } from '../hooks/useWheelAnimation';
import { CONFIG } from '../constants/config';
import { getResponsiveSize } from '../utils/wheelCalculations';
import WheelCanvas from './WheelCanvas';
import FlickerPointer from './FlickerPointer';
import WinnerPopup from './WinnerPopup';
import './SpinWheelAlgoland.css';

// Premios fijos para la demo
const DEMO_PRIZES = [
  "Tote Bag", "Camiseta", "QR1", "Gorra", "Mug", 
  "QR2", "Pin", "Patch", "QR3", "Luggage Tag", "Calcetín"
];

const SpinWheelDemo = () => {
  const [wheelSize, setWheelSize] = useState(400);
  const [showWinner, setShowWinner] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  
  const { angle, velocity, spinning, winner, startSpin } = useWheelAnimation(DEMO_PRIZES);

  // Detectar orientación
  useEffect(() => {
    const checkOrientation = () => {
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      setIsLandscape(isLandscapeMode);
      
      const maxSize = Math.min(window.innerWidth, window.innerHeight) * 0.7;
      setWheelSize(Math.max(350, maxSize));
    };
    
    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
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

  return (
    <div className={`spin-wheel-container forced-portrait ${isLandscape ? 'landscape-warning' : ''}`}>
      
      {/* Info Demo */}
      <div className="demo-info">
        <div className="status-dot connected"></div>
        Modo Demo - Premios fijos
      </div>

      {/* Anuncios de accesibilidad */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Encabezado */}
      <div className="header">
        <h1 className="title-main">
          <span className="title-line">WHEEL OF</span>
          <span className="title-line accent">FORTUNE!</span>
        </h1>
        <div className="title-underline"></div>
        <p className="demo-subtitle">Versión Demo - 11 premios predefinidos</p>
      </div>

      {/* Contenedor de la ruleta */}
      <div className="wheel-container">
        <WheelCanvas 
          angle={angle} 
          prizes={DEMO_PRIZES}
          winnerIndex={winner?.index}
          size={wheelSize}
        />
        
        <FlickerPointer 
          angle={angle} 
          prizes={DEMO_PRIZES}
          wheelSize={wheelSize}
          velocity={velocity}
        />
      </div>

      {/* Botón de girar */}
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
        autoCloseTime={10000} // 10 segundos en demo
      />

      {/* Efectos de borde */}
      <div className="border-effect top"></div>
      <div className="border-effect bottom"></div>
      
      {/* Efectos de partículas */}
      <div className="particles">
        {[...Array(15)].map((_, i) => (
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

      {/* Info para usuarios */}
      <div className="github-info">
        <p>💡 <strong>¿Versión completa?</strong> Clona el repositorio y ejecuta localmente para tener panel de control en tiempo real.</p>
      </div>
    </div>
  );
};

export default SpinWheelDemo;