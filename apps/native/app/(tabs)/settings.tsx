import {
  createAccountFeatures,
  useAccountFeatures,
} from '@_/features.client/account';
import { useAuthFeatures } from '@_/features.client/auth';
import { Provide } from '@_/lib.client';
import { Badge } from '@_/ui.native/components/badge';
import { Button } from '@_/ui.native/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@_/ui.native/components/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@_/ui.native/components/tabs';
import { Text } from '@_/ui.native/components/text';
import { useAppForm } from '@_/ui.native/form';
import { useRouter } from 'expo-router';
import {
  Key,
  LogOut,
  Mail,
  MonitorSmartphone,
  Shield,
  Trash2,
  User,
} from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { DefaultAppView } from '@/components/AppView';

function ProfileForm() {
  const { session } = useAuthFeatures();
  const {
    updateProfileDefaultValues,
    updateProfileSchema,
    updateProfileMutation,
  } = useAccountFeatures();
  const user = session.data?.user;

  const form = useAppForm({
    defaultValues: updateProfileDefaultValues,
    validators: {
      onBlur: updateProfileSchema,
      onSubmit: updateProfileSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await updateProfileMutation.mutateAsync(value);
        Alert.alert('Success', 'Profile updated successfully');
      } catch (e) {
        Alert.alert('Error', (e as Error).message);
      }
    },
  });

  useEffect(() => {
    if (user) {
      form.setFieldValue('name', user.name || '');
      form.setFieldValue('image', user.image || '');
    }
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <View className="flex-row items-center gap-2">
          <User size={20} className="text-foreground" />
          <CardTitle>Profile</CardTitle>
        </View>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <View className="gap-4">
            <form.AppField name="name">
              {(field) => (
                <field.TextField label="Name" placeholder="Your name" />
              )}
            </form.AppField>

            <form.AppField name="image">
              {(field) => (
                <field.TextField
                  label="Profile Image URL"
                  placeholder="https://example.com/avatar.jpg"
                />
              )}
            </form.AppField>
          </View>

          <View className="mt-6">
            <form.SubmitButton loadingText="Saving...">
              Save Changes
            </form.SubmitButton>
          </View>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

function EmailForm() {
  const { session } = useAuthFeatures();
  const { changeEmailDefaultValues, changeEmailSchema, changeEmailMutation } =
    useAccountFeatures();
  const user = session.data?.user;

  const form = useAppForm({
    defaultValues: changeEmailDefaultValues,
    validators: {
      onBlur: changeEmailSchema,
      onSubmit: changeEmailSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await changeEmailMutation.mutateAsync(value);
        Alert.alert('Success', 'Verification email sent to your new address');
        form.reset();
      } catch (e) {
        Alert.alert('Error', (e as Error).message);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <View className="flex-row items-center gap-2">
          <Mail size={20} className="text-foreground" />
          <CardTitle>Email Address</CardTitle>
        </View>
        <CardDescription>
          Change your email address. A verification email will be sent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <View className="flex-row items-center gap-2 mb-4">
          <Text className="text-sm text-muted-foreground">Current email:</Text>
          <Text className="text-sm font-medium">{user?.email}</Text>
        </View>

        <form.AppForm>
          <View className="gap-4">
            <form.AppField name="newEmail">
              {(field) => (
                <field.EmailField
                  label="New Email Address"
                  placeholder="newemail@example.com"
                />
              )}
            </form.AppField>
          </View>

          <View className="mt-6">
            <form.SubmitButton loadingText="Sending...">
              Change Email
            </form.SubmitButton>
          </View>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

function PasswordForm() {
  const {
    changePasswordDefaultValues,
    changePasswordSchema,
    changePasswordMutation,
  } = useAccountFeatures();

  const form = useAppForm({
    defaultValues: changePasswordDefaultValues,
    validators: {
      onBlur: changePasswordSchema,
      onSubmit: changePasswordSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await changePasswordMutation.mutateAsync(value);
        Alert.alert('Success', 'Password changed successfully');
        form.reset();
      } catch (e) {
        Alert.alert('Error', (e as Error).message);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <View className="flex-row items-center gap-2">
          <Key size={20} className="text-foreground" />
          <CardTitle>Password</CardTitle>
        </View>
        <CardDescription>Change your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <View className="gap-4">
            <form.AppField name="currentPassword">
              {(field) => (
                <field.PasswordField
                  label="Current Password"
                  placeholder="Enter current password"
                />
              )}
            </form.AppField>

            <form.AppField name="newPassword">
              {(field) => (
                <field.PasswordField
                  label="New Password"
                  placeholder="Enter new password"
                />
              )}
            </form.AppField>

            <form.AppField name="confirmPassword">
              {(field) => (
                <field.PasswordField
                  label="Confirm New Password"
                  placeholder="Confirm new password"
                />
              )}
            </form.AppField>

            <form.AppField name="revokeOtherSessions">
              {(field) => (
                <field.CheckboxField label="Sign out of all other devices" />
              )}
            </form.AppField>
          </View>

          <View className="mt-6">
            <form.SubmitButton loadingText="Changing...">
              Change Password
            </form.SubmitButton>
          </View>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}

function DeleteAccountSection() {
  const router = useRouter();
  const { deleteAccountMutation } = useAccountFeatures();

  const handleDelete = () => {
    Alert.prompt(
      'Delete Account',
      'This action cannot be undone. Enter your password to confirm.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async (password: string | undefined) => {
            if (!password) {
              Alert.alert('Error', 'Password is required');
              return;
            }
            try {
              await deleteAccountMutation.mutateAsync({
                password,
                confirmation: 'DELETE',
              });
              Alert.alert('Success', 'Account deleted');
              router.replace('/(auth)');
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            }
          },
        },
      ],
      'secure-text',
    );
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <View className="flex-row items-center gap-2">
          <Shield size={20} className="text-destructive" />
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </View>
        <CardDescription>
          Irreversible actions that affect your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button
          variant="destructive"
          onPress={handleDelete}
          disabled={deleteAccountMutation.isPending}
        >
          <Trash2 size={18} className="text-destructive-foreground mr-2" />
          <Text className="text-destructive-foreground">
            {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete Account'}
          </Text>
        </Button>
      </CardContent>
    </Card>
  );
}

function SessionsSection() {
  const { sessionsQuery, revokeSessionMutation, revokeAllSessionsMutation } =
    useAccountFeatures();
  const { session: currentSession } = useAuthFeatures();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleRevoke = async (token: string) => {
    Alert.alert(
      'Revoke Session',
      'Are you sure you want to revoke this session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeSessionMutation.mutateAsync(token);
              Alert.alert('Success', 'Session revoked');
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            }
          },
        },
      ],
    );
  };

  const handleRevokeAll = async () => {
    Alert.alert(
      'Revoke All Sessions',
      'Are you sure you want to sign out of all other devices?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke All',
          style: 'destructive',
          onPress: async () => {
            try {
              await revokeAllSessionsMutation.mutateAsync();
              Alert.alert('Success', 'All other sessions revoked');
            } catch (e) {
              Alert.alert('Error', (e as Error).message);
            }
          },
        },
      ],
    );
  };

  return (
    <Card>
      <CardHeader>
        <View className="flex-row items-center justify-between">
          <View>
            <View className="flex-row items-center gap-2">
              <MonitorSmartphone size={20} className="text-foreground" />
              <CardTitle>Active Sessions</CardTitle>
            </View>
            <CardDescription>
              Manage your active sessions across devices
            </CardDescription>
          </View>
        </View>
        {sessionsQuery.data && sessionsQuery.data.length > 1 && (
          <Button
            variant="outline"
            size="sm"
            onPress={handleRevokeAll}
            disabled={revokeAllSessionsMutation.isPending}
            className="mt-2"
          >
            <LogOut size={16} className="text-foreground mr-2" />
            <Text>Sign out all other devices</Text>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {sessionsQuery.isLoading ? (
          <Text className="text-sm text-muted-foreground">
            Loading sessions...
          </Text>
        ) : sessionsQuery.error ? (
          <Text className="text-sm text-destructive">
            Failed to load sessions: {sessionsQuery.error.message}
          </Text>
        ) : (
          <View className="gap-3">
            {sessionsQuery.data?.map((s) => {
              const isCurrentSession =
                currentSession.data?.session?.id === s.id;
              return (
                <View
                  key={s.id}
                  className="flex-row items-center justify-between p-3 border border-border rounded-lg"
                >
                  <View className="flex-1 gap-1">
                    <View className="flex-row items-center gap-2">
                      <Text className="text-sm font-medium">
                        {s.userAgent
                          ? s.userAgent.split(' ')[0]
                          : 'Unknown Device'}
                      </Text>
                      {isCurrentSession && (
                        <Badge variant="secondary">
                          <Text className="text-xs">Current</Text>
                        </Badge>
                      )}
                    </View>
                    <Text className="text-xs text-muted-foreground">
                      IP: {s.ipAddress || 'Unknown'}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      Created: {formatDate(s.createdAt)}
                    </Text>
                  </View>
                  {!isCurrentSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onPress={() => handleRevoke(s.token)}
                      disabled={revokeSessionMutation.isPending}
                    >
                      <LogOut size={16} className="text-foreground" />
                    </Button>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </CardContent>
    </Card>
  );
}

const SettingsScreen = Provide(
  [createAccountFeatures(), DefaultAppView],
  function SettingsScreenContent() {
    const [tab, setTab] = useState('profile');
    return (
      <>
        <Text variant="h2" className="mb-6">
          Settings
        </Text>

        <Tabs value={tab} onValueChange={setTab} className="flex-1">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="flex-1">
            <View className="gap-6">
              <ProfileForm />
              <EmailForm />
            </View>
          </TabsContent>

          <TabsContent value="security">
            <View className="gap-6">
              <PasswordForm />
              <DeleteAccountSection />
            </View>
          </TabsContent>

          <TabsContent value="sessions">
            <SessionsSection />
          </TabsContent>
        </Tabs>
      </>
    );
  },
);

export default SettingsScreen;
