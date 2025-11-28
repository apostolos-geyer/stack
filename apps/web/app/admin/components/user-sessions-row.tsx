'use client';

import { useUserSessions, useRevokeSessionMutation, useRevokeAllSessionsMutation } from '@_/features.client/admin/hooks';
import { Badge } from '@_/ui.web/components/badge';
import { Button } from '@_/ui.web/components/button';
import { TableCell, TableRow } from '@_/ui.web/components/table';
import { GlobeIcon, MonitorIcon, Trash2Icon, XIcon } from 'lucide-react';
import { toast } from 'sonner';

type UserSessionsRowProps = {
  userId: string;
  colSpan: number;
};

export function UserSessionsRow({ userId, colSpan }: UserSessionsRowProps) {
  const sessionsQuery = useUserSessions(userId);
  const revokeSessionMutation = useRevokeSessionMutation();
  const revokeAllSessionsMutation = useRevokeAllSessionsMutation();

  const handleRevokeSession = async (sessionToken: string) => {
    try {
      await revokeSessionMutation.mutateAsync(sessionToken);
      toast.success('Session revoked');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const handleRevokeAll = async () => {
    try {
      await revokeAllSessionsMutation.mutateAsync(userId);
      toast.success('All sessions revoked');
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (sessionsQuery.isPending) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="bg-muted/30 p-4">
          <div className="text-sm text-muted-foreground">
            Loading sessions...
          </div>
        </TableCell>
      </TableRow>
    );
  }

  if (sessionsQuery.isError) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="bg-muted/30 p-4">
          <div className="text-sm text-destructive">
            Error loading sessions: {sessionsQuery.error.message}
          </div>
        </TableCell>
      </TableRow>
    );
  }

  const sessions = sessionsQuery.data ?? [];

  if (sessions.length === 0) {
    return (
      <TableRow>
        <TableCell colSpan={colSpan} className="bg-muted/30 p-4">
          <div className="text-sm text-muted-foreground">
            No active sessions
          </div>
        </TableCell>
      </TableRow>
    );
  }

  return (
    <TableRow>
      <TableCell colSpan={colSpan} className="bg-muted/30 p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">
              Active Sessions ({sessions.length})
            </h4>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRevokeAll}
              disabled={revokeAllSessionsMutation.isPending}
            >
              <Trash2Icon className="h-4 w-4 mr-1" />
              {revokeAllSessionsMutation.isPending
                ? 'Revoking...'
                : 'Revoke All'}
            </Button>
          </div>

          <div className="space-y-2">
            {sessions.map((session) => {
              const isExpired = new Date(session.expiresAt) < new Date();

              return (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-md border bg-background p-3"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm">
                        <MonitorIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs">
                          {session.userAgent
                            ? truncateUserAgent(session.userAgent)
                            : 'Unknown device'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <GlobeIcon className="h-3 w-3" />
                        <span>{session.ipAddress || 'Unknown IP'}</span>
                        <span>•</span>
                        <span>
                          Created {formatDate(new Date(session.createdAt))}
                        </span>
                        {session.impersonatedBy && (
                          <>
                            <span>•</span>
                            <Badge variant="outline" className="text-xs">
                              Impersonated
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={isExpired ? 'destructive' : 'secondary'}>
                      {isExpired
                        ? 'Expired'
                        : `Expires ${formatDate(new Date(session.expiresAt))}`}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRevokeSession(session.token)}
                      disabled={revokeSessionMutation.isPending}
                    >
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

function truncateUserAgent(ua: string): string {
  if (ua.length <= 60) return ua;
  return ua.slice(0, 60) + '...';
}

function formatDate(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60));
      return minutes <= 1 ? 'just now' : `${minutes}m ago`;
    }
    return `${hours}h ago`;
  }
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString();
}
