import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut, UserPlus, Trash2, Palette, User as UserIcon, Check } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, Theme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type View = "main" | "account" | "theme";

const themeOptions: { id: Theme; label: string; description: string }[] = [
  { id: "default", label: "Default (Neon)", description: "The original electric blue + purple" },
  { id: "classic", label: "Classic", description: "Toned-down dark slate" },
  { id: "light", label: "Light", description: "Bright mode" },
];

export const HeaderMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("main");

  const handleLogout = async () => {
    await signOut();
    setOpen(false);
    navigate("/auth", { replace: true });
  };

  const handleAddAccount = async () => {
    await signOut();
    setOpen(false);
    navigate("/auth?add=1", { replace: true });
  };

  const handleDelete = async () => {
    if (!user) return;
    // Delete user's data; auth user deletion requires admin endpoint – sign out after wiping data
    const { error } = await supabase.from("tasks").delete().eq("user_id", user.id);
    if (error) return toast.error(error.message);
    await supabase.from("profiles").delete().eq("user_id", user.id);
    toast.success("Account data deleted");
    await signOut();
    setOpen(false);
    navigate("/auth", { replace: true });
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setView("main"); }}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[300px] sm:w-[340px]">
        <SheetHeader>
          <SheetTitle>
            {view === "main" && "Menu"}
            {view === "account" && (<button onClick={() => setView("main")} className="text-left">← Account</button>)}
            {view === "theme" && (<button onClick={() => setView("main")} className="text-left">← Theme</button>)}
          </SheetTitle>
        </SheetHeader>

        {view === "main" && (
          <div className="mt-6 space-y-1">
            <p className="px-2 pb-3 text-xs text-muted-foreground truncate">{user?.email}</p>
            <button onClick={() => setView("account")} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition">
              <UserIcon className="h-4 w-4" />
              <span className="text-sm">Account settings</span>
            </button>
            <button onClick={() => setView("theme")} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition">
              <Palette className="h-4 w-4" />
              <span className="text-sm">Theme</span>
            </button>
          </div>
        )}

        {view === "account" && (
          <div className="mt-6 space-y-2">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition">
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Log out</span>
            </button>
            <button onClick={handleAddAccount} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition">
              <UserPlus className="h-4 w-4" />
              <span className="text-sm">Add new account</span>
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition">
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">Delete account</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete your account?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete all your tasks and profile data. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}

        {view === "theme" && (
          <div className="mt-6 space-y-2">
            {themeOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setTheme(opt.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition text-left",
                  theme === opt.id ? "bg-primary/10 border border-primary/40" : "hover:bg-muted",
                )}
              >
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.description}</p>
                </div>
                {theme === opt.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
