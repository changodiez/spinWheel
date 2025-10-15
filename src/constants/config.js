export const CONFIG = {
    PHYSICS: {
        FRICTION: 0.8,
        STOP_THRESHOLD: 0.8,
        MIN_VELOCITY: 8,
        MAX_VELOCITY: 20,
        TICK_INTERVAL: 0.15
    },
    WHEEL: {
        SIZE: 500,
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
        BEND_INTENSITY: 15, // Reducido para mejor visibilidad
        DAMPING: 0.85,
        ANIMATION_INTERVAL: 16
    },
    SOUND: {
        TICK_FREQUENCY: 800,
        WIN_NOTES: [523.25, 659.25, 783.99, 1046.50],
        WIN_NOTE_DURATION: 0.15
    },
    ACCESSIBILITY: {
        SPIN_ANNOUNCE_DELAY: 100
    }
};

export const PRIZES = [
    "iPhone 15", "PlayStation 5", "MacBook Pro",
    "AirPods Pro", "Smart Watch", "Tablet",
    "Auriculares", "Teclado Gaming"
];