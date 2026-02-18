import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { Link2, LogOut } from "lucide-react";
import { useAuthStore } from "@/lib/stores/auth-store";
import { getInitials } from "@/lib/initials";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AppHeader() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleLogoutClick = useCallback(() => {
    setPopoverOpen(false);
    setDialogOpen(true);
  }, []);

  const handleLogoutConfirm = useCallback(async () => {
    setDialogOpen(false);
    await logout();
    navigate("/", { replace: true });
  }, [logout, navigate]);

  if (!user) return null;

  const initials = getInitials(user.full_name, user.email);
  const displayName = user.full_name?.trim() || user.email;

  return (
    <>
      <header className="sticky w-full h-14 top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-6 backdrop-blur supports-backdrop-filter:bg-background/60">
        <div className="flex-1 min-w-0" />
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-left outline-none ring-offset-background transition-colors hover:bg-accent/20 hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Account menu"
            >
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium"
                aria-hidden
              >
                {initials}
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{displayName}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <Link2 className="size-4 shrink-0 text-muted-foreground" aria-hidden />
            </button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-56 p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start gap-2 text-muted-foreground"
              onClick={handleLogoutClick}
            >
              <LogOut className="size-4" />
              Log out
            </Button>
          </PopoverContent>
        </Popover>
      </header>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Log out?</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out? You will need to sign in again to continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton={false}>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="default" onClick={handleLogoutConfirm}>
              Log out
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
