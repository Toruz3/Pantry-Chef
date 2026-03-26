import React from 'react';
import { Toaster, ToastBar } from 'react-hot-toast';
import { Header } from './Header';
import { BottomNav } from '../BottomNav';

interface MainLayoutProps {
  children: React.ReactNode;
  activeTab: 'pantry' | 'recipe' | 'stats' | 'settings';
  handleTabChange: (tab: 'pantry' | 'recipe' | 'stats' | 'settings') => void;
  isGenerating: boolean;
  setShowAddSheet: (show: boolean) => void;
}

export function MainLayout({ children, activeTab, handleTabChange, isGenerating, setShowAddSheet }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-sans selection:bg-emerald-200 dark:selection:bg-emerald-900 transition-colors duration-200">
      <Toaster 
        position="bottom-center"
        containerClassName="toast-container !bottom-[calc(5.5rem+env(safe-area-inset-bottom))] sm:!bottom-6"
        toastOptions={{
          duration: 2000,
          style: {
            borderRadius: '16px',
            background: '#333',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          },
          success: {
            style: { background: '#059669' },
          },
          error: {
            style: { background: '#dc2626' },
          },
        }}
      >
        {(t) => (
          <div
            style={{
              opacity: t.visible ? 1 : 0,
              transform: t.visible ? 'scale(1)' : 'scale(0.9)',
              transition: 'all 0.2s cubic-bezier(0.2, 0, 0, 1)',
            }}
          >
            <ToastBar toast={t} />
          </div>
        )}
      </Toaster>
      
      <Header 
        activeTab={activeTab} 
        handleTabChange={handleTabChange} 
        isGenerating={isGenerating} 
        setShowAddSheet={setShowAddSheet}
      />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-6 sm:pb-8 sm:pt-8">
        {children}
      </main>

      <BottomNav
        activeTab={activeTab}
        handleTabChange={handleTabChange}
        isGenerating={isGenerating}
        setShowAddSheet={setShowAddSheet}
      />
    </div>
  );
}
