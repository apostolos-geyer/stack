import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@_/ui.web/components/card';
import { unauthorized } from 'next/navigation';
import { getSession } from '@/lib/dal';

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (session === null) unauthorized();

  return (
    <div className="container max-w-2xl xl:max-w-7xl mx-auto">
      <Card className="mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Account Settings</CardTitle>
          <CardDescription>
            Manage your account settings and preferences
          </CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}
