export enum SortOption {
  ExpiryAsc = 'expiryAsc',
  ExpiryDesc = 'expiryDesc',
  AddedDesc = 'addedDesc',
  AddedAsc = 'addedAsc',
  QtyDesc = 'qtyDesc',
  QtyAsc = 'qtyAsc',
  NameAsc = 'nameAsc',
  NameDesc = 'nameDesc'
}

export const SORT_OPTIONS = [
  { value: SortOption.ExpiryAsc, label: 'Scadenza (più vicina)' },
  { value: SortOption.ExpiryDesc, label: 'Scadenza (più lontana)' },
  { value: SortOption.AddedDesc, label: 'Aggiunti di recente' },
  { value: SortOption.AddedAsc, label: 'Aggiunti meno di recente' },
  { value: SortOption.QtyDesc, label: 'Quantità (maggiore)' },
  { value: SortOption.QtyAsc, label: 'Quantità (minore)' },
  { value: SortOption.NameAsc, label: 'Nome (A-Z)' },
  { value: SortOption.NameDesc, label: 'Nome (Z-A)' }
] as const;
