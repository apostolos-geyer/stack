import { TextClassContext } from '@_/ui.native/components/text';
import { cn } from '@_/ui.utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Platform, Pressable } from 'react-native';

const buttonVariants = cva(
  cn(
    'group shrink-0 flex-row items-center justify-center gap-2 rounded-md',
    Platform.select({
      web: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive whitespace-nowrap outline-none transition-all focus-visible:ring-[3px] disabled:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
      native: 'border-t border-b border-t-white/20 border-b-black/20 active:border-t-black/10 active:border-b-white/10',
    })
  ),
  {
    variants: {
      variant: {
        default: cn(
          'bg-primary shadow-md shadow-black/20',
          Platform.select({
            web: 'hover:bg-primary/90 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-px',
            native: 'active:bg-primary/80',
          })
        ),
        destructive: cn(
          'bg-destructive dark:bg-destructive/60 shadow-md shadow-black/20',
          Platform.select({
            web: 'hover:bg-destructive/90 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.2)] active:translate-y-px focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
            native: 'active:bg-destructive/80',
          })
        ),
        outline: cn(
          'border-border bg-background dark:bg-input/30 dark:border-input border shadow-md shadow-black/10',
          Platform.select({
            web: 'hover:bg-accent dark:hover:bg-input/50 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] active:translate-y-px',
            native: 'active:bg-accent dark:active:bg-input/50 border-t-transparent border-b-transparent',
          })
        ),
        secondary: cn(
          'bg-secondary shadow-md shadow-black/15',
          Platform.select({
            web: 'hover:bg-secondary/80 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.15)] active:translate-y-px',
            native: 'active:bg-secondary/80',
          })
        ),
        ghost: cn(
          Platform.select({
            web: 'hover:bg-accent dark:hover:bg-accent/50 active:bg-accent/80 active:translate-y-px',
            native: 'active:bg-accent dark:active:bg-accent/50 border-t-transparent border-b-transparent',
          })
        ),
        link: 'border-t-transparent border-b-transparent',
      },
      size: {
        default: cn('h-10 px-4 py-2 sm:h-9', Platform.select({ web: 'has-[>svg]:px-3' })),
        sm: cn('h-9 gap-1.5 rounded-md px-3 sm:h-8', Platform.select({ web: 'has-[>svg]:px-2.5' })),
        lg: cn('h-11 rounded-md px-6 sm:h-10', Platform.select({ web: 'has-[>svg]:px-4' })),
        icon: 'h-10 w-10 sm:h-9 sm:w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  cn(
    'text-foreground text-sm font-medium',
    Platform.select({ web: 'pointer-events-none transition-colors' })
  ),
  {
    variants: {
      variant: {
        default: 'text-primary-foreground',
        destructive: 'text-white',
        outline: cn(
          'group-active:text-accent-foreground',
          Platform.select({ web: 'group-hover:text-accent-foreground' })
        ),
        secondary: 'text-secondary-foreground',
        ghost: 'group-active:text-accent-foreground',
        link: cn(
          'text-primary group-active:underline',
          Platform.select({ web: 'underline-offset-4 hover:underline group-hover:underline' })
        ),
      },
      size: {
        default: '',
        sm: '',
        lg: '',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentProps<typeof Pressable> &
  React.RefAttributes<typeof Pressable> &
  VariantProps<typeof buttonVariants>;

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable
        className={cn(props.disabled && 'opacity-50', buttonVariants({ variant, size }), className)}
        role="button"
        {...props}
      />
    </TextClassContext.Provider>
  );
}

export { Button, buttonTextVariants, buttonVariants };
export type { ButtonProps };
