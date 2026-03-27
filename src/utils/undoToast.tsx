import React from 'react';
import { toast } from 'react-hot-toast';

export function showUndoToast(
  message: string,
  onUndo: () => Promise<void>
) {
  toast(
    (t) => (
      <div className="flex items-center justify-between w-full gap-4">
        <span>{message}</span>
        <button
          onClick={async () => {
            toast.dismiss(t.id);
            await onUndo();
            toast.success('Azione annullata', { duration: 2000 });
          }}
          className="text-emerald-400 hover:text-emerald-300 font-medium text-sm px-2 py-1 rounded-md"
        >
          Annulla
        </button>
      </div>
    ),
    { duration: 2500 }
  );
}
