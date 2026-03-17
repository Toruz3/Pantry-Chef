import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Product } from '../types';

interface SampleProductDef {
  name: string;
  category: string;
  units: string[];
}

const SAMPLE_PRODUCTS: SampleProductDef[] = [
  { name: 'Pasta', category: 'Dispensa Secca', units: ['g', 'kg', 'confezioni'] },
  { name: 'Riso', category: 'Dispensa Secca', units: ['g', 'kg', 'confezioni'] },
  { name: 'Uova', category: 'Latticini', units: ['pz', 'confezioni'] },
  { name: 'Latte', category: 'Latticini', units: ['l', 'ml', 'confezioni'] },
  { name: 'Pollo', category: 'Carne e Pesce', units: ['g', 'kg', 'confezioni'] },
  { name: 'Zucchine', category: 'Frutta e Verdura', units: ['pz', 'kg', 'g'] },
  { name: 'Pomodori', category: 'Frutta e Verdura', units: ['pz', 'kg', 'g'] },
  { name: 'Tonno', category: 'Dispensa Secca', units: ['scatolette', 'g'] },
  { name: 'Olio Extravergine', category: 'Dispensa Secca', units: ['l', 'ml'] },
  { name: 'Sale', category: 'Dispensa Secca', units: ['g', 'kg'] },
  { name: 'Zucchero', category: 'Dispensa Secca', units: ['g', 'kg'] },
  { name: 'Farina', category: 'Dispensa Secca', units: ['g', 'kg', 'confezioni'] },
  { name: 'Burro', category: 'Latticini', units: ['g', 'pz'] },
  { name: 'Formaggio Grattugiato', category: 'Latticini', units: ['g', 'confezioni'] },
  { name: 'Mele', category: 'Frutta e Verdura', units: ['pz', 'kg'] },
  { name: 'Patate', category: 'Frutta e Verdura', units: ['kg', 'pz'] },
  { name: 'Cipolle', category: 'Frutta e Verdura', units: ['pz', 'kg'] },
  { name: 'Carote', category: 'Frutta e Verdura', units: ['pz', 'kg'] },
  { name: 'Piselli', category: 'Surgelati', units: ['g', 'confezioni'] },
  { name: 'Pane', category: 'Dispensa Secca', units: ['pz', 'g'] },
  { name: 'Acqua Naturale', category: 'Bevande', units: ['l', 'confezioni'] },
  { name: 'Biscotti', category: 'Snack e Dolci', units: ['g', 'confezioni'] },
  { name: 'Salmone', category: 'Carne e Pesce', units: ['g', 'confezioni'] },
  { name: 'Yogurt', category: 'Latticini', units: ['pz', 'confezioni'] },
  { name: 'Pizza Margherita', category: 'Surgelati', units: ['pz', 'confezioni'] },
  { name: 'Succo di Frutta', category: 'Bevande', units: ['l', 'ml', 'confezioni'] },
  { name: 'Cioccolato', category: 'Snack e Dolci', units: ['g', 'pz'] },
];

export const addRandomProducts = (setProducts: React.Dispatch<React.SetStateAction<Product[]>>, onSuccess?: () => void) => {
  const numProducts = Math.floor(Math.random() * 6) + 10; // 10 to 15
  const newRandomProducts: Product[] = [];
  
  // Shuffle the sample products to avoid duplicates
  const shuffledSamples = [...SAMPLE_PRODUCTS].sort(() => 0.5 - Math.random());
  const selectedSamples = shuffledSamples.slice(0, numProducts);
  
  for (const sample of selectedSamples) {
    const randomUnit = sample.units[Math.floor(Math.random() * sample.units.length)];
    
    let finalQuantity = Math.floor(Math.random() * 10) + 1;
    if (randomUnit === 'g' || randomUnit === 'ml') {
      finalQuantity = (Math.floor(Math.random() * 10) + 1) * 100;
    }

    const randomDays = Math.floor(Math.random() * 35) - 5;
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() + randomDays);
    const formattedDate = format(randomDate, 'yyyy-MM-dd', { locale: it });

    newRandomProducts.push({
      id: uuidv4(),
      name: sample.name,
      category: sample.category,
      expirationDate: formattedDate,
      quantity: finalQuantity,
      unit: randomUnit,
      createdAt: Date.now() - Math.floor(Math.random() * 10000000),
    });
  }

  setProducts(prev => {
    // Prevent duplicates with existing products by name
    const existingNames = new Set(prev.map(p => p.name.toLowerCase()));
    const uniqueNewProducts = newRandomProducts.filter(p => !existingNames.has(p.name.toLowerCase()));
    return [...prev, ...uniqueNewProducts];
  });
  
  if (onSuccess) onSuccess();
};
