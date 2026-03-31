import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AnimatePresence } from 'motion/react';

import { useProducts } from './hooks/useProducts';
import { useRecipe } from './hooks/useRecipe';
import { useSettings } from './hooks/useSettings';
import { useAddProductMethods } from './hooks/useAddProductMethods';
import { ModalsContainer } from './components/modals/ModalsContainer';
import { useStats } from './hooks/useStats';
import { MainLayout } from './components/Layout/MainLayout';
import { PantrySkeleton, RecipeSkeleton, StatsSkeleton, SettingsSkeleton } from './components/ui/Skeleton';

import { DelayedFallback } from './components/ui/DelayedFallback';

const AddProductModal = React.lazy(() => import('./components/AddTab').then(m => ({ default: m.AddProductModal })));
const PantryTab = React.lazy(() => import('./components/PantryTab').then(m => ({ default: m.PantryTab })));
const RecipeTab = React.lazy(() => import('./components/RecipeTab').then(m => ({ default: m.RecipeTab })));
const StatsTab = React.lazy(() => import('./components/StatsTab').then(m => ({ default: m.StatsTab })));
const SettingsTab = React.lazy(() => import('./components/SettingsTab').then(m => ({ default: m.SettingsTab })));

import { checkAndSendNotifications } from './utils/notifications';
import { useAuth } from './contexts/AuthContext';
import { Login } from './components/Auth/Login';

import { ProductsProvider, useProductsContext } from './contexts/ProductsContext';

