import React, { useRef, useEffect, memo, useState } from 'react';
import { generateColor } from '../utils/wheelCalculations';
import { CONFIG } from '../constants/config';
import ToteIcon from '../assets/img/Tote@2x.png';
import CamisetaIcon from '../assets/img/Camiseta@2x.png';
import GorraIcon from '../assets/img/Gorra@2x.png';
import MugIcon from '../assets/img/Taza@2x.png';
import PinIcon from '../assets/img/Pin@2x.png';
import PatchIcon from '../assets/img/Pegatina@2x.png';
import CalcetinIcon from '../assets/img/Calcetin@2x.png';
import LuggageIcon from '../assets/img/Maleta@2x.png';
import QRWalletIcon from '../assets/img/PeraWallet@2x.png';
import QRExtraIcon from '../assets/img/Tattoo@2x.png';
import LanyardIcon from '../assets/img/Lanyard@2x.png';

import centerWheel from '../assets/img/centerWheel.png';

const ICON_SOURCES = {
  'Tote Bag': ToteIcon,
  Camiseta: CamisetaIcon,
  Gorra: GorraIcon,
  Mug: MugIcon,
  Pin: PinIcon,
  Patch: PatchIcon,
  'Calcetín': CalcetinIcon,
  'Luggage Tag': LuggageIcon,
  QR1: QRWalletIcon,
  QR2: QRWalletIcon,
  QR3: QRWalletIcon,
  Lanyard: LanyardIcon,
};

const WheelCanvas = memo(({ angle, prizes, winnerIndex, size }) => {
  const canvasRef = useRef(null);
  const [iconImages, setIconImages] = useState({});

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

    const outerRadius = radius + CONFIG.WHEEL.BORDER_WIDTH * 0.9;

    // Aro exterior
    ctx.beginPath();
    ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(8, 12, 40, 0.9)';
    ctx.fill();

    ctx.lineWidth = CONFIG.WHEEL.BORDER_WIDTH * 0.75;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = 'rgba(110, 168, 255, 0.85)';
    ctx.shadowBlur = 24;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Base oscura debajo de segmentos
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = '#050720';
    ctx.fill();

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
      ctx.strokeStyle = CONFIG.WHEEL.COLORS.BORDER;
      ctx.lineWidth = 3;
      ctx.stroke();

      // Línea divisoria
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(startAngle) * radius, Math.sin(startAngle) * radius);
      ctx.strokeStyle = CONFIG.WHEEL.COLORS.BORDER;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Texto del premio
      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.translate(radius * 0.58, 0);
      ctx.rotate(Math.PI);

      const icon = iconImages[prize];
      if (icon && icon.complete) {
        const iconSize = Math.min(radius * 0.42, 140);
        ctx.drawImage(icon, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
      } else {
        const textColor = "#FFFFFF";
        const fontSize = 'bold 1.5rem';

        ctx.fillStyle = textColor;
        ctx.font = `${fontSize} 'Arial Black', sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowColor = "#000000";
        ctx.shadowBlur = 18;
        ctx.fillText(prize, 0, 0);
      }
      ctx.restore();
    });
/*
    // ✅ DIBUJAR CÍRCULOS EN LOS BORDES ENTRE PREMIOS - TONO BLANCO HUESO
prizes.forEach((_, index) => {
  const startAngle = index * sliceAngle;
  
  // Posición del círculo en el borde (al 85% del radio)
  const circleRadius = size * 0.013; // Radio del círculo (1.5% del tamaño)
  const circleDistance = radius * 1.01; // Distancia desde el centro
  
  const circleX = Math.cos(startAngle) * circleDistance;
  const circleY = Math.sin(startAngle) * circleDistance;
  
  // Círculo exterior con efecto metálico blanco hueso
  ctx.beginPath();
  ctx.arc(circleX, circleY, circleRadius, 0, Math.PI * 2);
  
  // Gradiente para efecto metálico blanco hueso
  const gradient = ctx.createRadialGradient(
    circleX - circleRadius * 0.3, 
    circleY - circleRadius * 0.3, 
    0,
    circleX, 
    circleY, 
    circleRadius
  );
  
  // Tonos blanco hueso/metálico
  gradient.addColorStop(0, '#f8f6f0');    // Blanco hueso brillante
  gradient.addColorStop(0.4, '#e8e6d9');  // Blanco hueso medio
  gradient.addColorStop(0.7, '#d6d4c8');  // Blanco hueso oscuro
  gradient.addColorStop(1, '#b8b5a8');    // Gris hueso
  
  ctx.fillStyle = gradient;
  ctx.fill();
  
  // Borde sutil del círculo
  ctx.strokeStyle = '#8a887e';
  ctx.lineWidth = 0.8;
  ctx.stroke();
  
  // Punto de highlight para efecto 3D más suave
  ctx.beginPath();
  ctx.arc(
    circleX - circleRadius * 0.15, 
    circleY - circleRadius * 0.15, 
    circleRadius * 0.35, 
    0, 
    Math.PI * 2
  );
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.fill();
  
  // Sombra sutil para profundidad
  ctx.beginPath();
  ctx.arc(
    circleX + circleRadius * 0.1, 
    circleY + circleRadius * 0.1, 
    circleRadius * 0.25, 
    0, 
    Math.PI * 2
  );
  ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
  ctx.fill();
  
  // Efecto de brillo adicional en el centro
  ctx.beginPath();
  ctx.arc(
    circleX - circleRadius * 0.1, 
    circleY - circleRadius * 0.1, 
    circleRadius * 0.2, 
    0, 
    Math.PI * 2
  );
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.fill();
});*/

    // Centro de la rueda
    const hubRadius = Math.max(size * 0.065, 32);
    const hubGradient = ctx.createRadialGradient(0, 0, hubRadius * 0.2, 0, 0, hubRadius);
    hubGradient.addColorStop(0, '#39b4ff');
    hubGradient.addColorStop(1, '#0b1fff');

    ctx.beginPath();
    ctx.arc(0, 0, hubRadius, 0, Math.PI * 2);
    ctx.fillStyle = hubGradient;
    ctx.fill();
    
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.shadowColor = 'rgba(110, 168, 255, 0.75)';
    ctx.shadowBlur = 18;
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.restore();
  }, [angle, prizes, winnerIndex, size, iconImages]);

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