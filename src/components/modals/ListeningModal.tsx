import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Mic, Square, Loader2 } from 'lucide-react';

interface ListeningModalProps {
  isRecording: boolean;
  isAnalyzingAudio: boolean;
  onStop: () => void;
}

export function ListeningModal({ isRecording, isAnalyzingAudio, onStop }: ListeningModalProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="flex flex-col items-center justify-center"
      >
        {isAnalyzingAudio ? (
          <>
            <div className="w-24 h-24 rounded-full bg-blue-500/20 flex items-center justify-center mb-8 relative">
              <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Sto elaborando...</h3>
            <p className="text-stone-300 text-center max-w-xs">
              Attendi un istante, sto trascrivendo e organizzando i prodotti.
            </p>
          </>
        ) : (
          <>
            <div className="relative w-32 h-32 flex items-center justify-center mb-8">
              {/* Ripple effect */}
              <motion.div
                animate={{ scale: [1, 1.5, 2], opacity: [0.5, 0.2, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-red-500"
              />
              <motion.div
                animate={{ scale: [1, 1.2, 1.5], opacity: [0.8, 0.4, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.5, ease: "easeOut" }}
                className="absolute inset-0 rounded-full bg-red-500"
              />
              
              <div className="relative z-10 w-24 h-24 rounded-full bg-red-500 flex items-center justify-center shadow-lg shadow-red-500/40">
                <Mic className="w-10 h-10 text-white" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2 text-center">Ti sto ascoltando</h3>
            <p className="text-stone-300 text-center max-w-xs mb-10">
              Elenca i prodotti che vuoi aggiungere alla dispensa.
            </p>
            
            <button
              onClick={onStop}
              className="flex items-center gap-2 px-6 py-3 rounded-full bg-white text-stone-900 font-semibold hover:bg-stone-100 active:scale-95 transition-all shadow-lg"
            >
              <Square className="w-5 h-5 fill-current text-red-500" />
              <span>Termina registrazione</span>
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
