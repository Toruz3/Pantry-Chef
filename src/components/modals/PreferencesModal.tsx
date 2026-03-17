import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChefHat, Users, Utensils, Loader2, Mic, Square, Minus, Plus, Waves, Wind, X } from 'lucide-react';
import { transcribeAudio } from '../../services/gemini';
import { toast } from 'react-hot-toast';

interface PreferencesModalProps {
  mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino' | null;
  isGenerating: boolean;
  onConfirm: (servings: number, useMicrowave: boolean, useAirFryer: boolean, preferences: string) => void;
  onCancel: () => void;
}

export function PreferencesModal({ mealType, isGenerating, onConfirm, onCancel }: PreferencesModalProps) {
  const [servings, setServings] = useState<number>(1);
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

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-2xl font-bold text-stone-900 flex items-center gap-3 capitalize">
              <span className="text-3xl bg-emerald-50 w-12 h-12 flex items-center justify-center rounded-2xl">
                {mealType === 'colazione' && '🥐'}
                {mealType === 'pranzo' && '🍝'}
                {mealType === 'cena' && '🍕'}
                {mealType === 'spuntino' && '🥪'}
                {!mealType && '👨‍🍳'}
              </span>
              {mealType || 'Ricetta'}
            </h3>
            <p className="text-stone-500 text-sm mt-2 font-medium">
              Personalizza la tua ricetta.
            </p>
          </div>
          <button onClick={onCancel} className="p-2 text-stone-400 hover:bg-stone-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* Persone */}
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-stone-100 rounded-xl text-stone-600">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-stone-700 font-semibold">Persone</span>
            </div>
            <div className="flex items-center gap-4 bg-stone-50 border border-stone-200 rounded-2xl p-1.5 shadow-sm">
              <button 
                onClick={() => setServings(Math.max(1, servings - 1))} 
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-stone-600 active:bg-stone-200 transition-all"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-4 text-center font-bold text-stone-800">{servings}</span>
              <button 
                onClick={() => setServings(servings + 1)} 
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white hover:shadow-sm text-stone-600 active:bg-stone-200 transition-all"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <hr className="border-stone-100" />

          {/* Elettrodomestici */}
          <div className="py-1">
            <span className="block text-sm font-semibold text-stone-700 mb-3">Cosa vuoi usare?</span>
            <div className="flex flex-wrap gap-3">
              <button 
                onClick={() => setUseMicrowave(!useMicrowave)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${useMicrowave ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'}`}
              >
                <Waves className="w-4 h-4" /> Microonde
              </button>
              <button 
                onClick={() => setUseAirFryer(!useAirFryer)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-sm font-semibold transition-all ${useAirFryer ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'}`}
              >
                <Wind className="w-4 h-4" /> Friggitrice
              </button>
            </div>
          </div>

          <hr className="border-stone-100" />

          {/* Textarea */}
          <div className="py-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-stone-700">Note o preferenze</span>
              {isTranscribing ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              ) : (
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                    isRecording 
                      ? 'bg-red-100 text-red-600 animate-pulse' 
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
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
              className="w-full h-24 p-4 border border-stone-200 rounded-2xl bg-stone-50 focus:bg-white focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 resize-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-6 flex gap-3 mt-2">
          <button
            onClick={onCancel}
            className="px-5 py-3.5 rounded-2xl font-semibold text-stone-600 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={() => onConfirm(servings, useMicrowave, useAirFryer, userPreferences)}
            disabled={isGenerating || isRecording || isTranscribing}
            className="flex-1 py-3.5 rounded-2xl font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50 active:scale-[0.98]"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Utensils className="w-5 h-5" />}
            {isGenerating ? 'Creazione...' : 'Genera Ricetta'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
