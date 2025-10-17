
// MAPEO CUANDO TENGA LAS IMAGENES 
/*
const PRIZE_IMAGES = {
  "Tote Bag": { type: "image", src: "/images/premios/tote-bag.jpg" },
  "Camiseta": { type: "image", src: "/images/premios/camiseta.jpg" }, 
  "QR1": { type: "emoji", src: "📱" },
  "Gorra": { type: "image", src: "/images/premios/gorra.jpg" },
  "Mug": { type: "image", src: "/images/premios/mug.jpg" },
  "QR2": { type: "emoji", src: "📱" },
  "Pin": { type: "image", src: "/images/premios/pin.jpg" },
  "Patch": { type: "image", src: "/images/premios/patch.jpg" },
  "QR3": { type: "emoji", src: "📱" },
  "Luggage Tag": { type: "image", src: "/images/premios/luggage-tag.jpg" },
  "Calcetín": { type: "image", src: "/images/premios/calcetin.jpg" }
};
*/
import React, { useEffect, useRef, useState } from 'react';
import './WinnerPopup.css';

// Mapeo de emojis para premios
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
  const [preventClose, setPreventClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (winner) {
      // Tecla "W" para prevenir cierre (modo desarrollo)
      const handleKeyPress = (e) => {
        if (e.key === 'w' || e.key === 'W') {
          setPreventClose(prev => !prev);
        }
      };

      window.addEventListener('keydown', handleKeyPress);

      // Timer de cierre automático
      if (!preventClose) {
        timerRef.current = setTimeout(() => {
          handleClose();
        }, autoCloseTime);
      }

      // Click en cualquier lugar para cerrar
      const handleClickAnywhere = () => {
        if (!preventClose) {
          handleClose();
        }
      };

      // Delay para evitar cierre inmediato
      const clickTimeout = setTimeout(() => {
        if (!preventClose) {
          document.addEventListener('click', handleClickAnywhere);
        }
      }, 500);

      // Cleanup
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        clearTimeout(clickTimeout);
        document.removeEventListener('click', handleClickAnywhere);
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [winner, onClose, autoCloseTime, preventClose]);

  // Manejar cierre con animación
  const handleClose = () => {
    if (!preventClose && !isClosing) {
      setIsClosing(true);
      setTimeout(() => {
        onClose();
        setIsClosing(false);
      }, 400);
    }
  };

  // Prevenir cierre al hacer click dentro del popup
  const handlePopupClick = (e) => {
    e.stopPropagation();
  };

  if (!winner) return null;

  const prizeImage = PRIZE_IMAGES[winner.prize] || "🎁";

  return (
    <div 
      ref={dialogRef}
      className={`winner-popup-overlay ${isClosing ? 'closing' : ''}`}
      role="dialog"
      aria-labelledby="winner-title"
      aria-describedby="winner-description"
      aria-modal="true"
      onClick={handleClose}
    >
      <div 
        className="winner-popup-content"
        onClick={handleClose}
      >
        <div className="popup-inner">
          <div className="celebration-icon">🎉</div>
          <h1 id="winner-title" className="popup-title">YOU WIN!</h1>
          <div className="prize-image-container">
            <div className="prize-image" role="img" aria-label={winner.prize}>
              {prizeImage}
            </div>
          </div>
          <div className="prize-container">
            <p className="prize-name">{winner.prize}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WinnerPopup;