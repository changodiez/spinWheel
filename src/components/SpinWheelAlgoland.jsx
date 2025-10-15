import React, { useState, useEffect, useCallback } from 'react';
import { useWheelAnimation } from '../hooks/useWheelAnimation';
import { PRIZES, CONFIG } from '../constants/config';
import { getResponsiveSize } from '../utils/wheelCalculations';
import WheelCanvas from './WheelCanvas';
import FlickerPointer from './FlickerPointer';
import WinnerPopup from './WinnerPopup';

const SpinWheelAlgoland = () => {
  const [wheelSize, setWheelSize] = useState(CONFIG.WHEEL.SIZE);
  const [showWinner, setShowWinner] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  
  const { angle, velocity, spinning, winner, startSpin } = useWheelAnimation(PRIZES);

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
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="text-2xl text-white font-bold">No hay premios disponibles</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 p-4">
      {/* Anuncios de accesibilidad */}
      <div 
        className="sr-only" 
        aria-live="polite" 
        aria-atomic="true"
      >
        {announcement}
      </div>

      {/* Encabezado */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-2 tracking-wider 
                      [text-shadow:_0_2px_10px_rgba(255_255_0_/_50%)]">
          WHEEL OF
        </h1>
        <h1 className="text-5xl md:text-7xl font-bold text-yellow-400 mb-4 tracking-wider
                      [text-shadow:_0_2px_15px_rgba(255_255_0_/_60%)]">
          FORTUNE!
        </h1>
        <div 
          className="w-32 h-1 bg-yellow-400 mx-auto mb-6 
                    [box-shadow:_0_0_10px_rgba(255_255_0_/_70%)]"
          aria-hidden="true"
        />
      </div>

      {/* Contenedor de la ruleta */}
      <div className="relative mb-12">
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

      {/* Botón de girar */}
      <button
        onClick={handleSpin}
        onTouchStart={handleTouchStart}
        disabled={spinning}
        aria-label={spinning ? "Girando la ruleta" : "Girar la ruleta"}
        className={`px-8 md:px-12 py-4 md:py-6 rounded-full text-white text-xl md:text-2xl font-bold 
                   transition-all duration-300 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-yellow-300
                   ${
          spinning 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
        }
                   [box-shadow:_0_0_30px_rgba(255_165_0_/_60%)]
                   border-4 border-yellow-300`}
      >
        {spinning ? 'SPINNING... 🌀' : 'SPIN THE WHEEL!'}
      </button>

      {/* Popup de ganador */}
      <WinnerPopup 
        winner={showWinner ? winner : null} 
        onClose={handleCloseWinner} 
      />

      {/* Decoraciones de borde */}
      <div 
        className="fixed top-0 left-0 w-full h-2 bg-yellow-400 
                  [box-shadow:_0_0_20px_yellow]"
        aria-hidden="true"
      />
      <div 
        className="fixed bottom-0 left-0 w-full h-2 bg-yellow-400 
                  [box-shadow:_0_0_20px_yellow]"
        aria-hidden="true"
      />
    </div>
  );
};

export default SpinWheelAlgoland;