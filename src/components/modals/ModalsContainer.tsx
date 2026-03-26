import React, { Suspense } from 'react';
import { AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

const ClearConfirmModal = React.lazy(() => import('./ClearConfirmModal').then(m => ({ default: m.ClearConfirmModal })));
const PreferencesModal = React.lazy(() => import('./PreferencesModal').then(m => ({ default: m.PreferencesModal })));
const ListeningModal = React.lazy(() => import('./ListeningModal').then(m => ({ default: m.ListeningModal })));
const BarcodeScannerModal = React.lazy(() => import('./BarcodeScannerModal').then(m => ({ default: m.BarcodeScannerModal })));
const SettingsModal = React.lazy(() => import('./SettingsModal').then(m => ({ default: m.SettingsModal })));
const ReceiptSourceModal = React.lazy(() => import('./ReceiptSourceModal').then(m => ({ default: m.ReceiptSourceModal })));

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
}

export function ModalsContainer({
  isReceiptModalOpen, setIsReceiptModalOpen, cameraInputRef, galleryInputRef,
  isRecording, isAnalyzingAudio, stopRecording,
  isScanningBarcode, setIsScanningBarcode, handleBarcodeScan,
  showClearConfirm, clearProducts, setShowClearConfirm,
  showPreferencesModal, selectedMealType, isGenerating, handleGenerateRecipe, setShowPreferencesModal,
  showSettingsModal, settings, updateSettings, setShowSettingsModal
}: ModalsContainerProps) {
  return (
    <Suspense fallback={null}>
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
    </Suspense>
  );
}
