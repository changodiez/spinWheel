import React, { useState, useEffect, useCallback } from 'react';
import './ReferenceOverlay.css';

const ReferenceOverlay = ({ imagePath }) => {
  const [visible, setVisible] = useState(false);
  const [opacity, setOpacity] = useState(0.5);
  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);

  // Ajustes con teclado cuando el overlay está visible
  useEffect(() => {
    if (!visible) return;

    const handleKeyPress = (e) => {
      // Prevenir ajustes si se está escribiendo en un input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.key) {
        case 'ArrowUp':
          e.preventDefault();
          setOffsetY(prev => prev - 5);
          break;
        case 'ArrowDown':
          e.preventDefault();
          setOffsetY(prev => prev + 5);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setOffsetX(prev => prev - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          setOffsetX(prev => prev + 5);
          break;
        case '+':
        case '=':
          e.preventDefault();
          setScale(prev => Math.min(2, prev + 0.05));
          break;
        case '-':
        case '_':
          e.preventDefault();
          setScale(prev => Math.max(0.5, prev - 0.05));
          break;
        case '[':
          e.preventDefault();
          setOpacity(prev => Math.max(0.1, prev - 0.05));
          break;
        case ']':
          e.preventDefault();
          setOpacity(prev => Math.min(1, prev + 0.05));
          break;
        case 'r':
        case 'R':
          e.preventDefault();
          setOpacity(0.5);
          setScale(1);
          setOffsetX(0);
          setOffsetY(0);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [visible]);

  // Toggle con 'b'
  useEffect(() => {
    const handleToggle = (e) => {
      if (e.key === 'b' || e.key === 'B') {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        setVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleToggle);
    return () => {
      window.removeEventListener('keydown', handleToggle);
    };
  }, []);

  if (!visible) return null;
  if (!imagePath) {
    return (
      <div className="reference-overlay reference-overlay-no-image">
        <div className="reference-controls">
          <div className="control-info">
            <p><strong>⚠️ No hay imagen de referencia</strong></p>
            <p>Agrega la ruta de la imagen en SpinWheelAlgoland.jsx</p>
            <p><strong>B</strong> - Ocultar/Mostrar este mensaje</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="reference-overlay"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none'
      }}
    >
      <img 
        src={imagePath} 
        alt="Reference design" 
        className="reference-image"
        style={{
          opacity,
          transform: `scale(${scale}) translate(${offsetX}px, ${offsetY}px)`
        }}
      />
      <div className="reference-controls">
        <div className="control-info">
          <p><strong>B</strong> - Ocultar/Mostrar</p>
          <p><strong>Flechas</strong> - Mover (↑↓←→)</p>
          <p><strong>+/-</strong> - Escala</p>
          <p><strong>[/]</strong> - Opacidad</p>
          <p><strong>R</strong> - Reset</p>
          <hr />
          <p>Opacidad: {Math.round(opacity * 100)}%</p>
          <p>Escala: {Math.round(scale * 100)}%</p>
          <p>Offset: X={offsetX}px, Y={offsetY}px</p>
        </div>
        <div className="control-buttons">
          <button onClick={() => setOpacity(prev => Math.max(0.1, prev - 0.05))}>[ - Opacidad</button>
          <button onClick={() => setOpacity(prev => Math.min(1, prev + 0.05))}>] + Opacidad</button>
          <button onClick={() => setScale(prev => Math.max(0.5, prev - 0.05))}>- Escala</button>
          <button onClick={() => setScale(prev => Math.min(2, prev + 0.05))}>+ Escala</button>
          <button onClick={() => setOffsetX(prev => prev - 5)}>← X</button>
          <button onClick={() => setOffsetX(prev => prev + 5)}>X →</button>
          <button onClick={() => setOffsetY(prev => prev - 5)}>↑ Y</button>
          <button onClick={() => setOffsetY(prev => prev + 5)}>Y ↓</button>
          <button onClick={() => { setOpacity(0.5); setScale(1); setOffsetX(0); setOffsetY(0); }}>Reset (R)</button>
        </div>
      </div>
    </div>
  );
};

export default ReferenceOverlay;

