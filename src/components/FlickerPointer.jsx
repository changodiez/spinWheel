import React, { useState, useEffect, useRef, memo } from 'react';
import { CONFIG } from '../constants/config';
import './FlickerPointer.css';

const FlickerPointer = memo(({ angle, prizes, wheelSize, velocity = 0 }) => {
  const [bend, setBend] = useState(0);
  const lastAngleRef = useRef(null);
  const velocityRef = useRef(0);
  const lastSliceRef = useRef(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (prizes.length === 0) return;

    const sliceAngle = (Math.PI * 2) / prizes.length;
    // Normalizar ángulo a rango [0, 2π)
    const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    
    // El pointer está fijo en la parte superior (3π/2)
    // La rueda se rota con angle
    // Para calcular qué segmento está bajo el pointer: relativeAngle = (3π/2 - normalizedAngle) % (2π)
    const pointerAngle = Math.PI * 1.5; // 3π/2
    const relativeAngle = ((pointerAngle - normalizedAngle) + Math.PI * 2) % (Math.PI * 2);
    const currentSlice = Math.floor(relativeAngle / sliceAngle) % prizes.length;
    
    // Inicializar en el primer render
    if (!isInitializedRef.current || lastSliceRef.current === null || lastAngleRef.current === null) {
      lastSliceRef.current = currentSlice;
      lastAngleRef.current = normalizedAngle;
      isInitializedRef.current = true;
      return;
    }
    
    // Detectar cuando cruza un borde de premio
    if (currentSlice !== lastSliceRef.current) {
      // Calcular la diferencia de ángulo normalizada
      // Manejar el wrap-around correctamente
      let angleDiff = normalizedAngle - lastAngleRef.current;
      
      // Normalizar la diferencia para manejar el wrap-around
      if (angleDiff > Math.PI) {
        angleDiff -= Math.PI * 2;
      } else if (angleDiff < -Math.PI) {
        angleDiff += Math.PI * 2;
      }
      
      // La dirección determina hacia qué lado debe doblarse el pointer
      const direction = Math.sign(angleDiff);
      
      // Calcular intensidad basada en la velocidad
      const intensity = Math.min(Math.abs(velocity) * 0.8, CONFIG.POINTER.BEND_INTENSITY);
      
      // Aplicar el bend en la dirección opuesta al movimiento
      setBend(-direction * intensity);
      velocityRef.current = -direction * intensity;
    }
    
    lastAngleRef.current = normalizedAngle;
    lastSliceRef.current = currentSlice;
  }, [angle, prizes.length, velocity]);

  // Efecto para el retorno suave a la posición neutral
  useEffect(() => {
    if (bend === 0) return;

    const interval = setInterval(() => {
      setBend(prev => {
        // Suavizar el retorno usando un factor de amortiguación
        const damping = 0.85;
        const newBend = prev * damping;
        
        // Volver a posición neutral cuando sea suficientemente pequeño
        if (Math.abs(newBend) < 0.1) return 0;
        return newBend;
      });
    }, CONFIG.POINTER.ANIMATION_INTERVAL);
    
    return () => clearInterval(interval);
  }, [bend]);
  
  // Calcular todos los tamaños proporcionales a la rueda (3% + 5% más grande)
  const pointerWidth = wheelSize * 0.2163; // 0.20 * 1.03 * 1.05 = 0.2163
  const pointerHeight = wheelSize * 0.162225; // 0.15 * 1.03 * 1.05 = 0.162225

  const pointerStyle = {
    position: 'absolute',
    top: '-65px', // 35px más arriba
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 20,
    pointerEvents: 'none'
  };

  return (
    <div style={pointerStyle}>
      <div 
        className="pointer-tip-wrapper"
        style={{ 
          '--pointer-width': `${pointerWidth}px`,
          '--pointer-height': `${pointerHeight}px`,
          transform: `rotate(${bend}deg)`
        }}
      >
        <div 
  className="pointer-tip-wrapper"
  style={{ 
    '--pointer-width': `${pointerWidth}px`,
    '--pointer-height': `${pointerHeight}px`,
    transform: `rotate(${bend}deg)` // igual que antes
  }}
>
  <svg className="pointer-tip" viewBox="0 0 100 100" aria-hidden="true">
    <defs>
      {/* Filtro de neón rosa/magenta */}
      <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      {/* Filtro de neón más intenso para el borde */}
      <filter id="neonGlowStrong" x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
        <feGaussianBlur stdDeviation="2" result="coloredBlur2"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="coloredBlur2"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>

    {/* Capas de neón para el triángulo */}
    <path
      d="M50 92 L14 18 H86 Z"
      fill="var(--pointer-fill, #ff22cf)"
      stroke="rgba(255, 34, 207, 0.8)"
      strokeWidth="10"
      strokeLinejoin="round"
      filter="url(#neonGlowStrong)"
      opacity="0.6"
    />
    <path
      d="M50 92 L14 18 H86 Z"
      fill="var(--pointer-fill, #ff22cf)"
      stroke="rgba(255, 34, 207, 0.9)"
      strokeWidth="8"
      strokeLinejoin="round"
      filter="url(#neonGlow)"
      opacity="0.8"
    />
    {/* Triángulo principal */}
    <path
      d="M50 92 L14 18 H86 Z"
      fill="var(--pointer-fill, #ff22cf)"
      stroke="#ffffff"
      strokeWidth="8"
      strokeLinejoin="round"
      filter="url(#neonGlow)"
    />
  </svg>
</div>
      </div>
    </div>
  );
});

FlickerPointer.displayName = 'FlickerPointer';

export default FlickerPointer;