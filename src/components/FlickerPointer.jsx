import React, { useState, useEffect, useRef, memo } from 'react';
import { CONFIG } from '../constants/config';
import './FlickerPointer.css';

const FlickerPointer = memo(({ angle, prizes, wheelSize, velocity = 0 }) => {
  const [bend, setBend] = useState(0);
  const lastAngleRef = useRef(0);
  const velocityRef = useRef(0);

  useEffect(() => {
    const sliceAngle = (Math.PI * 2) / prizes.length;
    const normalizedAngle = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const lastNormalized = ((lastAngleRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    
    // Detectar cuando cruza un borde de premio
    const currentSlice = Math.floor(normalizedAngle / sliceAngle);
    const lastSlice = Math.floor(lastNormalized / sliceAngle);
    
    if (currentSlice !== lastSlice) {
      // Calcular intensidad basada en la velocidad
      const intensity = Math.min(Math.abs(velocity) * 0.5, CONFIG.POINTER.BEND_INTENSITY);
      setBend(-intensity);
      velocityRef.current = -intensity;
    }
    
    lastAngleRef.current = angle;
  }, [angle, prizes.length, velocity]);

  useEffect(() => {
    if (bend === 0) return;

    const interval = setInterval(() => {
      setBend(prev => {
        const newBend = prev + Math.abs(velocityRef.current) * 0.08 * Math.sign(velocityRef.current);
        velocityRef.current *= CONFIG.POINTER.DAMPING;
        
        // Volver a posición neutral
        if (Math.abs(newBend) < 0.5) return 0;
        return newBend;
      });
    }, CONFIG.POINTER.ANIMATION_INTERVAL);
    
    return () => clearInterval(interval);
  }, [bend]);

  // Calcular posición y tamaño proporcional
  const pointerStyle = {
    position: 'absolute',
    top: '6%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 20,
    pointerEvents: 'none'
  };

  const pointerHeight = 50;

  return (
    <div style={pointerStyle}>
      <div className="pointer-container">
        {/* Base decorativa */}
        <div className="pointer-base">
          <div className="base-glow"></div>
          <div className="base-center"></div>
        </div>
        
        {/* Brazo de la flecha - TODO JUNTO PARA QUE SE MUEVA */}
        <div 
          className="pointer-arm-container"
          style={{ 
            transform: `rotate(${bend}deg)`,
          }}
        >
          {/* Brazo */}
          <div 
            className="pointer-arm"
            style={{ height: `${pointerHeight}px` }}
          >
     
          </div>
          
          {/* Cabeza de la flecha - CORREGIDA (apuntando hacia la rueda) */}
          <div className="arrow-head">
            <div className="arrow-main">
              <div className="arrow-glow"></div>
            </div>
            <div className="arrow-tip"></div>
            <div className="arrow-highlight"></div>
          </div>
        </div>

       
      </div>
    </div>
  );
});

FlickerPointer.displayName = 'FlickerPointer';

export default FlickerPointer;