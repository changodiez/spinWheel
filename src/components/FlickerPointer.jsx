import React, { useState, useEffect, useRef, memo } from 'react';
import { CONFIG } from '../constants/config';
import './FlickerPointer.css';

const FlickerPointer = memo(({ angle, prizes, wheelSize, velocity = 0 }) => {
  const [bend, setBend] = useState(0);
  const lastAngleRef = useRef(0);
  const velocityRef = useRef(0);
  const lastSliceRef = useRef(0);

  useEffect(() => {
    if (prizes.length === 0) return;

    const sliceAngle = (Math.PI * 2) / prizes.length;
    const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    
    // Calcular el índice del premio actual
    const currentSlice = Math.floor(normalizedAngle / sliceAngle);
    
    // Detectar cuando cruza un borde de premio
    if (currentSlice !== lastSliceRef.current) {
      // Calcular la dirección del movimiento
      const angleDiff = normalizedAngle - lastAngleRef.current;
      
      // Normalizar la diferencia de ángulo para detectar correctamente la dirección
      let normalizedDiff = angleDiff;
      if (Math.abs(angleDiff) > Math.PI) {
        normalizedDiff = angleDiff - (Math.PI * 2 * Math.sign(angleDiff));
      }
      
      // La dirección determina hacia qué lado debe doblarse el pointer
      const direction = Math.sign(normalizedDiff);
      
      // Calcular intensidad basada en la velocidad
      const intensity = Math.min(Math.abs(velocity) * 0.8, CONFIG.POINTER.BEND_INTENSITY);
      
      // Aplicar el bend en la dirección opuesta al movimiento
      setBend(-direction * intensity);
      velocityRef.current = -direction * intensity;
      
      console.log(`Cruzó borde: slice ${lastSliceRef.current} -> ${currentSlice}, dirección: ${direction}, intensidad: ${intensity}`);
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
  
  // Calcular todos los tamaños proporcionales a la rueda
  const pointerWidth = wheelSize * 0.20;
  const pointerHeight = wheelSize * 0.15;

  const pointerStyle = {
    position: 'absolute',
    top: '0',
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


    {/* Triángulo invertido (apunta hacia abajo) */}
    <path
      d="M50 92 L14 18 H86 Z"
      fill="var(--pointer-fill, #ff22cf)"
      stroke="#ffffff"
      strokeWidth="10"
      strokeLinejoin="round"
      filter="url(#glow)"
    />
  </svg>
</div>
      </div>
    </div>
  );
});

FlickerPointer.displayName = 'FlickerPointer';

export default FlickerPointer;