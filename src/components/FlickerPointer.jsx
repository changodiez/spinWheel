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

  const pointerHeight = (wheelSize / 2) - 15;

  return (
    <div 
      className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none z-20"
      style={{ marginTop: '-25px' }}
      role="presentation"
    >
      <div className="relative flex flex-col items-center">
        {/* Base superior */}
        <div 
          className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-950 rounded-full 
                     border-4 border-gray-600 shadow-xl relative z-10
                     flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-inner"></div>
        </div>
        
        {/* Palito flexible */}
        <div 
          className="relative"
          style={{ 
            width: '5px',
            height: `${pointerHeight}px`,
            transformOrigin: 'top center',
            transform: `rotate(${bend}deg)`,
            transition: 'transform 0.1s ease-out'
          }}
          aria-hidden="true"
        >
          <div
            style={{ 
              width: '100%',
              height: '100%',
              background: 'linear-gradient(180deg, #991B1B 0%, #DC2626 30%, #EF4444 50%, #DC2626 70%, #991B1B 100%)',
              boxShadow: '0 2px 10px rgba(220, 38, 38, 0.6), inset 1px 0 2px rgba(255, 255, 255, 0.2)',
              borderRadius: '2px 2px 4px 4px'
            }}
          />
          
          {/* Punta del palito */}
          <div 
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2
                       w-6 h-6 bg-gradient-to-br from-red-500 to-red-700 rounded-full 
                       border-3 border-red-900 shadow-xl"
            style={{
              boxShadow: '0 3px 8px rgba(0, 0, 0, 0.5), 0 0 15px rgba(220, 38, 38, 0.8)'
            }}
          />
        </div>
      </div>
    </div>
  );
});

FlickerPointer.displayName = 'FlickerPointer';

export default FlickerPointer;