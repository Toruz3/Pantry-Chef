import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { AudioExtractedProduct } from '../types';
import { analyzeAudioProducts, processReceiptImage } from '../services/gemini';

import imageCompression from 'browser-image-compression';

export function useAddProductMethods() {
  const [scannedProductName, setScannedProductName] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isAnalyzingAudio, setIsAnalyzingAudio] = useState(false);
  const [audioParsedProducts, setAudioParsedProducts] = useState<AudioExtractedProduct[] | null>(null);
  const [invalidIndices, setInvalidIndices] = useState<Set<number>>(new Set());
  
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [isFetchingBarcode, setIsFetchingBarcode] = useState(false);
  
  const [isAnalyzingReceipt, setIsAnalyzingReceipt] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);

  const audioChunksRef = useRef<BlobPart[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleBarcodeScan = async (barcode: string) => {
    // Do not close the scanner immediately
    // setIsScanningBarcode(false);
    setIsFetchingBarcode(true);
    
    try {
      const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
      const data = await res.json();
      
      let fullName = '';
      if (data.status === 1 && data.product) {
        const name = data.product.product_name || data.product.product_name_it || data.product.generic_name;
        const brand = data.product.brands ? data.product.brands.split(',')[0] : '';
        fullName = brand ? `${brand} ${name}` : name;
      }
      
      if (fullName) {
        toast.success(`Prodotto trovato: ${fullName}`);
      } else {
        toast.error("Prodotto non trovato, aggiunto come 'Sconosciuto'.");
        fullName = "Prodotto Sconosciuto";
      }

      setAudioParsedProducts(prev => {
        const newProduct: AudioExtractedProduct = {
          name: fullName,
          quantity: 1,
          unit: 'pezzi',
          expirationDate: '',
          category: 'Altro',
          isEstimate: false
        };
        const nextProducts = prev ? [...prev, newProduct] : [newProduct];
        
        setInvalidIndices(prevIndices => {
          const nextIndices = new Set(prevIndices);
          nextIndices.add(nextProducts.length - 1);
          return nextIndices;
        });

        return nextProducts;
      });

    } catch (err) {
      toast.error("Errore durante la ricerca del prodotto.");
    } finally {
      setIsFetchingBarcode(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/ogg';
      
      const recorder = new MediaRecorder(stream, { mimeType });
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        await processAudio(blob);
        stream.getTracks().forEach(t => t.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch {
      toast.error('Impossibile accedere al microfono. Verifica i permessi nelle impostazioni del browser.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) { 
      mediaRecorder.stop(); 
      setIsRecording(false); 
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsAnalyzingAudio(true);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const b64 = reader.result?.toString().split(',')[1];
          if (b64) resolve(b64);
          else reject(new Error('Impossibile leggere il file audio.'));
        };
        reader.onerror = () => reject(new Error('Errore nella lettura del file audio.'));
      });

      const extracted = await analyzeAudioProducts(base64, audioBlob.type);
      if (extracted?.length > 0) {
        setAudioParsedProducts(extracted);
        setInvalidIndices(new Set());
      } else {
        toast.error("Non sono riuscito a trovare prodotti nell'audio. Riprova.");
      }
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'analisi dell'audio.");
    } finally {
      setIsAnalyzingAudio(false);
    }
  };

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingReceipt(true);
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(file, options);

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(compressedFile);
        reader.onloadend = () => {
          const b64 = reader.result?.toString().split(',')[1];
          if (b64) resolve(b64);
          else reject(new Error("Impossibile leggere l'immagine."));
        };
        reader.onerror = () => reject(new Error("Errore nella lettura dell'immagine."));
      });

      const extracted = await processReceiptImage(base64, compressedFile.type);
      if (extracted?.length > 0) {
        setAudioParsedProducts(extracted);
        setInvalidIndices(new Set());
      } else {
        toast.error("Non sono riuscito a trovare prodotti nello scontrino. Riprova con un'immagine più chiara.");
      }
    } catch (err: any) {
      toast.error(err.message || "Errore durante l'analisi dello scontrino.");
    } finally {
      setIsAnalyzingReceipt(false);
      if (e.target) e.target.value = '';
    }
  };

  return {
    scannedProductName,
    setScannedProductName,
    isRecording,
    isAnalyzingAudio,
    audioParsedProducts,
    setAudioParsedProducts,
    invalidIndices,
    setInvalidIndices,
    isScanningBarcode,
    setIsScanningBarcode,
    isFetchingBarcode,
    isAnalyzingReceipt,
    isReceiptModalOpen,
    setIsReceiptModalOpen,
    showAddSheet,
    setShowAddSheet,
    cameraInputRef,
    galleryInputRef,
    handleBarcodeScan,
    startRecording,
    stopRecording,
    handleReceiptUpload
  };
}
