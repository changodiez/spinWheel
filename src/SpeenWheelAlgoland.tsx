import React, { useRef, useState, useEffect } from "react";
import prizes from './assets/prizes.json'


// Constantes configurables
const CONFIG = {
  FRICTION: 0.8,
  STOP_THRESHOLD: 0.8,
  MIN_VELOCITY: 8,
  MAX_VELOCITY: 20,
  ARROW_WIDTH: 40,
  ARROW_HEIGHT: 25,
  TICK_INTERVAL: 0.15 // Cada cuántos radianes hacer "tick"
};

// Función para generar colores dinámicamente
const generateColor = (index, total) => {
  const hue = (index / total) * 360;
  return `hsl(${hue}, 70%, 60%)`;
};

// Hook para efectos de sonido
const useSoundEffects = () => {
  const audioContextRef = useRef(null);
  
  useEffect(() => {
    audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const playTick = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'square';
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  };

  const playWin = () => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    // Secuencia de notas para fanfarria
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C, E, G, C alto
    const duration = 0.15;
    
    notes.forEach((freq, i) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      const startTime = ctx.currentTime + i * duration;
      gainNode.gain.setValueAtTime(0.2, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    });
  };

  return { playTick, playWin };
};

// Hook personalizado para la animación CORREGIDO
const useWheelAnimation = (prizes) => {
  const [angle, setAngle] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner, setWinner] = useState(null);
  const requestRef = useRef();
  const lastTimeRef = useRef();
  const lastTickAngleRef = useRef(0);
  const { playTick, playWin } = useSoundEffects();

  useEffect(() => {
    if (!spinning) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
        lastTimeRef.current = null;
      }
      return;
    }

    function animate(time) {
      if (!spinning) {
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
          lastTimeRef.current = null;
        }
        return;
      }

      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
        requestRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;
      
      const safeDeltaTime = Math.min(deltaTime, 0.033);
      
      const newAngle = angle - velocity * safeDeltaTime;
      const newVelocity = velocity * (1 - safeDeltaTime * CONFIG.FRICTION);

      // Reproducir tick sound cuando cruza un premio
      const angleDiff = Math.abs(newAngle - lastTickAngleRef.current);
      if (angleDiff > CONFIG.TICK_INTERVAL) {
        playTick();
        lastTickAngleRef.current = newAngle;
      }

      setAngle(newAngle);
      setVelocity(newVelocity);

      if (Math.abs(newVelocity) < CONFIG.STOP_THRESHOLD) {
        setSpinning(false);
        
        // CÁLCULO CORREGIDO del ganador
        const normalizedAngle = ((newAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const slice = (Math.PI * 2) / prizes.length;
        const arrowAngle = Math.PI * 1.5; // 270° (apunta arriba)
        const relativeAngle = ((arrowAngle - normalizedAngle) + Math.PI * 2) % (Math.PI * 2);
        let winnerIndex = Math.floor(relativeAngle / slice) % prizes.length;
        
        if (winnerIndex < 0) winnerIndex += prizes.length;
        
        setWinner({
          prize: prizes[winnerIndex],
          index: winnerIndex
        });
        
        playWin();
        
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
          requestRef.current = null;
          lastTimeRef.current = null;
        }
        return;
      }
      
      requestRef.current = requestAnimationFrame(animate);
    }

    requestRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      lastTimeRef.current = null;
    };
  }, [spinning, velocity, angle, prizes, playTick, playWin]);

  const startSpin = () => {
    if (spinning) return;
    
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
      requestRef.current = null;
    }
    lastTimeRef.current = null;
    lastTickAngleRef.current = angle;
    
    setWinner(null);
    let randomVelocity = CONFIG.MIN_VELOCITY + Math.random() * (CONFIG.MAX_VELOCITY - CONFIG.MIN_VELOCITY);
    randomVelocity = Math.min(randomVelocity, CONFIG.MAX_VELOCITY) * -1;
    setVelocity(randomVelocity);
    setSpinning(true);
  };

  return { angle, spinning, winner, startSpin };
};

