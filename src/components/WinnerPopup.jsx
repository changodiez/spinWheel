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
  const timerRef = useRef(null);

  useEffect(() => {
    if (winner) {
      
      // Configurar timer de cierre automático
      timerRef.current = setTimeout(() => {
        onClose();
      }, autoCloseTime);

      // Limpiar al desmontar
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [winner, onClose, autoCloseTime]);

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
         <div className="popup-inner">
          {/* Icono de celebración */}
          <div className="celebration-icon">🎉</div>
          
          {/* Título */}
          <h1 id="winner-title" className="popup-title">
            YOU WIN!
          </h1>
          
          {/* Imagen del producto */}
          <div className="prize-image-container">
            <div className="prize-image" role="img" aria-label={winner.prize}>
              {prizeImage}
            </div>
          </div>
          
          {/* Contenido del premio */}
          <div className="prize-container">
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
            </div>
        </div>

        {/* Efecto de brillo alrededor */}

      </div>
    </div>
  );
};

export default WinnerPopup;