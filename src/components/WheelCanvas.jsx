import React, { useRef, useEffect, memo } from 'react';
import { generateColor } from '../utils/wheelCalculations';
import { CONFIG } from '../constants/config';

const WheelCanvas = memo(({ angle, prizes, winnerIndex, size }) => {
  const canvasRef = useRef(null);

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

    // Dibujar fondo de la rueda
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.WHEEL.COLORS.BASE;
    ctx.fill();

    ctx.save();
    ctx.translate(centerX, centerY);
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
      ctx.translate(radius * 0.65, 0);
      ctx.rotate(Math.PI );
      
      // Color del texto - SIEMPRE BLANCO para mejor contraste
      const textColor = "#FFFFFF";
      
 
      const fontSize = 'bold 1.1rem';
      const winnerFontSize = 'bold 1.5rem';
      
      ctx.fillStyle = textColor;
      ctx.font = isWinner ? `${winnerFontSize} 'Arial Black', sans-serif` : `${fontSize} 'Arial Black', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 15; // Aumentar sombra para mejor legibilidad
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      const maxTextWidth = radius * 0.9;
      let currentFont = ctx.font;
      let metrics = ctx.measureText(prize);
      
      // Verificar si es un premio QR
      const isQR = prize.startsWith('QR');
      
      // Ajustar tamaño de fuente si es necesario
      if (metrics.width > maxTextWidth) {
        const smallerFontSize = isQR ? "bold 14px" : "bold 12px";
        const smallerWinnerFontSize = isQR ? "bold 16px" : "bold 14px";
        currentFont = isWinner ? `${smallerWinnerFontSize} 'Arial Black', sans-serif` : `${smallerFontSize} 'Arial Black', sans-serif`;
        ctx.font = currentFont;
      }
      
      ctx.fillText(prize, 0, 0);
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
    ctx.beginPath();
    ctx.arc(0, 0, 30, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.WHEEL.COLORS.BASE;
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, 35, 0, Math.PI * 2);
    ctx.fillStyle = CONFIG.WHEEL.COLORS.CENTER;
    ctx.fill();
    
    ctx.strokeStyle = CONFIG.WHEEL.COLORS.BORDER;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }, [angle, prizes, winnerIndex, size]);

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