// Componente para dibujar la rueda
const WheelCanvas = ({ angle, prizes, winnerIndex, size }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !prizes || prizes.length === 0) return;

    const ctx = canvas.getContext("2d");
    canvas.width = size;
    canvas.height = size;
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 20;

    ctx.clearRect(0, 0, size, size);

    // Fondo circular de la rueda
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
    ctx.fillStyle = "#8B4513";
    ctx.fill();

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);

    const sliceAngle = (Math.PI * 2) / prizes.length;

    prizes.forEach((prize, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;

      const isWinner = index === winnerIndex;
      
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      
      if (isWinner) {
        ctx.fillStyle = "#FFD700";
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 20;
      } else {
        ctx.fillStyle = generateColor(index, prizes.length);
        ctx.shadowBlur = 0;
      }
      
      ctx.fill();
      ctx.strokeStyle = "#C0C0C0";
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(startAngle) * radius, Math.sin(startAngle) * radius);
      ctx.strokeStyle = "#C0C0C0";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(startAngle + sliceAngle / 2);
      ctx.translate(radius * 0.7, 0);
      ctx.rotate(Math.PI / 2);
      
      ctx.fillStyle = isWinner ? "#000000" : "#FFFFFF";
      ctx.font = isWinner ? "bold 16px 'Arial Black', sans-serif" : "bold 14px 'Arial Black', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "#000000";
      ctx.shadowBlur = 3;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;
      
      const maxTextWidth = radius * 0.9;
      let text = prize;
      let metrics = ctx.measureText(text);
      
      if (metrics.width > maxTextWidth) {
        ctx.font = isWinner ? "bold 12px 'Arial Black', sans-serif" : "bold 11px 'Arial Black', sans-serif";
      }
      
      ctx.fillText(text, 0, 0);
      ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(0, 0, 25, 0, Math.PI * 2);
    ctx.fillStyle = "#8B4513";
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, 15, 0, Math.PI * 2);
    ctx.fillStyle = "#D4AF37";
    ctx.fill();
    
    ctx.strokeStyle = "#C0C0C0";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }, [angle, prizes, winnerIndex, size]);

  return <canvas ref={canvasRef} className="shadow-2xl" />;
};

