import React, { useEffect, useRef, memo } from 'react';

const WinnerPopup = memo(({ winner, onClose }) => {
  const dialogRef = useRef(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (winner && dialog) {
      dialog.focus();
    }
  }, [winner]);

  if (!winner) return null;

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      ref={dialogRef}
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-labelledby="winner-title"
      aria-describedby="winner-description"
      aria-modal="true"
      tabIndex={-1}
    >
      <div 
        className="bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-500 p-8 rounded-3xl max-w-md w-full mx-4 
                   shadow-2xl border-8 border-yellow-200 animate-bounce-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
          <div 
            className="text-6xl mb-4 animate-spin-once" 
            aria-hidden="true"
            role="img"
          >
            🎉
          </div>
          
          <h2 
            id="winner-title" 
            className="text-4xl font-black text-gray-900 mb-4 tracking-wider"
          >
            ¡FELICIDADES!
          </h2>
          
          <div 
            id="winner-description"
            className="bg-white rounded-2xl p-6 mb-6 shadow-inner"
          >
            <p className="text-2xl text-gray-700 mb-2 font-semibold">Has ganado:</p>
            <p className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
              {winner.prize}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-full 
                     font-bold text-lg hover:scale-110 transform transition-all duration-200 
                     shadow-lg hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-300"
            aria-label="Cerrar mensaje de premio"
            autoFocus
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
});

WinnerPopup.displayName = 'WinnerPopup';

export default WinnerPopup;