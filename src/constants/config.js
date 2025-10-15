export const CONFIG = {
    PHYSICS: {
      FRICTION: 0.8,
      STOP_THRESHOLD: 0.8,
      MIN_VELOCITY: 8,
      MAX_VELOCITY: 20,
      TICK_INTERVAL: 0.15
    },
    WHEEL: {
      SIZE: 700,
      BORDER_WIDTH: 20,
      CENTER_RADIUS: 25,
      COLORS: {
        BASE: "#8B4513",
        CENTER: "#D4AF37",
        WINNER_GLOW: "#FFD700",
        BORDER: "#C0C0C0"
      }
    },
    POINTER: {
        BEND_INTENSITY: 25, // Intensidad máxima del bend
        ANIMATION_INTERVAL: 16, // ~60fps
        DAMPING: 0.7, // Amortiguación del retorno
        MIN_VELOCITY: 0.1 // Velocidad mínima para activar el efecto
      },
    SOUND: {
      TICK_FREQUENCY: 900,
      WIN_NOTES: [523.25, 659.25, 783.99, 1046.50],
      WIN_NOTE_DURATION: 0.15
    },
    ACCESSIBILITY: {
      SPIN_ANNOUNCE_DELAY: 100
    }
  };
  
  export const PRIZES = [
    "Tote Bag",
    "Camiseta", 
    "QR1",
    "Gorra",
    "Mug",
    "QR2",
    "Pin",
    "Patch",
    "QR3",
    "Luggage Tag",
    "Calcetín"
  ];
  
  // Colores especiales para los QR codes
  export const PRIZE_COLORS = {
    QR1: "#FF6B6B",    // Rojo especial para QR1
    QR2: "#4ECDC4",    // Turquesa especial para QR2  
    QR3: "#45B7D1",    // Azul especial para QR3
    DEFAULT: null      // Los demás usan colores generados
  };