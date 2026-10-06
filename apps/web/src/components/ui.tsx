import Image from 'next/image';
import type { ReactNode } from 'react';

const STEPPER_VARIANTS = {
  solid: 'bg-primary text-on-primary',
  soft: 'bg-primary-soft text-primary',
  outline: 'border-[1.5px] border-line bg-surface text-ink',
} as const;

/** `[– n +]` with 44px touch targets. */
export function Stepper({
  value,
  onDecrement,
  onIncrement,
  variant = 'solid',
  label,
  minWidth = 'min-w-5',
}: {
  value: number;
  onDecrement: () => void;
  onIncrement: () => void;
  variant?: keyof typeof STEPPER_VARIANTS;
  /** What is being counted, for screen readers. */
  label: string;
  minWidth?: string;
}) {
  return (
    <div
      className={`flex h-11 w-max flex-none items-center rounded-pill font-bold ${STEPPER_VARIANTS[variant]}`}
    >
      <button
        type="button"
        onClick={onDecrement}
        aria-label={`Bớt ${label}`}
        className="h-11 w-11 text-xl font-semibold"
      >
        –
      </button>
      <span
        className={`${minWidth} text-center tabular-nums`}
        aria-live="polite"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={onIncrement}
        aria-label={`Thêm ${label}`}
        className="h-11 w-11 text-xl font-semibold"
      >
        +
      </button>
    </div>
  );
}

/** Store mark: the logo image when there is one, else the brand monogram. */
export function StoreMark({
  monogram,
  logoUrl,
  name,
  tone = 'primary',
}: {
  monogram: string;
  logoUrl?: string;
  name: string;
  tone?: 'primary' | 'footer';
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={38}
        height={38}
        className="size-[38px] flex-none rounded-full object-cover"
      />
    );
  }
  return (
    <div
      aria-hidden
      className={
        tone === 'primary'
          ? 'grid size-[38px] flex-none place-items-center rounded-full bg-primary font-head text-xl font-extrabold text-on-primary shadow-[inset_0_0_0_3px_var(--c-primary),inset_0_0_0_4.5px_rgba(255,252,246,.5)]'
          : 'grid size-[38px] flex-none place-items-center rounded-full bg-on-footer font-head text-xl font-extrabold text-footer'
      }
    >
      {monogram}
    </div>
  );
}

/** Dashed circle with the monogram, used in empty states. */
export function EmptyMark({
  monogram,
  size = 'md',
}: {
  monogram: string;
  size?: 'md' | 'lg';
}) {
  return (
    <div
      aria-hidden
      className={`mx-auto grid place-items-center rounded-full border-2 border-dashed border-line font-head font-extrabold text-ink-3 ${
        size === 'lg' ? 'mb-3.5 size-16 text-[28px]' : 'mb-2.5 size-[52px] text-[22px]'
      }`}
    >
      {monogram}
    </div>
  );
}

export function SectionCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-lg border border-line bg-surface ${className}`}
    >
      {children}
    </section>
  );
}

export function Spinner() {
  return (
    <span
      aria-hidden
      className="size-[18px] animate-spin rounded-full border-[2.5px] border-[rgba(255,252,246,.35)] border-t-on-accent"
    />
  );
}
