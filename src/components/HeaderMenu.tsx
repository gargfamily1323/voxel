import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, LogOut, UserPlus, Trash2, Palette, User as UserIcon, Check, Languages } from "lucide-react";
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
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type View = "main" | "account" | "theme" | "language";

const themeIds: Theme[] = ["default", "classic", "light"];

export const HeaderMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const themeOptions = [
    { id: "default" as Theme, label: t.themeDefault, description: t.themeDefaultDesc },
    { id: "classic" as Theme, label: t.themeClassic, description: t.themeClassicDesc },
    { id: "light" as Theme, label: t.themeLight, description: t.themeLightDesc },
  ];
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
            {view === "main" && t.menu}
            {view === "account" && (<button onClick={() => setView("main")} className="text-left">← {t.account}</button>)}
            {view === "theme" && (<button onClick={() => setView("main")} className="text-left">← {t.theme}</button>)}
            {view === "language" && (<button onClick={() => setView("main")} className="text-left">← {t.language}</button>)}
          </SheetTitle>
        </SheetHeader>

        {view === "main" && (
          <div className="mt-6 space-y-1">
            <p className="px-2 pb-3 text-xs text-muted-foreground truncate">{user?.email}</p>
            <button onClick={() => setView("account")} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition">
              <UserIcon className="h-4 w-4" />
              <span className="text-sm">{t.accountSettings}</span>
            </button>
            <button onClick={() => setView("theme")} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition">
              <Palette className="h-4 w-4" />
              <span className="text-sm">{t.theme}</span>
            </button>
            <button onClick={() => setView("language")} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition">
              <Languages className="h-4 w-4" />
              <span className="text-sm flex-1 text-left">{t.language}</span>
              <span className="text-xs text-muted-foreground">{LANGUAGES.find(l => l.id === language)?.native}</span>
            </button>
          </div>
        )}

        {view === "account" && (
          <div className="mt-6 space-y-2">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition">
              <LogOut className="h-4 w-4" />
              <span className="text-sm">{t.logout}</span>
            </button>
            <button onClick={handleAddAccount} className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted transition">
              <UserPlus className="h-4 w-4" />
              <span className="text-sm">{t.addAccount}</span>
            </button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition">
                  <Trash2 className="h-4 w-4" />
                  <span className="text-sm">{t.deleteAccount}</span>
                </button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
                  <AlertDialogDescription>{t.deleteConfirmDesc}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    {t.delete}
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

        {view === "language" && (
          <div className="mt-6 space-y-2">
            {LANGUAGES.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setLanguage(opt.id)}
                className={cn(
                  "w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg transition text-left",
                  language === opt.id ? "bg-primary/10 border border-primary/40" : "hover:bg-muted",
                )}
              >
                <div>
                  <p className="text-sm font-medium">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.native}</p>
                </div>
                {language === opt.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};
