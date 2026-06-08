import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Waves, Languages } from "lucide-react";
import { toast } from "sonner";

const Auth = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const isAddAccount = params.get("add") === "1";

  useEffect(() => {
    if (!loading && user && !isAddAccount) navigate("/", { replace: true });
  }, [user, loading, isAddAccount, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success("Welcome back");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const displayName = name || email.split("@")[0];
      if (cred.user) await updateProfile(cred.user, { displayName });
      toast.success("Account created");
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Sign-up failed");
    } finally {
      setBusy(false);
    }
  };

  const handleGoogle = async () => {
    setBusy(true);
    try {
      await signInWithPopup(auth, googleProvider);
      navigate("/", { replace: true });
    } catch (err: any) {
      toast.error(err?.message ?? "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center glow-primary mb-3">
            <Waves className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-display font-bold"><span className="text-gradient">Voxel</span></h1>
          <p className="text-xs text-muted-foreground mt-1">{t.tagline}</p>
        </div>

        <div className="mb-5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1.5 mb-1.5">
            <Languages className="h-3.5 w-3.5" /> {t.language}
          </Label>
          <Select value={language} onValueChange={(v) => setLanguage(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.id} value={l.id}>{l.label} — {l.native}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">{t.signIn}</TabsTrigger>
            <TabsTrigger value="signup">{t.signUp}</TabsTrigger>
          </TabsList>

          <TabsContent value="signin">
            <form onSubmit={handleSignIn} className="space-y-3 mt-4">
              <div>
                <Label htmlFor="si-email">{t.email}</Label>
                <Input id="si-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="si-pw">{t.password}</Label>
                <Input id="si-pw" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>{t.signIn}</Button>
            </form>
          </TabsContent>

          <TabsContent value="signup">
            <form onSubmit={handleSignUp} className="space-y-3 mt-4">
              <div>
                <Label htmlFor="su-name">{t.name}</Label>
                <Input id="su-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={t.yourName} />
              </div>
              <div>
                <Label htmlFor="su-email">{t.email}</Label>
                <Input id="su-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="su-pw">{t.password}</Label>
                <Input id="su-pw" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={busy}>{t.createAccount}</Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="my-5 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{t.or}</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <Button type="button" variant="outline" className="w-full" onClick={handleGoogle} disabled={busy}>
          {t.continueWithGoogle}
        </Button>
      </div>
    </div>
  );
};

export default Auth;
