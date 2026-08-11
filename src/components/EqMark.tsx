const DELAYS = [0, 0.22, 0.44, 0.15, 0.33];

interface EqMarkProps {
  className?: string;
}

export default function EqMark({ className }: EqMarkProps) {
  return (
    <div className={`flex items-end gap-[3px] ${className ?? ''}`} aria-hidden="true">
      {DELAYS.map((delay, index) => (
        <span
          key={index}
          className="eq-bar h-full w-[3px] rounded-full bg-glow"
          style={{ animationDelay: `${delay}s` }}
        />
      ))}
    </div>
  );
}
