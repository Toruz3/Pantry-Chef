import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { ChefHat, Users, Utensils, Loader2, Mic, Square } from 'lucide-react';
import { transcribeAudio } from '../../services/gemini';
import { toast } from 'react-hot-toast';

interface PreferencesModalProps {
  isOpen: boolean;
  mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino' | null;
  isGenerating: boolean;
  onConfirm: (servings: number, useMicrowave: boolean, useAirFryer: boolean, preferences: string) => void;
  onCancel: () => void;
}

export function PreferencesModal({ isOpen, mealType, isGenerating, onConfirm, onCancel }: PreferencesModalProps) {
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
    if (isOpen) {
      setServings(1);
      setUseMicrowave(false);
      setUseAirFryer(false);
      setUserPreferences('');
      setIsRecording(false);
      setIsTranscribing(false);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl"
      >
        <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4 mx-auto">
          <ChefHat className="w-6 h-6" />
        </div>
        <h3 className="text-xl font-bold text-center text-stone-900 mb-2">Qualche preferenza?</h3>
        <p className="text-center text-stone-600 mb-6 text-sm">
          Hai voglia di qualcosa in particolare? Aggiungi dei dettagli per aiutare lo Chef a creare la ricetta perfetta per te.
        </p>
        
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-stone-500" />
              <label htmlFor="modal-servings" className="text-stone-700 font-medium">Persone:</label>
            </div>
            <input
              type="number"
              id="modal-servings"
              min="1"
              max="20"
              value={servings}
              onChange={(e) => setServings(parseInt(e.target.value) || 1)}
              className="w-20 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-center font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-stone-700">Elettrodomestici disponibili:</span>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useMicrowave}
                  onChange={(e) => setUseMicrowave(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-stone-600">Microonde</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={useAirFryer}
                  onChange={(e) => setUseAirFryer(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-stone-300 focus:ring-emerald-500"
                />
                <span className="text-sm text-stone-600">Friggitrice ad aria</span>
              </label>
            </div>
          </div>
        </div>

        <div className="relative mb-6">
          <textarea
            value={userPreferences}
            onChange={(e) => setUserPreferences(e.target.value)}
            placeholder="Es. Vorrei qualcosa di leggero, ho voglia di piccante, non usare i latticini..."
            className="w-full h-32 p-3 pr-12 border border-stone-200 rounded-xl bg-stone-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
          />
          <div className="absolute bottom-3 right-3 flex flex-col items-center">
            {isTranscribing ? (
              <div className="p-2 rounded-full bg-emerald-100 text-emerald-600">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`p-2 rounded-full transition-all shadow-sm ${
                  isRecording 
                    ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                    : 'bg-white text-stone-500 hover:bg-stone-100 border border-stone-200'
                }`}
                title={isRecording ? "Ferma registrazione" : "Dettatura vocale"}
              >
                {isRecording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={() => onConfirm(servings, useMicrowave, useAirFryer, userPreferences)}
            disabled={isGenerating || isRecording || isTranscribing}
            className="flex-1 px-4 py-2.5 rounded-xl font-medium text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Utensils className="w-5 h-5" />}
            Genera
          </button>
        </div>
      </motion.div>
    </div>
  );
}
