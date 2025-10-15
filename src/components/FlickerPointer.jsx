import React, { useState, useEffect, useRef, memo } from 'react';
import { CONFIG } from '../constants/config';

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

  // Calcular posición exacta del puntero
  const pointerStyle = {
    position: 'absolute',
    top: '17%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 20,
    pointerEvents: 'none'
  };

  const pointerHeight = Math.max(wheelSize * 0.07, 15); // Altura proporcional

  return (
    <div style={pointerStyle}>
      <div className="relative flex flex-col items-center">
        {/* Base superior */}
        <div 
          className="w-12 h-12 bg-gradient-to-br from-gray-800 to-gray-900 rounded-full 
                     border-4 border-gray-600 shadow-2xl relative z-10
                     flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="w-5 h-5 bg-yellow-400 rounded-full shadow-inner animate-pulse"></div>
        </div>
        
        {/* Palito flexible - MUCHO MÁS CORTO */}
        <div 
          className="relative"
          style={{ 
            width: '6px',
            height: `${pointerHeight}px`,
            transformOrigin: 'top center',
            transform: `rotate(${bend}deg)`,
            transition: 'transform 0.05s ease-out'
          }}
          aria-hidden="true"
        >
          <div
            style={{ 
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, #991B1B 0%, #DC2626 30%, #EF4444 50%, #DC2626 70%, #991B1B 100%)',
              boxShadow: `
                0 2px 15px rgba(220, 38, 38, 0.8),
                inset 1px 0 2px rgba(255, 255, 255, 0.3),
                inset -1px 0 2px rgba(0, 0, 0, 0.3)
              `,
              borderRadius: '3px 3px 6px 6px',
              border: '1px solid #7F1D1D'
            }}
          />
          
          {/* Punta del palito - MÁS GRANDE Y VISIBLE */}
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2
                       w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-full 
                       border-4 border-red-800 shadow-2xl"
            style={{
              boxShadow: `
                0 4px 20px rgba(220, 38, 38, 0.9),
                0 0 25px rgba(220, 38, 38, 0.6),
                inset 2px 2px 4px rgba(255, 255, 255, 0.2)
              `,
              animation: 'glow 2s ease-in-out infinite alternate'
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes glow {
          from {
            box-shadow: 
              0 4px 20px rgba(220, 38, 38, 0.9),
              0 0 25px rgba(220, 38, 38, 0.6),
              inset 2px 2px 4px rgba(255, 255, 255, 0.2);
          }
          to {
            box-shadow: 
              0 4px 25px rgba(220, 38, 38, 1),
              0 0 35px rgba(220, 38, 38, 0.8),
              inset 2px 2px 4px rgba(255, 255, 255, 0.3);
          }
        }
      `}</style>
    </div>
  );
});

FlickerPointer.displayName = 'FlickerPointer';

export default FlickerPointer;