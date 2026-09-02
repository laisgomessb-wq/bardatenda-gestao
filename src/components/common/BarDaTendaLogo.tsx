import React from 'react';

interface BarDaTendaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showGlow?: boolean;
  alt?: string;
  id?: string;
}

const sizeClasses: Record<NonNullable<BarDaTendaLogoProps['size']>, string> = {
  xs: 'w-6 h-6',
  sm: 'w-8 h-8 sm:w-9 sm:h-9',
  md: 'w-10 h-10 sm:w-12 sm:h-12',
  lg: 'w-14 h-14 sm:w-16 sm:h-16',
  xl: 'w-20 h-20 sm:w-24 sm:h-24',
};

export const BarDaTendaLogo: React.FC<BarDaTendaLogoProps> = ({
  className = '',
  size = 'sm',
  showGlow = false,
  alt = 'Logo Bar da Tenda',
  id = 'bar-da-tenda-logo',
}) => {
  const baseSize = sizeClasses[size] || sizeClasses.sm;

  return (
    <div
      id={id}
      className={`relative inline-flex items-center justify-center shrink-0 select-none ${baseSize} ${className}`}
      title="Bar da Tenda"
    >
      {/* Brilho de fundo opcional para destacar a tampinha */}
      {showGlow && (
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-md pointer-events-none -z-10 animate-pulse" />
      )}

      {/* Imagem da Logomarca Oficial da Tampinha do Bar da Tenda */}
      <img
        src="/logo-transparent.png"
        onError={(e) => {
          // Fallback para SVG caso PNG falhe
          const target = e.currentTarget;
          if (target.src !== window.location.origin + '/logo.svg') {
            target.src = '/logo.svg';
          }
        }}
        alt={alt}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain rounded-full drop-shadow-md transition-transform duration-200 hover:scale-105"
      />
    </div>
  );
};

export default BarDaTendaLogo;
