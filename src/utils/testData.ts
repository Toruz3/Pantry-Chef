import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { Product } from '../types';
import { PRODUCT_UNITS } from '../constants/units';

export const addRandomProducts = (setProducts: React.Dispatch<React.SetStateAction<Product[]>>, onSuccess?: () => void) => {
  const sampleNames = ['Pasta', 'Riso', 'Uova', 'Latte', 'Pollo', 'Zucchine', 'Pomodori', 'Tonno', 'Olio', 'Sale', 'Zucchero', 'Farina', 'Burro', 'Formaggio', 'Mele', 'Patate', 'Cipolle', 'Carote', 'Piselli', 'Pane'];
  const units = PRODUCT_UNITS;
  
  const numProducts = Math.floor(Math.random() * 6) + 10; // 10 to 15
  const newRandomProducts: Product[] = [];
  
  for (let i = 0; i < numProducts; i++) {
    const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const randomUnit = units[Math.floor(Math.random() * units.length)];
    
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
      name: `${randomName} ${Math.floor(Math.random() * 100)}`,
      expirationDate: formattedDate,
      quantity: finalQuantity,
      unit: randomUnit,
      createdAt: Date.now() - Math.floor(Math.random() * 10000000),
    });
  }

  setProducts(prev => [...prev, ...newRandomProducts]);
  if (onSuccess) onSuccess();
};
