import { useState } from 'react';
import { cn } from '@_/ui.utils/utils';
import { Platform, TextInput, type TextInputProps } from 'react-native';

function Input({
  className,
  placeholderClassName,
  onFocus,
  onBlur,
  ...props
}: TextInputProps & React.RefAttributes<TextInput>) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      onFocus={(e) => {
        setIsFocused(true);
        onFocus?.(e);
      }}
      onBlur={(e) => {
        setIsFocused(false);
        onBlur?.(e);
      }}
      className={cn(
        'dark:bg-input/30 border-input bg-background text-foreground flex h-10 w-full min-w-0 flex-row items-center rounded-md border px-3 py-1 text-base leading-5 shadow-sm shadow-black/5 sm:h-9',
        props.editable === false &&
          cn(
            'opacity-50',
            Platform.select({ web: 'disabled:pointer-events-none disabled:cursor-not-allowed' })
          ),
        Platform.select({
          web: cn(
            'placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground outline-none transition-[color,box-shadow] md:text-sm',
            'focus-visible:border-ring focus-visible:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:focus-visible:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
            'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive'
          ),
          native: 'placeholder:text-muted-foreground/50',
        }),
        // Native focus styles - simulate inset with darker border and background
        Platform.OS !== 'web' && isFocused && 'border-ring bg-muted/30 border-2',
        className
      )}
      {...props}
    />
  );
}

export { Input };
