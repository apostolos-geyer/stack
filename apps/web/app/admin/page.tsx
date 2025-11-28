'use client';

import { createAdminFeatures } from '@_/features.client/admin';
import {
  createImpersonationFeatures,
  useImpersonationFeatures,
} from '@_/features.client/admin/impersonation';
import { createSessionManagementFeatures } from '@_/features.client/admin/session-management';
import {
  createUserMutationsFeatures,
  useUserMutationsFeatures,
} from '@_/features.client/admin/user-mutations';
import { createUsersListFeatures } from '@_/features.client/admin/users-list';
import { Provide } from '@_/lib.client';
import { useState } from 'react';
import { toast } from 'sonner';
import type { User } from './components/columns';
import { ImpersonationFab } from './components/impersonation-fab';
import { UserBanDialog } from './components/user-ban-dialog';
import { UserCreateDialog } from './components/user-create-dialog';
import { UserDeleteDialog } from './components/user-delete-dialog';
import { UserEditDialog } from './components/user-edit-dialog';
import { UserPasswordDialog } from './components/user-password-dialog';
import { UserRoleDialog } from './components/user-role-dialog';
import { UserTable } from './components/user-table';

function AdminPageContent() {
  const { unbanUserMutation } = useUserMutationsFeatures();
  const { impersonateUserMutation } = useImpersonationFeatures();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleSetRole = (user: User) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
  };

  const handleSetPassword = (user: User) => {
    setSelectedUser(user);
    setPasswordDialogOpen(true);
  };

  const handleBan = (user: User) => {
    setSelectedUser(user);
    setBanDialogOpen(true);
  };

  const handleUnban = async (user: User) => {
    try {
      await unbanUserMutation.mutateAsync(user.id);
      toast.success('User unbanned successfully');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleImpersonate = async (user: User) => {
    try {
      await impersonateUserMutation.mutateAsync(user.id);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  return (
    <>
      <UserTable
        onEdit={handleEdit}
        onBan={handleBan}
        onUnban={handleUnban}
        onDelete={handleDelete}
        onSetRole={handleSetRole}
        onSetPassword={handleSetPassword}
        onImpersonate={handleImpersonate}
        onCreateUser={() => setCreateDialogOpen(true)}
      />

      <UserCreateDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <UserEditDialog
        user={selectedUser}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <UserRoleDialog
        user={selectedUser}
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
      />

      <UserBanDialog
        user={selectedUser}
        open={banDialogOpen}
        onOpenChange={setBanDialogOpen}
      />

      <UserPasswordDialog
        user={selectedUser}
        open={passwordDialogOpen}
        onOpenChange={setPasswordDialogOpen}
      />

      <UserDeleteDialog
        user={selectedUser}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />

      <ImpersonationFab />
    </>
  );
}

const AdminPage = Provide(
  [
    createAdminFeatures(),
    createUsersListFeatures(),
    createUserMutationsFeatures(),
    createSessionManagementFeatures(),
    createImpersonationFeatures(),
  ],
  AdminPageContent,
);

export default AdminPage;
