import { useAuthFeatures } from '@_/features.client/auth';
import { Button } from '@_/ui.native/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@_/ui.native/components/card';
import { Text } from '@_/ui.native/components/text';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { LogOut, User } from 'lucide-react-native';
import { View } from 'react-native';

import { DefaultAppView } from '@/components/AppView';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  theme.colors.background;

  const { session, authClient } = useAuthFeatures();
  const user = session.data?.user;

  const handleSignOut = async () => {
    await authClient.signOut();
    router.replace('/(auth)');
  };

  return (
    <DefaultAppView>
      <Text variant="h2" className="mb-6">
        Home
      </Text>
      <Card>
        <CardHeader>
          <View className="flex-row items-center gap-3">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              {user?.image ? (
                <View className="h-12 w-12 rounded-full overflow-hidden">
                  {/* Image would go here */}
                </View>
              ) : (
                <User size={24} className="text-primary" />
              )}
            </View>
            <View className="flex-1">
              <CardTitle>{user?.name || 'User'}</CardTitle>
              <Text className="text-sm text-muted-foreground">
                {user?.email}
              </Text>
            </View>
          </View>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onPress={handleSignOut}>
            <LogOut size={18} className="text-foreground mr-2" />
            <Text>Sign Out</Text>
          </Button>
        </CardContent>
      </Card>
    </DefaultAppView>
  );
}
