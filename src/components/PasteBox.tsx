import { useState } from 'react';

interface PasteBoxProps {
  onConvert: (text: string) => void;
}

export default function PasteBox({ onConvert }: PasteBoxProps) {
  const [text, setText] = useState('');

  const handleConvert = () => {
    onConvert(text);
    setText('');
  };

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        placeholder="Cole um ou vários links do YouTube (separados por espaço, vírgula ou linha), ou uma playlist…"
        rows={3}
        className="resize-none rounded-xl border border-line bg-panel p-4 text-sm text-cream placeholder:text-taupe/70 outline-none transition focus:border-glow focus:shadow-glow"
      />
      <button
        onClick={handleConvert}
        disabled={text.trim().length === 0}
        className="rounded-xl bg-glow px-4 py-3 font-semibold tracking-wide text-ink transition hover:bg-glow-bright disabled:cursor-not-allowed disabled:opacity-30"
      >
        Converter
      </button>
    </div>
  );
}