function MainAppContent() {
  const [activeTab, setActiveTab] = useState<'pantry' | 'recipe' | 'stats' | 'settings'>('pantry');
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // ─── Products ──────────────────────────────────────────────────────────────

  const {
    products, addProducts, addProduct,
    sortBy, setSortBy,
    showClearConfirm, setShowClearConfirm,
    isCategorizing,
    editingProductId,
    sortedProducts, groupedProducts,
    handleDeleteProduct,
    handleConsumeProduct, handleWasteProduct,
    handleEditProduct, handleSaveEdit, handleCancelEdit,
    clearProducts, consumeProducts,
  } = useProductsContext();

  const { stats, recordConsumption, recordWaste } = useStats();

  const onConsumeProduct = (id: string, quantity: number = 1) => {
    const product = products.find(p => p.id === id);
    handleConsumeProduct(id, quantity);
    recordConsumption(quantity, product?.category);
  };

  const onWasteProduct = (id: string, quantity: number = 1) => {
    const product = products.find(p => p.id === id);
    handleWasteProduct(id, quantity);
    recordWaste(quantity, product?.category);
  };

  // ─── Add Product Methods ───────────────────────────────────────────────────

  const {
    scannedProductName, setScannedProductName,
    isRecording, isAnalyzingAudio, audioParsedProducts, setAudioParsedProducts,
    invalidIndices, setInvalidIndices, isScanningBarcode, setIsScanningBarcode,
    isFetchingBarcode, isAnalyzingReceipt, isReceiptModalOpen, setIsReceiptModalOpen,
    showAddSheet, setShowAddSheet, cameraInputRef, galleryInputRef,
    handleBarcodeScan, startRecording, stopRecording, handleReceiptUpload
  } = useAddProductMethods();

  // ─── Recipe ────────────────────────────────────────────────────────────────

  const {
    recipes, recipe, selectedRecipeIndex, handleSelectRecipe, isGenerating,
    isEditingRecipe, setIsEditingRecipe,
    isRecipeConfirmed, editedUsedProducts,
    showPreferencesModal, setShowPreferencesModal,
    selectedMealType,
    openPreferencesModal,
    handleGenerateRecipe, handleConfirmRecipe, handleEditedQuantityChange,
  } = useRecipe(consumeProducts);

  const handleOpenPreferences = (mealType: 'colazione' | 'pranzo' | 'cena' | 'spuntino') => {
    if (products.length === 0) {
      toast.error('Per favore, aggiungi prima qualche prodotto.');
      return;
    }
    openPreferencesModal(mealType);
  };

  const onConfirmRecipe = async () => {
    await handleConfirmRecipe();
    const totalConsumed = editedUsedProducts.reduce((sum, item) => sum + item.quantity, 0);
    recordConsumption(totalConsumed);
    toast.success('Ricetta confermata!');
  };

  // ─── Navigation ────────────────────────────────────────────────────────────

  const handleTabChange = (tab: 'pantry' | 'recipe' | 'stats' | 'settings') => {
    if (isGenerating) return;
    setActiveTab(tab);
  };

  // ─── Settings & Notifications ────────────────────────────────────────────────
  const { settings, updateSettings } = useSettings();

  React.useEffect(() => {
    if (settings.notificationsEnabled && products.length > 0) {
      checkAndSendNotifications(
        products,
        settings.notifyDaysInAdvance,
        settings.notifyTime,
        settings.lastNotifiedDate,
        (dateStr) => updateSettings({ lastNotifiedDate: dateStr })
      );
    }
  }, [products, settings, updateSettings]);

  React.useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <MainLayout 
      activeTab={activeTab} 
      handleTabChange={handleTabChange} 
      isGenerating={isGenerating} 
      setShowAddSheet={setShowAddSheet}
    >
      <AnimatePresence mode="wait">
        {/* ── Pantry tab ──────────────────────────────────────────────────── */}
        {activeTab === 'pantry' && (
          <React.Suspense fallback={<DelayedFallback><div className="p-4 sm:p-6"><PantrySkeleton /></div></DelayedFallback>}>
            <PantryTab
              key="pantry"
              setShowAddSheet={setShowAddSheet}
              handleConsumeProduct={onConsumeProduct}
              handleWasteProduct={onWasteProduct}
              onOpenSettings={() => setShowSettingsModal(true)}
              pantryLayout={settings.pantryLayout}
            />
          </React.Suspense>
        )}

        {/* ── Recipe tab ──────────────────────────────────────────────────── */}
        {activeTab === 'recipe' && (
          <React.Suspense fallback={<DelayedFallback><div className="p-4 sm:p-6"><RecipeSkeleton /></div></DelayedFallback>}>
            <RecipeTab
              key="recipe"
              recipes={recipes}
              recipe={recipe}
              selectedRecipeIndex={selectedRecipeIndex}
              onSelectRecipe={handleSelectRecipe}
              isGenerating={isGenerating}
              isEditingRecipe={isEditingRecipe}
              setIsEditingRecipe={setIsEditingRecipe}
              isRecipeConfirmed={isRecipeConfirmed}
              editedUsedProducts={editedUsedProducts}
              selectedMealType={selectedMealType}
              onOpenPreferences={handleOpenPreferences}
              onConfirmRecipe={onConfirmRecipe}
              onEditedQuantityChange={handleEditedQuantityChange}
            />
          </React.Suspense>
        )}

        {/* ── Stats tab ───────────────────────────────────────────────────── */}
        {activeTab === 'stats' && (
          <React.Suspense fallback={<DelayedFallback><div className="p-4 sm:p-6"><StatsSkeleton /></div></DelayedFallback>}>
            <StatsTab
              key="stats"
              stats={stats}
            />
          </React.Suspense>
        )}

        {/* ── Settings tab ────────────────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <React.Suspense fallback={<DelayedFallback><div className="p-4 sm:p-6"><SettingsSkeleton /></div></DelayedFallback>}>
            <SettingsTab
              key="settings"
              settings={settings}
              onUpdate={updateSettings}
            />
          </React.Suspense>
        )}
      </AnimatePresence>

      {/* Modals & toast */}
      <React.Suspense fallback={null}>
        <AddProductModal
          isOpen={showAddSheet}
          onClose={() => setShowAddSheet(false)}
          isScanningBarcode={isScanningBarcode}
          setIsScanningBarcode={setIsScanningBarcode}
          isRecording={isRecording}
          isAnalyzingAudio={isAnalyzingAudio}
          isFetchingBarcode={isFetchingBarcode}
          isAnalyzingReceipt={isAnalyzingReceipt}
          startRecording={startRecording}
          stopRecording={stopRecording}
          cameraInputRef={cameraInputRef}
          galleryInputRef={galleryInputRef}
          handleReceiptUpload={handleReceiptUpload}
          setIsReceiptModalOpen={setIsReceiptModalOpen}
          scannedProductName={scannedProductName}
          setScannedProductName={setScannedProductName}
          addProduct={addProduct}
          addProducts={addProducts}
          isCategorizing={isCategorizing}
          audioParsedProducts={audioParsedProducts}
          setAudioParsedProducts={setAudioParsedProducts}
          invalidIndices={invalidIndices}
          setInvalidIndices={setInvalidIndices}
          products={products}
        />
      </React.Suspense>

      <ModalsContainer
        isReceiptModalOpen={isReceiptModalOpen}
        setIsReceiptModalOpen={setIsReceiptModalOpen}
        cameraInputRef={cameraInputRef}
        galleryInputRef={galleryInputRef}
        isRecording={isRecording}
        isAnalyzingAudio={isAnalyzingAudio}
        stopRecording={stopRecording}
        isScanningBarcode={isScanningBarcode}
        setIsScanningBarcode={setIsScanningBarcode}
        handleBarcodeScan={handleBarcodeScan}
        showClearConfirm={showClearConfirm}
        clearProducts={clearProducts}
        setShowClearConfirm={setShowClearConfirm}
        showPreferencesModal={showPreferencesModal}
        selectedMealType={selectedMealType}
        isGenerating={isGenerating}
        handleGenerateRecipe={(servings, useMicrowave, useAirFryer, preferences, numberOfRecipes) => {
          const combinedPreferences = [
            settings.diets?.length ? `Diete: ${settings.diets.join(', ')}` : '',
            settings.intolerances ? `Intolleranze: ${settings.intolerances}` : '',
            preferences ? `Preferenze utente: ${preferences}` : ''
          ].filter(Boolean).join('. ');

          handleGenerateRecipe(sortedProducts, servings, useMicrowave, useAirFryer, combinedPreferences, numberOfRecipes, (msg) => toast.error(msg));
        }}
        setShowPreferencesModal={setShowPreferencesModal}
        showSettingsModal={showSettingsModal}
        settings={settings}
        updateSettings={updateSettings}
        setShowSettingsModal={setShowSettingsModal}
        handleReceiptUpload={handleReceiptUpload}
      />
    </MainLayout>
  );
}

function MainApp() {
  return (
    <ProductsProvider>
      <MainAppContent />
    </ProductsProvider>
  );
}

export default function App() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  return <MainApp />;
}