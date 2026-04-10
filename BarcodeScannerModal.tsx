import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ChefHat, LogIn } from 'lucide-react';

export function Login() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950 flex flex-col items-center justify-center p-4">
      <div className="bg-white dark:bg-stone-900 p-8 rounded-3xl shadow-xl max-w-md w-full text-center border border-stone-200 dark:border-stone-800">
        <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
          <ChefHat className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2 font-serif">
          Chef da Dispensa
        </h1>
        <p className="text-stone-500 dark:text-stone-400 mb-8">
          Accedi per sincronizzare la tua dispensa, condividere la spesa con la famiglia e salvare le tue ricette preferite.
        </p>
        
        <button
          onClick={signInWithGoogle}
          className="w-full flex items-center justify-center gap-3 bg-emerald-600 border border-emerald-700 text-white px-6 py-4 rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <LogIn className="w-6 h-6" />
          Accedi all'App
        </button>
      </div>
    </div>
  );
}
