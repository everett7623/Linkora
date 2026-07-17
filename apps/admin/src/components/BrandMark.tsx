import { clsx } from 'clsx';
import { useTheme } from '../contexts/ThemeContext';

type BrandMarkSize = 'sm' | 'md' | 'lg';

interface BrandMarkProps {
  size?: BrandMarkSize;
  decorative?: boolean;
  className?: string;
}

const sizeClasses: Record<BrandMarkSize, string> = {
  sm: 'h-7 w-7 rounded-lg',
  md: 'h-10 w-10 rounded-xl',
  lg: 'h-24 w-24 rounded-2xl',
};

export function BrandMark({ size = 'md', decorative = true, className }: BrandMarkProps) {
  const { resolvedTheme } = useTheme();
  const src = resolvedTheme === 'light' ? '/favicon-light.svg' : '/favicon.svg';

  return (
    <img
      src={src}
      alt={decorative ? '' : 'Linketry'}
      aria-hidden={decorative ? 'true' : undefined}
      className={clsx('block shrink-0', sizeClasses[size], className)}
    />
  );
}
