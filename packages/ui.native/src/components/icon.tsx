import { cn } from '@_/ui.utils';
import type { LucideIcon, LucideProps } from 'lucide-react-native';
import { styled } from 'nativewind';

type IconProps = LucideProps & {
  as: LucideIcon;
  className?: string;
  size?: number,
};

/**
 * A wrapper component for Lucide icons with NativeWind v5 `className` support.
 *
 * Uses NativeWind v5's styled() function to enable className styling on lucide-react-native icons.
 * Extracts color from className and maps it to the icon's color prop.
 *
 * @component
 * @example
 * ```tsx
 * import { ArrowRight } from 'lucide-react-native';
 * import { Icon } from '@/components/ui/icon';
 *
 * <Icon as={ArrowRight} className="text-red-500" size={16} />
 * ```
 *
 * @param {LucideIcon} as - The Lucide icon component to render.
 * @param {string} className - Utility classes to style the icon using NativeWind.
 * @param {number} size - Icon size (defaults to 24).
 * @param {...LucideProps} ...props - Additional Lucide icon props passed to the "as" icon.
 */
function Icon({ as: IconComponent, className, size = 24, ...props }: IconProps) {
  const StyledIcon = styled(IconComponent, {
    className: {
      target: 'style',
      nativeStyleMapping: {
        color: 'color',
        opacity: 'opacity',
      },
    },
  });

  return (
    <StyledIcon
      className={cn('text-foreground', className)}
      size={size}
      {...props}
    />
  );
}

export { Icon };
