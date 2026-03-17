import { differenceInDays, parseISO, isValid } from 'date-fns';

export function getExpiryInfo(dateString: string) {
  if (!dateString) {
    return {
      days: 0,
      colorClass: 'text-stone-500 bg-stone-50 border-stone-200',
      borderClass: 'border-l-stone-400',
      text: 'Data non disponibile',
    };
  }

  let parsed: Date;
  try {
    parsed = parseISO(dateString);
    if (!isValid(parsed)) throw new Error();
  } catch {
    return {
      days: 0,
      colorClass: 'text-stone-500 bg-stone-50 border-stone-200',
      borderClass: 'border-l-stone-400',
      text: 'Data non valida',
    };
  }

  const days = differenceInDays(parsed, new Date());

  let colorClass  = '';
  let borderClass = '';
  let text        = '';

  if (days < 0) {
    colorClass  = 'text-red-600 bg-red-50 border-red-200';
    borderClass = 'border-l-red-500';
    text        = `Scaduto da ${Math.abs(days)} giorni`;
  } else if (days === 0) {
    colorClass  = 'text-orange-600 bg-orange-50 border-orange-200';
    borderClass = 'border-l-orange-500';
    text        = 'Scade oggi';
  } else if (days <= 3) {
    colorClass  = 'text-orange-600 bg-orange-50 border-orange-200';
    borderClass = 'border-l-orange-500';
    text        = days === 1 ? 'Scade domani' : `Scade tra ${days} giorni`;
  } else if (days <= 7) {
    colorClass  = 'text-yellow-600 bg-yellow-50 border-yellow-200';
    borderClass = 'border-l-amber-400';
    text        = `Scade tra ${days} giorni`;
  } else {
    colorClass  = 'text-emerald-600 bg-emerald-50 border-emerald-200';
    borderClass = 'border-l-emerald-500';
    text        = `Scade tra ${days} giorni`;
  }

  return { days, colorClass, borderClass, text };
}