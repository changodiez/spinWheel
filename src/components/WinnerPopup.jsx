import React, { useEffect, useRef, useState } from 'react';
import './WinnerPopup.css';

import ToteIcon from '../assets/img/Tote@2x.png';
import CamisetaIcon from '../assets/img/Camiseta@2x.png';
import GorraIcon from '../assets/img/Gorra@2x.png';
import MugIcon from '../assets/img/Taza@2x.png';
import PinIcon from '../assets/img/Pin@2x.png';
import PatchIcon from '../assets/img/Pegatina@2x.png';
import CalcetinIcon from '../assets/img/Calcetin@2x.png';
import LuggageIcon from '../assets/img/Maleta@2x.png';
import QRWalletIcon from '../assets/img/PeraWallet@2x.png';
import TatooIcon from '../assets/img/Tattoo@2x.png';
import LanyardIcon from '../assets/img/Lanyard@2x.png';

const PRIZE_IMAGES  = {
  'Tote':        { type: "image", src: ToteIcon },
  'T-Shirt':     { type: "image", src: CamisetaIcon },
  'Cool Cap':    { type: "image", src: GorraIcon },
  'Mug':         { type: "image", src: MugIcon },
  'Pin':         { type: "image", src: PinIcon },
  'Sticker':     { type: "image", src: PatchIcon },
  'Socks':       { type: "image", src: CalcetinIcon },
  'Label':       { type: "image", src: LuggageIcon },
  'Tattoo':      { type: "image", src: TatooIcon },
  'PeraWallet':  { type: "image", src: QRWalletIcon },
  'Lanyard':     { type: "image", src: LanyardIcon },
};

const WinnerPopup = ({ winner, onClose, autoCloseTime = 10000 }) => {
  const dialogRef = useRef(null);
  const timerRef = useRef(null);
  const [preventClose, setPreventClose] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!winner) return;

    const handleKeyPress = (e) => {
      if (e.key === 'w' || e.key === 'W') setPreventClose(prev => !prev);
    };
    window.addEventListener('keydown', handleKeyPress);

    if (!preventClose) {
      timerRef.current = setTimeout(() => handleClose(), autoCloseTime);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [winner, autoCloseTime, preventClose]);

  const handleClose = () => {
    if (preventClose || isClosing) return;
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 400);
  };

  if (!winner) return null;

  const entry = PRIZE_IMAGES[winner.prize];
  const prizeSrc = typeof entry === 'string' ? entry : entry?.src;

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
      <div className="winner-popup-content" onClick={handleClose}>
        <div className="popup-inner">
          <h1 id="winner-title" className="popup-title">YOU WIN</h1>

          <div className="prize-image-container">
            <div className="prize-image" role="img" aria-label={winner.prize}>
              {prizeSrc ? (
                <img
                  src={prizeSrc}
                  alt={winner.prize}
                  className="winner-icon"
                  draggable="false"
                />
              ) : (
                <span role="img" aria-label="gift">?</span>
              )}
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
