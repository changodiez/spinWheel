import React, { useRef, useEffect, memo, useState } from 'react';
import { generateColor } from '../utils/wheelCalculations';
import { CONFIG } from '../constants/config';
import ToteIcon from '../assets/img/EXPORT EFECTOS/Iconos Negro efecto/Tote@2x.png';
import CamisetaIcon from '../assets/img/EXPORT EFECTOS/Iconos Negro efecto/Camiseta@2x.png';
import GorraIcon from '../assets/img/EXPORT EFECTOS/Iconos Negro efecto/Gorra@2x.png';
import MugIcon from '../assets/img/EXPORT EFECTOS/Iconos Negro efecto/Taza@2x.png';
import PinIcon from '../assets/img/EXPORT EFECTOS/Iconos Negro efecto/Pin@2x.png';
import PatchIcon from '../assets/img/EXPORT EFECTOS/Iconos Negro efecto/Pegatina@2x.png';
import CalcetinIcon from '../assets/img/EXPORT EFECTOS/Iconos Negro efecto/Calcetin@2x.png';
import LuggageIcon from '../assets/img/EXPORT EFECTOS/Iconos Negro efecto/Maleta@2x.png';
import QRWalletIcon from '../assets/img/EXPORT EFECTOS/Iconos Negro efecto/PeraWallet@2x.png';
import TatooIcon from '../assets/img/EXPORT EFECTOS/Iconos Negro efecto/Tattoo@2x.png';
import LanyardIcon from '../assets/img/EXPORT EFECTOS/Iconos Negro efecto/Lanyard@2x.png';

import centerWheel from '../assets/img/centerWheel.png';



const ICON_SOURCES = {
  'Tote': ToteIcon,
  'T-Shirt': CamisetaIcon,
  'Cool Cap': GorraIcon,
  Mug: MugIcon,
  Pin: PinIcon,
  Sticker: PatchIcon,
  'Socks': CalcetinIcon,
  Label: LuggageIcon,
  Tattoo: TatooIcon,
  PeraWallet: QRWalletIcon,
  Lanyard: LanyardIcon,
};

const WheelCanvas = memo(({ angle, prizes, winnerIndex, size }) => {
  const canvasRef = useRef(null);
  const [iconImages, setIconImages] = useState({});

  const [centerImg, setCenterImg] = useState(null);

  useEffect(() => {
    const img = new Image();
    img.src = centerWheel;
    img.onload = () => setCenterImg(img);
  }, []);


  useEffect(() => {
    let isMounted = true;
    const entries = Object.entries(ICON_SOURCES);

    Promise.all(
      entries.map(([key, src]) => new Promise(resolve => {
        const img = new Image();
        img.src = src;
        img.onload = () => resolve([key, img]);
        img.onerror = () => resolve([key, null]);
      }))
    ).then(results => {
      if (isMounted) {
        setIconImages(Object.fromEntries(results));
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !prizes?.length) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    // Configurar canvas para alta resolución
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - CONFIG.WHEEL.BORDER_WIDTH;

    // Limpiar canvas
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(centerX, centerY);

    const outerRadius = radius + CONFIG.WHEEL.BORDER_WIDTH * 0.75;

    // Aro exterior con efecto neón
    ctx.save();
    
    // Primera capa de neón (más externa y difusa)
    ctx.shadowBlur = 30;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.lineWidth = CONFIG.WHEEL.BORDER_WIDTH * 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    
    // Segunda capa de neón (intermedia)
    ctx.shadowBlur = 20;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Tercera capa de neón (más cercana al borde)
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(255, 255, 255, 1)';
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Borde principal (sin sombra para que sea nítido)
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.lineWidth = CONFIG.WHEEL.BORDER_WIDTH * 0.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    
    ctx.restore();
   

    ctx.rotate(angle);

    const sliceAngle = (Math.PI * 2) / prizes.length;

    // Dibujar segmentos
    prizes.forEach((prize, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const isWinner = index === winnerIndex;

      // Color del segmento
      const segmentColor = generateColor(index, prizes.length, prize);

      // Segmento principal
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      if (isWinner) {
        ctx.fillStyle = CONFIG.WHEEL.COLORS.WINNER_GLOW;
        ctx.shadowColor = CONFIG.WHEEL.COLORS.WINNER_GLOW;
        ctx.shadowBlur = 20;
      } else {
        ctx.fillStyle = segmentColor;
        ctx.shadowBlur = 0;
      }

      ctx.fill();
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 2;
      ctx.stroke();



      // Texto / icono
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);  
      ctx.translate(radius * 0.87, 0);          
      ctx.rotate(Math.PI / 2);                 

      const icon = iconImages[prize];
      if (icon && icon.complete) {
        const iconSize = Math.min(radius * 0.35, 150);
        ctx.drawImage(icon, -iconSize / 2, 2, iconSize, iconSize);
      } else {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 18;
        ctx.fillText(prize, 0, 0);
      }
      ctx.restore();

    });

    ctx.restore();

    // Centro de la rueda
    const hubRadius = Math.max(size * 0.08, 32);

    // imagen centrada y recortada en círculo
    if (centerImg) {
      ctx.save();
      ctx.translate(centerX, centerY);   
      ctx.beginPath();
      ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
      ctx.clip();

      const maxSide = Math.max(centerImg.width, centerImg.height);
      const scale = ((hubRadius - 2) * 2) / maxSide; // margen
      const w = centerImg.width * scale;
      const h = centerImg.height * scale;
      ctx.drawImage(centerImg, -w / 2, -h / 2, w, h);
    
    }
  ctx.restore();

  }, [angle, prizes, winnerIndex, size, iconImages, centerImg]);

  return (
    <canvas
      ref={canvasRef}
      className="wheel-canvas"
      aria-label="Ruleta de premios giratoria"
      role="img"
    />
  );
});

WheelCanvas.displayName = 'WheelCanvas';

export default WheelCanvas;