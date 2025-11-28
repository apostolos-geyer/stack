"use client";

import { Button } from "@_/ui.web/components/button";
import { useImpersonationFeatures } from "@_/features.client/admin/impersonation";
import { useAuthFeatures } from "@_/features.client/auth";
import { UserIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

export function ImpersonationFab() {
  const { isImpersonating, stopImpersonatingMutation } =
    useImpersonationFeatures();
  const { session } = useAuthFeatures();

  if (!isImpersonating) {
    return null;
  }

  const handleStopImpersonating = async () => {
    try {
      await stopImpersonatingMutation.mutateAsync();
      toast.success("Stopped impersonating");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const userName = session.data?.user?.name || session.data?.user?.email || "user";

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div
        className="flex items-center gap-3 rounded-full
          bg-background/60 backdrop-blur-xl border border-border/50
          shadow-lg shadow-black/10
          px-4 py-2.5
          animate-in slide-in-from-bottom-4 fade-in duration-300"
      >
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
            <UserIcon className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="text-muted-foreground">Viewing as</span>
          <span className="font-medium">{userName}</span>
        </div>
        <Button
          size="sm"
          variant="secondary"
          className="h-7 rounded-full px-3"
          onClick={handleStopImpersonating}
          disabled={stopImpersonatingMutation.isPending}
        >
          {stopImpersonatingMutation.isPending ? (
            "Stopping..."
          ) : (
            <>
              <XIcon className="h-3.5 w-3.5 mr-1" />
              Stop
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
