'use client';

import { useAuthFeatures, useHasRoles } from '@_/features.client/auth';
import { Button } from '@_/ui.web/components/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@_/ui.web/components/dropdown-menu';
import {
  HomeIcon,
  LogInIcon,
  LogOutIcon,
  SettingsIcon,
  ShieldIcon,
  UserIcon,
} from 'lucide-react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export function FloatingHeader() {
  const [isClient, setIsClient] = useState(false);
  const { session, authClient } = useAuthFeatures();
  const isAdmin = useHasRoles(['admin']);

  useEffect(() => setIsClient(true), []);

  const user = session.data?.user;
  const isReady = isClient && !session.isPending;

  const handleSignOut = async () => {
    await authClient.signOut();
    window.location.href = '/';
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl xl:max-w-7xl">
      <div
        className="flex items-center justify-between
          bg-background/20 backdrop-blur-sm border border-border/50
          shadow-lg shadow-black/10
          px-4 py-2 rounded-xl"
        suppressHydrationWarning
      >
        <Link
          href="/"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 hover:opacity-80 transition-opacity"
        >
          <HomeIcon className="h-4 w-4 text-primary" />
        </Link>

        <div className="flex items-center gap-2">
          {!isReady ? (
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          ) : (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(4px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.3 }}
            >
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-muted"
                    >
                      {user.image ? (
                        <img
                          src={user.image}
                          alt={user.name || 'User'}
                          className="h-8 w-8 object-cover rounded-full"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                          <UserIcon className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72 p-2">
                    <DropdownMenuLabel className="font-normal px-3 py-2">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">
                          {user.name || 'User'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild className="px-3 py-2">
                      <Link href="/settings" className="cursor-pointer">
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem asChild className="px-3 py-2">
                        <Link href="/admin" className="cursor-pointer">
                          <ShieldIcon className="mr-2 h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="cursor-pointer text-destructive focus:text-destructive px-3 py-2"
                    >
                      <LogOutIcon className="mr-2 h-4 w-4" />
                      Sign out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 rounded-full px-3"
                  asChild
                >
                  <Link href="/auth">
                    <LogInIcon className="mr-1.5 h-3.5 w-3.5" />
                    Sign in
                  </Link>
                </Button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
