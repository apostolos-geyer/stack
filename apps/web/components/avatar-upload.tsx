'use client';

import { useRef, type ChangeEvent } from 'react';
import { useAvatarUpload } from '@_/features.client/account/hooks';
import { useAuthFeatures } from '@_/features.client/auth';
import { Avatar, AvatarFallback, AvatarImage } from '@_/ui.web/components/avatar';
import { cn } from '@_/ui.utils';
import { CameraIcon, Loader2Icon, UserIcon } from 'lucide-react';
import { toast } from 'sonner';

type AvatarUploadProps = {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
};

const sizeClasses = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-20 w-20',
  xl: 'h-24 w-24',
};

const iconSizeClasses = {
  sm: 'h-3 w-3',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
};

export function AvatarUpload({ className, size = 'lg' }: AvatarUploadProps) {
  const { session } = useAuthFeatures();
  const { uploadAvatar, isBusy, progress } = useAvatarUpload({
    onSuccess: () => {
      toast.success('Avatar updated');
    },
    onError: (error) => {
      toast.error(error);
    },
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const user = session.data?.user;
  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input so same file can be selected again
    e.target.value = '';

    try {
      await uploadAvatar(file);
    } catch {
      // Error already handled by onError callback
    }
  };

  return (
    <div className={cn('relative inline-block', className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={isBusy}
        className="relative group rounded-full focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      >
        <Avatar className={cn(sizeClasses[size], 'border-2 border-muted')}>
          <AvatarImage src={user?.image ?? undefined} alt={user?.name ?? 'Avatar'} />
          <AvatarFallback className="bg-muted">
            {initials || <UserIcon className={iconSizeClasses[size]} />}
          </AvatarFallback>
        </Avatar>

        {/* Overlay */}
        <div
          className={cn(
            'absolute inset-0 rounded-full flex items-center justify-center',
            'bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity',
            isBusy && 'opacity-100'
          )}
        >
          {isBusy ? (
            <div className="flex flex-col items-center text-white">
              <Loader2Icon className={cn(iconSizeClasses[size], 'animate-spin')} />
              {progress > 0 && progress < 100 && (
                <span className="text-xs mt-1">{progress}%</span>
              )}
            </div>
          ) : (
            <CameraIcon className={cn(iconSizeClasses[size], 'text-white')} />
          )}
        </div>
      </button>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        aria-label="Upload avatar"
      />
    </div>
  );
}
