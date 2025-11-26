import { useState } from 'react';
import { cn } from '@_/ui.utils/utils';
import { Platform, TextInput, type TextInputProps } from 'react-native';

function Textarea({
  className,
  multiline = true,
  numberOfLines = Platform.select({ web: 2, native: 8 }), // On web, numberOfLines also determines initial height. On native, it determines the maximum height.
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
        'text-foreground border-input dark:bg-input/30 flex min-h-16 w-full flex-row rounded-md border bg-transparent px-3 py-2 text-base shadow-sm shadow-black/5 md:text-sm',
        Platform.select({
          web: cn(
            'placeholder:text-muted-foreground aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive field-sizing-content resize-y outline-none transition-[color,box-shadow] disabled:cursor-not-allowed',
            'focus-visible:border-ring focus-visible:shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] dark:focus-visible:shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]'
          ),
          native: 'placeholder:text-muted-foreground/50',
        }),
        props.editable === false && 'opacity-50',
        // Native focus styles - simulate inset with darker border and background
        Platform.OS !== 'web' && isFocused && 'border-ring bg-muted/30 border-2',
        className
      )}
      placeholderClassName={cn('text-muted-foreground', placeholderClassName)}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      {...props}
    />
  );
}

export { Textarea };
