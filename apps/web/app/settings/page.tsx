'use client';

import {
  createAccountFeatures,
  useAccountFeatures,
} from '@_/features.client/account';
import { useAuthFeatures } from '@_/features.client/auth';
import { Provide } from '@_/lib.client';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@_/ui.web/components/alert-dialog';
import { Badge } from '@_/ui.web/components/badge';
import { Button } from '@_/ui.web/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@_/ui.web/components/card';
import { FieldGroup } from '@_/ui.web/components/field';
import { Separator } from '@_/ui.web/components/separator';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@_/ui.web/components/tabs';
import { useAppForm } from '@_/ui.web/form';
import {
  KeyIcon,
  LogOutIcon,
  MailIcon,
  MonitorSmartphoneIcon,
  ShieldIcon,
  TrashIcon,
  UserIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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
        toast.success('Profile updated successfully');
      } catch (e) {
        toast.error((e as Error).message);
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
        <CardTitle className="text-lg flex items-center gap-2">
          <UserIcon className="h-5 w-5" />
          Profile
        </CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
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
            </FieldGroup>

            <div className="mt-6">
              <form.SubmitButton disabled={updateProfileMutation.isPending}>
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </form.SubmitButton>
            </div>
          </form>
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
        toast.success('Verification email sent to your new address');
        form.reset();
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MailIcon className="h-5 w-5" />
          Email Address
        </CardTitle>
        <CardDescription>
          Change your email address. A verification email will be sent.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Current email:</span>
          <span className="text-sm font-medium">{user?.email}</span>
          {user?.emailVerified ? (
            <Badge
              variant="outline"
              className="text-green-600 border-green-600"
            >
              Verified
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="text-yellow-600 border-yellow-600"
            >
              Unverified
            </Badge>
          )}
        </div>

        <Separator />

        <form.AppForm>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.AppField name="newEmail">
                {(field) => (
                  <field.EmailField
                    label="New Email Address"
                    placeholder="newemail@example.com"
                  />
                )}
              </form.AppField>
            </FieldGroup>

            <div className="mt-6">
              <form.SubmitButton disabled={changeEmailMutation.isPending}>
                {changeEmailMutation.isPending ? 'Sending...' : 'Change Email'}
              </form.SubmitButton>
            </div>
          </form>
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
        toast.success('Password changed successfully');
        form.reset();
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <KeyIcon className="h-5 w-5" />
          Password
        </CardTitle>
        <CardDescription>Change your account password</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
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
            </FieldGroup>

            <div className="mt-6">
              <form.SubmitButton disabled={changePasswordMutation.isPending}>
                {changePasswordMutation.isPending
                  ? 'Changing...'
                  : 'Change Password'}
              </form.SubmitButton>
            </div>
          </form>
        </form.AppForm>
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
    try {
      await revokeSessionMutation.mutateAsync(token);
      toast.success('Session revoked');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleRevokeAll = async () => {
    try {
      await revokeAllSessionsMutation.mutateAsync();
      toast.success('All other sessions revoked');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <MonitorSmartphoneIcon className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage your active sessions across devices
            </CardDescription>
          </div>
          {sessionsQuery.data && sessionsQuery.data.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevokeAll}
              disabled={revokeAllSessionsMutation.isPending}
            >
              <LogOutIcon className="h-4 w-4 mr-2" />
              Sign out all other devices
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {sessionsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">
            Loading sessions...
          </div>
        ) : sessionsQuery.error ? (
          <div className="text-sm text-destructive">
            Failed to load sessions: {sessionsQuery.error.message}
          </div>
        ) : (
          <div className="space-y-3">
            {sessionsQuery.data?.map((s) => {
              const isCurrentSession =
                currentSession.data?.session?.id === s.id;
              return (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {s.userAgent
                          ? s.userAgent.split(' ')[0]
                          : 'Unknown Device'}
                      </span>
                      {isCurrentSession && (
                        <Badge variant="secondary">Current</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>IP: {s.ipAddress || 'Unknown'}</div>
                      <div>Created: {formatDate(s.createdAt)}</div>
                      <div>Expires: {formatDate(s.expiresAt)}</div>
                    </div>
                  </div>
                  {!isCurrentSession && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevoke(s.token)}
                      disabled={revokeSessionMutation.isPending}
                    >
                      <LogOutIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DeleteAccountDialog() {
  const {
    deleteAccountDefaultValues,
    deleteAccountSchema,
    deleteAccountMutation,
  } = useAccountFeatures();
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useAppForm({
    defaultValues: deleteAccountDefaultValues,
    validators: {
      onBlur: deleteAccountSchema,
      onSubmit: deleteAccountSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await deleteAccountMutation.mutateAsync(value);
        toast.success('Account deleted');
      } catch (e) {
        toast.error((e as Error).message);
      }
    },
  });

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-destructive">
          <ShieldIcon className="h-5 w-5" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Irreversible actions that affect your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Account</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form.AppForm>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  form.handleSubmit();
                }}
              >
                <FieldGroup>
                  <form.AppField name="password">
                    {(field) => (
                      <field.PasswordField
                        label="Enter your password to confirm"
                        placeholder="Your password"
                      />
                    )}
                  </form.AppField>

                  <form.AppField name="confirmation">
                    {(field) => (
                      <field.TextField
                        label="Type DELETE to confirm"
                        placeholder="DELETE"
                      />
                    )}
                  </form.AppField>
                </FieldGroup>

                <AlertDialogFooter className="mt-6">
                  <AlertDialogCancel type="button">Cancel</AlertDialogCancel>
                  <form.SubmitButton
                    variant="destructive"
                    disabled={deleteAccountMutation.isPending}
                  >
                    {deleteAccountMutation.isPending
                      ? 'Deleting...'
                      : 'Delete Account'}
                  </form.SubmitButton>
                </AlertDialogFooter>
              </form>
            </form.AppForm>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

function SettingsPageContent() {
  return (
    <Tabs defaultValue="profile" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="profile">
          <UserIcon className="h-4 w-4 mr-2" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="security">
          <KeyIcon className="h-4 w-4 mr-2" />
          Security
        </TabsTrigger>
        <TabsTrigger value="sessions">
          <MonitorSmartphoneIcon className="h-4 w-4 mr-2" />
          Sessions
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile" className="space-y-6">
        <ProfileForm />
        <EmailForm />
      </TabsContent>

      <TabsContent value="security" className="space-y-6">
        <PasswordForm />
        <DeleteAccountDialog />
      </TabsContent>

      <TabsContent value="sessions">
        <SessionsSection />
      </TabsContent>
    </Tabs>
  );
}

const SettingsPage = Provide([createAccountFeatures()], SettingsPageContent);

export default SettingsPage;
