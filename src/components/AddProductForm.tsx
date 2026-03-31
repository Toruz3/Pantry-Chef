import React, { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { PRODUCT_UNITS } from '../constants/units';
import { cn } from '../lib/utils';

interface AddProductFormProps {
  onAddProduct: (
    productData: {
      name: string;
      expirationDate: string;
      quantity: number;
      unit: string;
    },
    onSuccess?: () => void,
    onError?: (msg: string) => void
  ) => Promise<void>;
  isCategorizing: boolean;
  onSuccess?: () => void;
  initialName?: string;
  onNameChange?: (name: string) => void;
}

export function AddProductForm({ onAddProduct, isCategorizing, onSuccess, initialName = '', onNameChange }: AddProductFormProps) {
  const [name, setName] = useState(initialName);
  const [date, setDate] = useState('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [unit, setUnit] = useState('g');

  React.useEffect(() => {
    if (initialName) {
      setName(initialName);
    }
  }, [initialName]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    if (onNameChange) {
      onNameChange(newName);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || quantity === '' || isCategorizing) return;

    await onAddProduct(
      { name, expirationDate: date, quantity: Number(quantity), unit },
      () => {
        setName('');
        if (onNameChange) onNameChange('');
        setDate('');
        setQuantity('');
        setUnit('g');
        if (onSuccess) onSuccess();
      }
    );
  };

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <div className="space-y-4 bg-white dark:bg-stone-900 p-5 rounded-2xl border border-stone-100 dark:border-stone-800 shadow-sm">
        <div>
          <label htmlFor="name" className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">Nome Prodotto</label>
          <input type="text" id="name" value={name}
            onChange={handleNameChange}
            placeholder="es. Latte, Uova, Spinaci"
            className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base bg-stone-50 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500"
          />
        </div>
        
        <div className="grid grid-cols-1 gap-4">
          <div className="col-span-1">
            <label htmlFor="date" className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">Scadenza</label>
            <input type="date" id="date" value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base bg-stone-50 dark:bg-stone-950 dark:text-stone-100"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="quantity" className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">Quantità</label>
            <input type="number" id="quantity" min="0" step="any" inputMode="decimal"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="es. 500"
              className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base bg-stone-50 dark:bg-stone-950 dark:text-stone-100 dark:placeholder:text-stone-500"
            />
          </div>
          <div className="w-1/3">
            <label htmlFor="unit" className="block text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-1.5">Unità</label>
            <select id="unit" value={unit}
              onChange={(e) => setUnit(e.target.value)}
              className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow text-base bg-stone-50 dark:bg-stone-950 dark:text-stone-100"
            >
              {PRODUCT_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>

        <button type="submit"
          disabled={!name || !date || quantity === '' || isCategorizing}
          className="w-full mt-2 bg-stone-900 dark:bg-emerald-600 text-white px-4 py-3.5 rounded-xl font-medium hover:bg-stone-800 dark:hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {isCategorizing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
          {isCategorizing ? 'Categorizzazione...' : 'Aggiungi'}
        </button>
      </div>
    </form>
  );
}
