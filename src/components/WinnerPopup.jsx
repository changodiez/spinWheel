import React, { useEffect, useRef, useState } from 'react'; // ✅ Agregar useState
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

const WinnerPopup = ({ winner, onClose, autoCloseTime = 10000 }) => {
  const dialogRef = useRef(null);
  const timerRef = useRef(null);
  const [preventClose, setPreventClose] = useState(false); // ✅ Nuevo estado

  useEffect(() => {
    if (winner) {
      // ✅ Detectar tecla "W" para prevenir cierre
      const handleKeyPress = (e) => {
        if (e.key === 'w' || e.key === 'W') {
          setPreventClose(prev => !prev);
          console.log('Modo prevención de cierre:', !preventClose);
        }
      };

      window.addEventListener('keydown', handleKeyPress);

      // Configurar timer de cierre automático (solo si no está prevenido)
      if (!preventClose) {
        timerRef.current = setTimeout(() => {
          onClose();
        }, autoCloseTime);
      }

      // ✅ Agregar event listener para click en cualquier lugar (solo si no está prevenido)
      const handleClickAnywhere = () => {
        if (!preventClose) {
          onClose();
        }
      };

      // Pequeño delay para evitar que se cierre inmediatamente al ganar
      const clickTimeout = setTimeout(() => {
        if (!preventClose) {
          document.addEventListener('click', handleClickAnywhere);
        }
      }, 500);

      // Limpiar al desmontar
      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
        clearTimeout(clickTimeout);
        document.removeEventListener('click', handleClickAnywhere);
        window.removeEventListener('keydown', handleKeyPress);
      };
    }
  }, [winner, onClose, autoCloseTime, preventClose]); // ✅ Agregar preventClose a dependencias

  const handleClose = () => {
    if (!preventClose) {
      onClose();
    }
  };

  // ✅ Prevenir que clicks dentro del popup cierren el popup
  const handlePopupClick = (e) => {
    e.stopPropagation();
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
      onClick={handleClose} // ✅ Click en el overlay = cerrar (si no está prevenido)
    >
      <div 
        className="winner-popup-content"
        onClick={handleClose}// ✅ Click en el contenido = NO cerrar
      >
        
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
        </div>
      </div>
    </div>
  );
};

export default WinnerPopup;