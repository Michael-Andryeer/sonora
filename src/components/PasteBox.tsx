import { useState } from 'react';

interface PasteBoxProps {
  onConvert: (text: string) => void;
  disabled?: boolean;
}

export default function PasteBox({ onConvert, disabled }: PasteBoxProps) {
  const [text, setText] = useState('');

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Cole um link do YouTube aqui…"
        rows={3}
        className="resize-none rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-sm outline-none focus:border-emerald-500"
      />
      <button
        onClick={() => onConvert(text)}
        disabled={disabled || text.trim().length === 0}
        className="rounded-xl bg-emerald-500 px-4 py-3 font-medium text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Converter
      </button>
    </div>
  );
}
