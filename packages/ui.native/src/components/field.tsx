import { cn } from '@_/ui.utils/utils';
import { useMemo } from 'react';
import { View, type ViewProps } from 'react-native';
import { Label } from '@_/ui.native/components/label';
import { Text } from '@_/ui.native/components/text';

function Field({
  className,
  orientation = 'vertical',
  ...props
}: ViewProps & {
  orientation?: 'vertical' | 'horizontal';
}) {
  return (
    <View
      role="group"
      className={cn(
        'flex w-full gap-3',
        orientation === 'vertical' && 'flex-col',
        orientation === 'horizontal' && 'flex-row items-center',
        className
      )}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      className={cn('flex w-fit gap-2 leading-snug', className)}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<typeof Text>) {
  return (
    <Text
      variant="muted"
      className={cn('text-sm leading-normal font-normal', className)}
      {...props}
    />
  );
}

function FieldError({
  className,
  children,
  errors,
  ...props
}: React.ComponentProps<typeof Text> & {
  errors?: Array<string | { message?: string } | undefined>;
}) {
  const content = useMemo(() => {
    if (children) {
      return children;
    }

    if (!errors?.length) {
      return null;
    }

    // Normalize errors to strings
    const errorStrings = errors
      .map((error) => {
        if (typeof error === 'string') return error;
        if (error?.message) return error.message;
        return null;
      })
      .filter((e): e is string => e !== null);

    const uniqueErrors = [...new Set(errorStrings)];

    if (uniqueErrors.length === 0) {
      return null;
    }

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0];
    }

    // For multiple errors, just show the first one on native
    // (native doesn't have the same list styling capabilities as web)
    return uniqueErrors[0];
  }, [children, errors]);

  if (!content) {
    return null;
  }

  return (
    <Text
      role="alert"
      className={cn('text-destructive text-sm font-normal', className)}
      {...props}
    >
      {content}
    </Text>
  );
}

function FieldContent({ className, ...props }: ViewProps) {
  return (
    <View
      className={cn('flex flex-1 flex-col gap-1.5 leading-snug', className)}
      {...props}
    />
  );
}

export { Field, FieldLabel, FieldDescription, FieldError, FieldContent };
