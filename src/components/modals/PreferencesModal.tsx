import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { ChefHat, Users, Utensils, Loader2, Mic, Square, Minus, Plus, Waves, Wind, X } from 'lucide-react';
import { transcribeAudio } from '../../services/gemini';
import { toast } from 'react-hot-toast';

interface PreferencesModalProps {
  mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino' | null;
  isGenerating: boolean;
  onConfirm: (servings: number, useMicrowave: boolean, useAirFryer: boolean, preferences: string, numberOfRecipes: number) => void;
  onCancel: () => void;
}

export function PreferencesModal({ mealType, isGenerating, onConfirm, onCancel }: PreferencesModalProps) {
  const [servings, setServings] = useState<number>(1);
  const [numberOfRecipes, setNumberOfRecipes] = useState<number>(1);
  const [useMicrowave, setUseMicrowave] = useState(false);
  const [useAirFryer, setUseAirFryer] = useState(false);
  const [userPreferences, setUserPreferences] = useState('');
  
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Reset state when modal opens
  useEffect(() => {
    setServings(1);
    setNumberOfRecipes(1);
    setUseMicrowave(false);
    setUseAirFryer(false);
    setUserPreferences('');
    setIsRecording(false);
    setIsTranscribing(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        stream.getTracks().forEach(t => t.stop());
        await processAudio(blob);
      };
      
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error('Impossibile accedere al microfono:', err);
      toast.error('Impossibile accedere al microfono. Verifica i permessi.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const b64 = reader.result?.toString().split(',')[1];
        if (b64) {
          const text = await transcribeAudio(b64, audioBlob.type);
          if (text) {
            setUserPreferences(prev => prev ? `${prev} ${text}` : text);
          }
        }
        setIsTranscribing(false);
      };
    } catch (err) {
      console.error("Errore durante la trascrizione dell'audio:", err);
      setIsTranscribing(false);
      toast.error("Errore durante la trascrizione dell'audio.");
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-stone-900 rounded-3xl p-6 max-w-md w-full shadow-2xl overflow-hidden dark:border dark:border-stone-800"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-stone-900 dark:text-stone-100 flex items-center gap-3 capitalize">
              <span className="text-3xl bg-emerald-50 dark:bg-emerald-900/30 w-12 h-12 flex items-center justify-center rounded-2xl">
                {mealType === 'colazione' && '🥐'}
                {mealType === 'pranzo' && '🍝'}
                {mealType === 'cena' && '🍕'}
                {mealType === 'spuntino' && '🥪'}
                {!mealType && '👨‍🍳'}
              </span>
              {mealType || 'Ricetta'}
            </h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mt-2 font-medium">
              Personalizza la tua ricetta.
            </p>
          </div>
          <button onClick={onCancel} className="p-2 text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-2 gap-4">
            {/* Persone */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-400">
                  <Users className="w-4 h-4" />
                </div>
                <span className="text-sm text-stone-700 dark:text-stone-300 font-semibold">Persone</span>
              </div>
              <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl p-1 shadow-sm">
                <button 
                  onClick={() => setServings(Math.max(1, servings - 1))} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-stone-700 hover:shadow-sm text-stone-600 dark:text-stone-400 active:bg-stone-200 dark:active:bg-stone-600 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-bold text-stone-800 dark:text-stone-200">{servings}</span>
                <button 
                  onClick={() => setServings(servings + 1)} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-stone-700 hover:shadow-sm text-stone-600 dark:text-stone-400 active:bg-stone-200 dark:active:bg-stone-600 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Numero di Ricette */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-stone-100 dark:bg-stone-800 rounded-lg text-stone-600 dark:text-stone-400">
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="text-sm text-stone-700 dark:text-stone-300 font-semibold">Ricette</span>
              </div>
              <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 rounded-xl p-1 shadow-sm">
                <button 
                  onClick={() => setNumberOfRecipes(Math.max(1, numberOfRecipes - 1))} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-stone-700 hover:shadow-sm text-stone-600 dark:text-stone-400 active:bg-stone-200 dark:active:bg-stone-600 transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-bold text-stone-800 dark:text-stone-200">{numberOfRecipes}</span>
                <button 
                  onClick={() => setNumberOfRecipes(Math.min(5, numberOfRecipes + 1))} 
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white dark:hover:bg-stone-700 hover:shadow-sm text-stone-600 dark:text-stone-400 active:bg-stone-200 dark:active:bg-stone-600 transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          
          <hr className="border-stone-100 dark:border-stone-800 hidden sm:block" />

          {/* Elettrodomestici */}
          <div>
            <span className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-2">Cosa vuoi usare?</span>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setUseMicrowave(!useMicrowave)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${useMicrowave ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700'}`}
              >
                <Waves className="w-4 h-4" /> Microonde
              </button>
              <button 
                onClick={() => setUseAirFryer(!useAirFryer)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${useAirFryer ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 shadow-sm' : 'border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-700'}`}
              >
                <Wind className="w-4 h-4" /> Friggitrice
              </button>
            </div>
          </div>

          <hr className="border-stone-100 dark:border-stone-800 hidden sm:block" />

          {/* Textarea */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-stone-700 dark:text-stone-300">Note o preferenze</span>
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-500" />
              ) : (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    isRecording 
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' 
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                  }`}
                >
                  {isRecording ? <Square className="w-3 h-3 fill-current" /> : <Mic className="w-3 h-3" />}
                  {isRecording ? 'In ascolto...' : 'Dettatura vocale'}
                </button>
              )}
            </div>
            <textarea
              value={userPreferences}
              onChange={(e) => setUserPreferences(e.target.value)}
              placeholder="Es. Vorrei qualcosa di leggero, niente latticini..."
              className="w-full h-20 sm:h-24 p-3 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-800 focus:bg-white dark:focus:bg-stone-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none text-base transition-all dark:text-stone-100 dark:placeholder:text-stone-500"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 sm:pt-6 flex gap-3 mt-2">
          <button
            onClick={onCancel}
            className="px-4 sm:px-5 py-3 rounded-xl sm:rounded-2xl font-semibold text-stone-600 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={() => onConfirm(servings, useMicrowave, useAirFryer, userPreferences, numberOfRecipes)}
            disabled={isGenerating || isRecording || isTranscribing}
            className="flex-1 py-3 rounded-xl sm:rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Utensils className="w-5 h-5" />}
            {isGenerating ? 'Creazione...' : 'Genera Ricetta'}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
