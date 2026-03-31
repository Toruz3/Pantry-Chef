import React from 'react';
import { AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

import { ClearConfirmModal } from './ClearConfirmModal';
import { PreferencesModal } from './PreferencesModal';
import { ListeningModal } from './ListeningModal';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import { SettingsModal } from './SettingsModal';
import { ReceiptSourceModal } from './ReceiptSourceModal';

interface ModalsContainerProps {
  isReceiptModalOpen: boolean;
  setIsReceiptModalOpen: (v: boolean) => void;
  cameraInputRef: React.RefObject<HTMLInputElement>;
  galleryInputRef: React.RefObject<HTMLInputElement>;
  isRecording: boolean;
  isAnalyzingAudio: boolean;
  stopRecording: () => void;
  isScanningBarcode: boolean;
  setIsScanningBarcode: (v: boolean) => void;
  handleBarcodeScan: (barcode: string) => void;
  showClearConfirm: boolean;
  clearProducts: () => void;
  setShowClearConfirm: (v: boolean) => void;
  showPreferencesModal: boolean;
  selectedMealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino' | null;
  isGenerating: boolean;
  handleGenerateRecipe: (servings: number, useMicrowave: boolean, useAirFryer: boolean, preferences: string, numberOfRecipes: number) => void;
  setShowPreferencesModal: (v: boolean) => void;
  showSettingsModal: boolean;
  settings: any;
  updateSettings: (s: any) => void;
  setShowSettingsModal: (v: boolean) => void;
  handleReceiptUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ModalsContainer({
  isReceiptModalOpen, setIsReceiptModalOpen, cameraInputRef, galleryInputRef,
  isRecording, isAnalyzingAudio, stopRecording,
  isScanningBarcode, setIsScanningBarcode, handleBarcodeScan,
  showClearConfirm, clearProducts, setShowClearConfirm,
  showPreferencesModal, selectedMealType, isGenerating, handleGenerateRecipe, setShowPreferencesModal,
  showSettingsModal, settings, updateSettings, setShowSettingsModal,
  handleReceiptUpload
}: ModalsContainerProps) {
  return (
    <>
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={cameraInputRef}
        onChange={handleReceiptUpload}
        className="hidden" 
      />
      <input 
        type="file" 
        accept="image/*" 
        ref={galleryInputRef}
        onChange={handleReceiptUpload}
        className="hidden" 
      />
      <AnimatePresence>
        {isReceiptModalOpen && (
          <ReceiptSourceModal
            key="receipt-source"
            onSelectSource={(source) => {
              setIsReceiptModalOpen(false);
              if (source === 'camera') {
                cameraInputRef.current?.click();
              } else {
                galleryInputRef.current?.click();
              }
            }}
            onClose={() => setIsReceiptModalOpen(false)}
          />
        )}
        {(isRecording || isAnalyzingAudio) && (
          <ListeningModal
            key="listening"
            isRecording={isRecording}
            isAnalyzingAudio={isAnalyzingAudio}
            onStop={stopRecording}
          />
        )}
        {isScanningBarcode && (
          <BarcodeScannerModal
            key="barcode"
            onClose={() => setIsScanningBarcode(false)}
            onScan={handleBarcodeScan}
          />
        )}
        {showClearConfirm && (
          <ClearConfirmModal
            key="clear"
            onConfirm={clearProducts}
            onCancel={() => setShowClearConfirm(false)}
          />
        )}
        {showPreferencesModal && (
          <PreferencesModal
            key="preferences"
            mealType={selectedMealType}
            isGenerating={isGenerating}
            onConfirm={handleGenerateRecipe}
            onCancel={() => setShowPreferencesModal(false)}
          />
        )}
        {showSettingsModal && (
          <SettingsModal
            key="settings"
            settings={settings}
            onUpdate={updateSettings}
            onClose={() => setShowSettingsModal(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
