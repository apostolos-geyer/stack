'use client';

import { createAdminFeatures } from '@_/features.client/admin';
import {
  createUserMutationsFeatures,
  useUserMutationsFeatures,
} from '@_/features.client/admin/user-mutations';
import { createUsersListFeatures } from '@_/features.client/admin/users-list';
import { Provide } from '@_/lib.client';
import { useState } from 'react';
import { toast } from 'sonner';
import type { User } from './components/columns';
import { UserBanDialog } from './components/user-ban-dialog';
import { UserCreateDialog } from './components/user-create-dialog';
import { UserDeleteDialog } from './components/user-delete-dialog';
import { UserEditDialog } from './components/user-edit-dialog';
import { UserRoleDialog } from './components/user-role-dialog';
import { UserTable } from './components/user-table';

function AdminPageContent() {
  const { unbanUserMutation } = useUserMutationsFeatures();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditDialogOpen(true);
  };

  const handleSetRole = (user: User) => {
    setSelectedUser(user);
    setRoleDialogOpen(true);
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

      <UserDeleteDialog
        user={selectedUser}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      />
    </>
  );
}

const AdminPage = Provide(
  [
    createAdminFeatures(),
    createUsersListFeatures(),
    createUserMutationsFeatures(),
  ],
  AdminPageContent,
);

export default AdminPage;
