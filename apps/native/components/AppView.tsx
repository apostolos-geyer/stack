import { SafeAreaView } from 'react-native-safe-area-context';

export const DefaultAppView = ({
  ...props
}: React.ComponentProps<typeof SafeAreaView>) => (
  <SafeAreaView
    style={{ flex: 1, paddingHorizontal: 12 }}
    edges={{ top: 'additive' }}
    {...props}
  />
);
