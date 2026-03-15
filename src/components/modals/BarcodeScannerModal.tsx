import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ScanLine, Loader2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-hot-toast';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

export function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isStarting, setIsStarting] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsStarting(true);

    const startScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode("barcode-reader");
        await scannerRef.current.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.0,
          },
          (decodedText) => {
            if (scannerRef.current && mounted) {
              scannerRef.current.stop().then(() => {
                onScan(decodedText);
              }).catch(console.error);
            }
          },
          (errorMessage) => {
            // Ignore parse errors
          }
        );
        if (mounted) setIsStarting(false);
      } catch (err) {
        console.error("Error starting scanner:", err);
        if (mounted) {
          toast.error("Impossibile avviare la fotocamera. Verifica i permessi.");
          setIsStarting(false);
          onClose();
        }
      }
    };

    const timer = setTimeout(() => {
      startScanner();
    }, 100);

    return () => {
      mounted = false;
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isOpen, onScan, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex flex-col bg-black/95 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4 text-white">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <ScanLine className="w-5 h-5" />
            Scansiona Codice a Barre
          </h3>
          <button onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-sm relative overflow-hidden rounded-2xl bg-black/50 border border-white/10 shadow-2xl">
            {isStarting && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
            <div id="barcode-reader" className="w-full h-full min-h-[300px]"></div>
            {/* Overlay scanning line */}
            <motion.div 
              animate={{ y: [0, 200, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="absolute top-1/2 left-8 right-8 h-0.5 bg-red-500 shadow-[0_0_8px_2px_rgba(239,68,68,0.5)] z-10"
              style={{ marginTop: '-100px' }}
            />
          </div>
          <p className="text-white/60 text-center mt-8 text-sm max-w-xs">
            Inquadra il codice a barre del prodotto. La scansione avverrà automaticamente.
          </p>
        </div>
      </div>
    </AnimatePresence>
  );
}
