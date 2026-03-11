import { differenceInDays, parseISO } from 'date-fns';

export function getExpiryInfo(dateString: string) {
  const days = differenceInDays(parseISO(dateString), new Date());
  
  let colorClass = '';
  let text = '';

  if (days < 0) {
    colorClass = 'text-red-600 bg-red-50 border-red-200';
    text = `Scaduto da ${Math.abs(days)} giorni`;
  } else if (days === 0) {
    colorClass = 'text-orange-600 bg-orange-50 border-orange-200';
    text = 'Scade oggi';
  } else if (days === 1) {
    colorClass = 'text-orange-600 bg-orange-50 border-orange-200';
    text = 'Scade domani';
  } else if (days <= 3) {
    colorClass = 'text-orange-600 bg-orange-50 border-orange-200';
    text = `Scade tra ${days} giorni`;
  } else if (days <= 7) {
    colorClass = 'text-yellow-600 bg-yellow-50 border-yellow-200';
    text = `Scade tra ${days} giorni`;
  } else {
    colorClass = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    text = `Scade tra ${days} giorni`;
  }

  return { days, colorClass, text };
}