// Componente del palito indicador con física
const FlickerPointer = ({ angle, prizes, wheelSize }) => {
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
      // Golpe! El palito se dobla hacia la IZQUIERDA (negativo) porque la ruleta empuja
      setBend(-18);
      velocityRef.current = -18;
    }
    
    lastAngleRef.current = angle;
  }, [angle, prizes]);

  useEffect(() => {
    if (bend !== 0) {
      const interval = setInterval(() => {
        setBend(prev => {
          const newBend = prev + Math.abs(velocityRef.current) * 0.08 * Math.sign(velocityRef.current);
          velocityRef.current *= 0.88;
          
          // Volver a 0
          if (Math.abs(newBend) < 0.5) return 0;
          return newBend;
        });
      }, 16);
      
      return () => clearInterval(interval);
    }
  }, [bend]);

  // Calcular la altura del palito basado en el tamaño de la rueda
  const pointerHeight = (wheelSize / 2) - 15; // Llega justo al borde de la rueda

  return (
    <div 
      className="absolute top-0 left-1/2 transform -translate-x-1/2 pointer-events-none z-20"
      style={{ 
        marginTop: '-25px'
      }}
    >
      <div className="relative flex flex-col items-center">
        {/* Base fija arriba */}
        <div className="w-10 h-10 bg-gradient-to-br from-gray-800 to-gray-950 rounded-full 
                       border-4 border-gray-600 shadow-xl relative z-10
                       flex items-center justify-center">
          <div className="w-4 h-4 bg-yellow-400 rounded-full shadow-inner"></div>
        </div>
        
        {/* Palito flexible apuntando hacia abajo */}
        <div 
          className="relative"
          style={{ 
            width: '5px',
            height: `${pointerHeight}px`,
            transformOrigin: 'top center',
            transform: `rotate(${bend}deg)`,
            transition: 'transform 0.1s ease-out'
          }}
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
          
          {/* Punta del palito - toca justo la ruleta */}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2
                         w-6 h-6 bg-gradient-to-br from-red-500 to-red-700 rounded-full 
                         border-3 border-red-900 shadow-xl"
               style={{
                 boxShadow: '0 3px 8px rgba(0, 0, 0, 0.5), 0 0 15px rgba(220, 38, 38, 0.8)'
               }}>
          </div>
        </div>
      </div>
    </div>
  );
};
const WinnerPopup = ({ winner, onClose }) => {
  if (!winner) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-labelledby="winner-title"
      aria-modal="true"
    >
      <div 
        className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 p-8 rounded-3xl max-w-md w-full mx-4 
                   shadow-2xl border-8 border-yellow-200 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div className="text-6xl mb-4 animate-spin-once">🎉</div>
          <h2 id="winner-title" className="text-4xl font-black text-gray-900 mb-4 tracking-wider">
            ¡FELICIDADES!
          </h2>
          <div className="bg-white rounded-2xl p-6 mb-6 shadow-inner">
            <p className="text-2xl text-gray-700 mb-2 font-semibold">Has ganado:</p>
            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {winner.prize}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full 
                     font-bold text-lg hover:scale-110 transform transition-all duration-200 
                     shadow-lg hover:shadow-xl"
            aria-label="Cerrar mensaje de premio"
          >
            ¡Genial! 🎊
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes bounce-in {
          0% { 
            transform: scale(0.3) translateY(-100px);
            opacity: 0;
          }
          50% { 
            transform: scale(1.05);
          }
          70% { 
            transform: scale(0.9);
          }
          100% { 
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes spin-once {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }
        
        .animate-spin-once {
          animation: spin-once 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};

// Componente principal
export default function SpinWheelAlgoland() {
  const [wheelSize, setWheelSize] = useState(500);
  const [showWinner, setShowWinner] = useState(false);
  const { angle, spinning, winner, startSpin } = useWheelAnimation(prizes);

  useEffect(() => {
    if (winner) {
      setShowWinner(true);
    }
  }, [winner]);

  useEffect(() => {
    const handleResize = () => {
      const size = Math.min(500, window.innerWidth - 40);
      setWheelSize(size);
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (!prizes || prizes.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="text-2xl text-white font-bold">No hay premios disponibles</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900 p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold text-yellow-400 mb-2 tracking-wider 
                      [text-shadow:_0_2px_10px_rgba(255_255_0_/_50%)]">
          WHEEL OF
        </h1>
        <h1 className="text-5xl md:text-7xl font-bold text-yellow-400 mb-4 tracking-wider
                      [text-shadow:_0_2px_15px_rgba(255_255_0_/_60%)]">
          FORTUNE!
        </h1>
        <div className="w-32 h-1 bg-yellow-400 mx-auto mb-6 
                      [box-shadow:_0_0_10px_rgba(255_255_0_/_70%)]"></div>
      </div>

      <div className="relative mb-12">
        <WheelCanvas 
          angle={angle} 
          prizes={prizes} 
          winnerIndex={winner?.index}
          size={wheelSize}
        />
        
        {/* Palito indicador con física */}
        <FlickerPointer angle={angle} prizes={prizes} />
      </div>

      <button
        onClick={startSpin}
        disabled={spinning}
        aria-label={spinning ? "Girando la ruleta" : "Girar la ruleta"}
        className={`px-8 md:px-12 py-4 md:py-6 rounded-full text-white text-xl md:text-2xl font-bold 
                   transition-all duration-300 transform hover:scale-110
                   ${
          spinning 
            ? 'bg-gray-600 cursor-not-allowed' 
            : 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
        }
                   [box-shadow:_0_0_30px_rgba(255_165_0_/_60%)]
                   border-4 border-yellow-300`}
      >
        {spinning ? 'SPINNING... 🌀' : 'SPIN THE WHEEL!'}
      </button>

      <WinnerPopup 
        winner={showWinner ? winner : null} 
        onClose={() => setShowWinner(false)} 
      />

      <div className="fixed top-0 left-0 w-full h-2 bg-yellow-400 
                    [box-shadow:_0_0_20px_yellow]"></div>
      <div className="fixed bottom-0 left-0 w-full h-2 bg-yellow-400 
                    [box-shadow:_0_0_20px_yellow]"></div>
    </div>
  );
}