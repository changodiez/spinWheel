import React, { useState, useEffect, useCallback } from 'react';
import { useWheelAnimation } from '../hooks/useWheelAnimation';
import WheelCanvas from './WheelCanvas';
import FlickerPointer from './FlickerPointer';
import WinnerPopup from './WinnerPopup';
import ReferenceOverlay from './ReferenceOverlay';
import ReferenceIMG from '../assets/img/layout2.jpg';
import backgroundVideo from '../assets/background/Spin_Video_BG.mp4';
import headerImg from '../assets/img/header.png';
import buttonImg from '../assets/img/EXPORT EFECTOS/Boton.png';
import './SpinWheelAlgoland.css';

// Premios fijos para GitHub Pages
const DEFAULT_PRIZES = [
  "Tote", "Sticker", "Cool Cap", "Tattoo", "Socks", "T-Shirt", "Mug", "Label", "PeraWallet", "Pin", "Lanyard"
];

const SpinWheelAlgoland = () => {
  const [wheelSize, setWheelSize] = useState(700); // tamaño base, se ajusta a viewport
  const [showWinner, setShowWinner] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [prizes, setPrizes] = useState(DEFAULT_PRIZES);
  const [connectionStatus, setConnectionStatus] = useState('');
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  
  const { angle, velocity, spinning, winner, startSpin } = useWheelAnimation(prizes);

  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'c' || e.key === 'C') {
        setCursorVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!spinning && 
          prizes.length > 0 &&
          !e.target.closest('.winner-popup-overlay')) {
        startSpin();
      }
    };

    document.addEventListener('click', handleGlobalClick);

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [spinning, prizes.length, startSpin]); 

  useEffect(() => {
    const isGitHubPages = window.location.hostname.includes('github.io');
    setIsDemoMode(isGitHubPages);
    
    if (isGitHubPages) {
      setConnectionStatus('Modo Demo - Premios Fijos');
      setPrizes(DEFAULT_PRIZES);
    } else {
      setConnectionStatus('Conectando al servidor...');
      connectToWebSocket();
    }
  }, []);

  const connectToWebSocket = () => {
    const ws = new WebSocket('ws://localhost:3000');
    
    ws.onopen = () => {
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
        setPrizes(DEFAULT_PRIZES);
      }
    };
    
    ws.onerror = (error) => {
      if (!isDemoMode) {
        setPrizes(DEFAULT_PRIZES);
      }
    };
  };

  useEffect(() => {
    const computeWheelSize = () => {
      const minSide = Math.min(window.innerWidth, window.innerHeight);
      const target = Math.floor(minSide * 0.902); // 0.82 * 1.1 = 0.902 (10% más grande)
      const clamped = Math.max(616, Math.min(target, 1056)); // 560*1.1=616, 960*1.1=1056
      setWheelSize(clamped);
    };
    computeWheelSize();
    window.addEventListener('resize', computeWheelSize);
    window.addEventListener('orientationchange', computeWheelSize);
    return () => {
      window.removeEventListener('resize', computeWheelSize);
      window.removeEventListener('orientationchange', computeWheelSize);
    };
  }, []);

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
    <div
      className={`spin-wheel-stage ${!cursorVisible ? 'no-cursor' : ''}`}
      style={{ cursor: cursorVisible ? 'default' : 'none' }}
    >
      <video
        className="bg-video"
        src={backgroundVideo}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="bg-overlay"></div>

      <div className="spin-wheel-container">
        <div
          className="sr-only"
          aria-live="polite"
          aria-atomic="true"
        >
          {announcement}
        </div>

        <div className="header">
          <h1 className="title-main">
          <img src={headerImg} alt="Header" className="header-img" />
          </h1>
        </div>

        <div className={`wheel-container ${showWinner ? 'hidden' : ''}`}>
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

        <div
          className={`spin-button tv-button ${spinning ? 'spinning' : ''}`}
        >
          <img 
            src={buttonImg} 
            alt="" 
            className="button-bg-image"
            aria-hidden="true"
          />
          <span className="button-text">
            {spinning ? 'SPINNING…' : 'SPIN NOW'}
          </span>
        </div>

        <WinnerPopup
          winner={showWinner ? winner : null}
          onClose={handleCloseWinner}
          autoCloseTime={isDemoMode ? 8000 : 15000}
        />
      </div>
      
      {/* Overlay de referencia - Presiona 'B' para activar/desactivar */}
      <ReferenceOverlay imagePath={ReferenceIMG} />
    </div>
  );
};

export default SpinWheelAlgoland;