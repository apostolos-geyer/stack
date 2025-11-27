import { unauthorized } from 'next/navigation';
import { getSession } from '@/lib/dal';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const v = await getSession();
  if (v === null) unauthorized();
  const { user } = v;
  if (
    user.role === null ||
    user.role === undefined ||
    !user.role.split(',').some((role) => role === 'admin')
  )
    unauthorized();

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground">
          Manage users and system settings
        </p>
      </div>
      {children}
    </div>
  );
}
