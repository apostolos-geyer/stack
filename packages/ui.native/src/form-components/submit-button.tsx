import { useFormContext } from '@_/lib.client/form';
import { ActivityIndicator, View } from 'react-native';
import { Button, type ButtonProps } from '../components/button';
import { Text } from '../components/text';

export interface SubmitButtonProps extends Omit<ButtonProps, 'onPress' | 'disabled'> {
  children: React.ReactNode;
  loadingText?: string;
}

export function SubmitButton({ children, loadingText = 'Submitting...', ...props }: SubmitButtonProps) {
  const form = useFormContext();

  return (
    <form.Subscribe
      selector={(state: { canSubmit: boolean; isSubmitting: boolean }) => ({
        canSubmit: state.canSubmit,
        isSubmitting: state.isSubmitting,
      })}
    >
      {({ canSubmit, isSubmitting }: { canSubmit: boolean; isSubmitting: boolean }) => (
        <Button onPress={form.handleSubmit} disabled={!canSubmit || isSubmitting} {...props}>
          {isSubmitting ? (
            <View className="flex-row items-center gap-2">
              <ActivityIndicator size="small" color="white" />
              <Text>{loadingText}</Text>
            </View>
          ) : (
            <Text>{children}</Text>
          )}
        </Button>
      )}
    </form.Subscribe>
  );
}
