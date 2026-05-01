import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { RecordButton } from "@/components/RecordButton";
import { TaskCard } from "@/components/TaskCard";
import { EmptyState } from "@/components/EmptyState";
import { useRecorder } from "@/hooks/useRecorder";
import { toast } from "sonner";
import { Waves } from "lucide-react";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type Category = "TECH" | "SCHOOL" | "PERSONAL";

const CATEGORIES: Category[] = ["TECH", "SCHOOL", "PERSONAL"];
const CATEGORY_LABEL: Record<Category, string> = { TECH: "Tech", SCHOOL: "School", PERSONAL: "Personal" };
const CATEGORY_DOT: Record<Category, string> = {
  TECH: "bg-tech shadow-[0_0_12px_hsl(var(--tech))]",
  SCHOOL: "bg-school shadow-[0_0_12px_hsl(var(--school))]",
  PERSONAL: "bg-personal shadow-[0_0_12px_hsl(var(--personal))]",
};

const Index = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [transcript, setTranscript] = useState<string | null>(null);
  const recorder = useRecorder();

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("completed", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) { toast.error(error.message); return; }
    setTasks(data ?? []);
  };

  useEffect(() => {
    fetchTasks();
    const ch = supabase
      .channel("tasks-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => fetchTasks())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const grouped = useMemo(() => {
    const m: Record<Category, Task[]> = { TECH: [], SCHOOL: [], PERSONAL: [] };
    tasks.forEach((t) => m[t.category as Category]?.push(t));
    return m;
  }, [tasks]);

  const handlePress = async () => {
    if (recorder.state !== "idle") return;
    if (!recorder.isSupported) {
      toast.error("Voice input isn't supported in this browser. Try Chrome or Safari.");
      return;
    }
    const ok = await recorder.start();
    if (!ok) toast.error("Couldn't start the microphone. Check permissions.");
  };

  const handleRelease = async () => {
    if (recorder.state !== "recording") return;
    const text = await recorder.stop();
    if (!text) { toast("Didn't catch that — try again."); recorder.reset(); return; }
    try {
      setTranscript(text);
      toast.loading("Extracting tasks…", { id: "process" });
      const { data: ex, error: exErr } = await supabase.functions.invoke("extract-tasks", { body: { transcript: text } });
      if (exErr || ex?.error) throw new Error(ex?.error || exErr?.message);
      const newTasks = (ex?.tasks ?? []) as Array<{ title: string; category: Category; priority: "high"|"med"|"low"; due_date: string | null }>;
      if (newTasks.length === 0) { toast.dismiss("process"); toast("No tasks detected."); recorder.reset(); return; }
      const { error: insErr } = await supabase.from("tasks").insert(newTasks);
      if (insErr) throw insErr;
      toast.success(`Added ${newTasks.length} task${newTasks.length > 1 ? "s" : ""}`, { id: "process" });
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Something went wrong", { id: "process" });
    } finally {
      recorder.reset();
      setTimeout(() => setTranscript(null), 4000);
    }
  };

  const toggleTask = async (id: string, completed: boolean) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, completed } : t)));
    await supabase.from("tasks").update({ completed }).eq("id", id);
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("tasks").delete().eq("id", id);
  };

  const isEmpty = tasks.length === 0;

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" />

      <header className="relative px-5 pt-8 pb-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
            <Waves className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold tracking-tight">
              <span className="text-gradient">Voxel</span>
            </h1>
            <p className="text-xs text-muted-foreground -mt-0.5">Voice → Tasks, instantly</p>
          </div>
        </div>
      </header>

      <main className="relative px-5 pb-48 max-w-2xl mx-auto">
        {isEmpty ? (
          <EmptyState />
        ) : (
          <div className="space-y-8 mt-2">
            {CATEGORIES.map((cat) => {
              const items = grouped[cat];
              if (items.length === 0) return null;
              return (
                <section key={cat}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`h-2 w-2 rounded-full ${CATEGORY_DOT[cat]}`} />
                    <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                      {CATEGORY_LABEL[cat]}
                    </h2>
                    <span className="text-xs text-muted-foreground/60">{items.length}</span>
                  </div>
                  <div className="space-y-2">
                    {items.map((t) => (
                      <TaskCard key={t.id} task={t} onToggle={toggleTask} onDelete={deleteTask} />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating record dock */}
      <div className="fixed bottom-0 inset-x-0 z-30 pointer-events-none">
        <div className="max-w-2xl mx-auto px-5 pb-8 pt-16 bg-gradient-to-t from-background via-background/90 to-transparent">
          <div className="flex flex-col items-center gap-3 pointer-events-auto">
            {transcript && (
              <div className="max-w-md text-center text-xs text-muted-foreground bg-card/70 backdrop-blur border border-border/60 rounded-full px-4 py-1.5 animate-float-up">
                "{transcript}"
              </div>
            )}
            <RecordButton state={recorder.state} onPress={handlePress} onRelease={handleRelease} />
            <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
              {recorder.state === "recording" ? "Listening…" : recorder.state === "processing" ? "Thinking…" : "Hold to record"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
