import React, { useState, useEffect, useCallback } from 'react';
import { useWheelAnimation } from '../hooks/useWheelAnimation';
import { CONFIG } from '../constants/config';
import { getResponsiveSize } from '../utils/wheelCalculations';
import WheelCanvas from './WheelCanvas';
import FlickerPointer from './FlickerPointer';
import WinnerPopup from './WinnerPopup';
import './SpinWheelAlgoland.css';

// Premios fijos para GitHub Pages
const DEFAULT_PRIZES = [
  "Tote Bag", "Camiseta", "QR1", "Gorra", "Mug", 
  "QR2", "Pin", "Patch", "QR3", "Luggage Tag", "Calcetín"
];

const SpinWheelAlgoland = () => {
  const [wheelSize, setWheelSize] = useState(400);
  const [showWinner, setShowWinner] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [isLandscape, setIsLandscape] = useState(false);
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  
  const { angle, velocity, spinning, winner, startSpin } = useWheelAnimation(prizes);

  // Detectar si estamos en GitHub Pages (demo) o local (completo)
  useEffect(() => {
    const isGitHubPages = window.location.hostname.includes('github.io');
    setIsDemoMode(isGitHubPages);
    
    if (isGitHubPages) {
      setConnectionStatus('Modo Demo - Premios Fijos');
      setPrizes(DEFAULT_PRIZES);
    } else {
      setConnectionStatus('Conectando al servidor...');
      // Solo conectar WebSocket si NO estamos en GitHub Pages
      connectToWebSocket();
    }
  }, []);

  // WebSocket connection solo para local
  const connectToWebSocket = () => {
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
      setConnectionStatus('Conectado - Modo Completo');
      console.log('Conectado al servidor WebSocket');
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'prizes_update':
            setPrizes(data.prizes);
            break;
            
          case 'spin_wheel':
            if (!spinning && prizes.length > 0) {
              startSpin();
            }
            break;
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      if (!isDemoMode) {
        setConnectionStatus('Desconectado - Usando premios locales');
        // Si se desconecta, usar premios por defecto
        setPrizes(DEFAULT_PRIZES);
      }
    };
    
    ws.onerror = (error) => {
      if (!isDemoMode) {
        setConnectionStatus('Error de conexión - Modo Local');
        setPrizes(DEFAULT_PRIZES);
      }
    };
  };

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
      
      {/* Indicador de conexión */}
      <div className={`connection-indicator ${isDemoMode ? 'demo' : connectionStatus.includes('Conectado') ? 'connected' : 'error'}`}>
        <div className={`status-dot ${isDemoMode ? 'demo' : connectionStatus.includes('Conectado') ? 'connected' : ''}`}></div>
        {connectionStatus}
        {isDemoMode && (
          <span style={{marginLeft: '0.5rem', fontSize: '0.7rem', opacity: '0.8'}}>
            (Panel no disponible)
          </span>
        )}
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
      </div>

      {/* Contenedor de la ruleta */}
      <div className="wheel-container">
        <WheelCanvas 
          angle={angle} 
          prizes={prizes}
          winnerIndex={winner?.index}
          size={wheelSize}
        />
        
        <FlickerPointer 
          angle={angle} 
          prizes={prizes}
          wheelSize={wheelSize}
          velocity={velocity}
        />
      </div>

      {/* Botón de girar */}
      <button
        onClick={handleSpin}
        onTouchStart={handleTouchStart}
        disabled={spinning || prizes.length === 0}
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
        autoCloseTime={isDemoMode ? 8000 : 15000}
      />

      {/* Efectos de borde */}
      <div className="border-effect top"></div>
      <div className="border-effect bottom"></div>


    </div>
  );
};

export default SpinWheelAlgoland;