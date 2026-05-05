import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { RecordButton } from "@/components/RecordButton";
import { TaskCard } from "@/components/TaskCard";
import { EmptyState } from "@/components/EmptyState";
import { EditTaskDialog } from "@/components/EditTaskDialog";
import { HeaderMenu } from "@/components/HeaderMenu";
import { useRecorder } from "@/hooks/useRecorder";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, LANGUAGE_NAMES } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { Waves, Home, ListChecks, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";

type Task = Database["public"]["Tables"]["tasks"]["Row"];
type Category = "TECH" | "SCHOOL" | "PERSONAL";
type Priority = "high" | "med" | "low";
type StatusFilter = "all" | "active" | "completed";
type DueFilter = "all" | "today" | "week" | "overdue";
type Tab = "home" | "tasks";

const Index = () => {
  const { user } = useAuth();
  const { language, t: tr } = useLanguage();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tab, setTab] = useState<Tab>("home");
  const [transcript, setTranscript] = useState<string | null>(null);
  const recorder = useRecorder();

  // filters
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [prioFilter, setPrioFilter] = useState<Priority | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dueFilter, setDueFilter] = useState<DueFilter>("all");

  // edit
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
  );

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("sort_order", { ascending: true });
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

  const filtered = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
    const q = search.trim().toLowerCase();
    return tasks.filter((t) => {
      if (q && !t.title.toLowerCase().includes(q)) return false;
      if (catFilter !== "all" && t.category !== catFilter) return false;
      if (prioFilter !== "all" && t.priority !== prioFilter) return false;
      if (statusFilter === "active" && t.completed) return false;
      if (statusFilter === "completed" && !t.completed) return false;
      if (dueFilter !== "all") {
        if (!t.due_date) return false;
        const d = new Date(t.due_date + "T00:00:00");
        if (dueFilter === "today" && d.getTime() !== today.getTime()) return false;
        if (dueFilter === "week" && (d < today || d > weekEnd)) return false;
        if (dueFilter === "overdue" && (d >= today || t.completed)) return false;
      }
      return true;
    });
  }, [tasks, search, catFilter, prioFilter, statusFilter, dueFilter]);

  const categoriesPresent = useMemo(() => {
    return Array.from(new Set(tasks.map((t) => t.category))).sort();
  }, [tasks]);

  const handlePress = async () => {
    if (recorder.state !== "idle") return;
    if (!recorder.isSupported) { toast.error("Voice input isn't supported in this browser."); return; }
    const ok = await recorder.start();
    if (!ok) toast.error("Couldn't start the microphone. Check permissions.");
  };

  const handleRelease = async () => {
    if (recorder.state !== "recording") return;
    const text = await recorder.stop();
    if (!text) { toast(tr.didntCatch); recorder.reset(); return; }
    try {
      setTranscript(text);
      toast.loading(tr.extractingTasks, { id: "process" });
      const { data: ex, error: exErr } = await supabase.functions.invoke("extract-tasks", { body: { transcript: text, language: LANGUAGE_NAMES[language] } });
      if (exErr || ex?.error) throw new Error(ex?.error || exErr?.message);
      const newTasks = (ex?.tasks ?? []) as Array<{ title: string; category: Category; priority: Priority; due_date: string | null }>;
      if (newTasks.length === 0) { toast.dismiss("process"); toast(tr.noTasksDetected); recorder.reset(); return; }
      if (!user) throw new Error("Not signed in");
      const baseOrder = Date.now();
      const withOrder = newTasks.map((t, i) => ({ ...t, sort_order: baseOrder + i, user_id: user.id }));
      const { data: inserted, error: insErr } = await supabase.from("tasks").insert(withOrder).select();
      if (insErr) throw insErr;
      // Optimistically add to local state so they show immediately without refresh
      if (inserted && inserted.length) {
        setTasks((prev) => {
          const existing = new Set(prev.map((t) => t.id));
          const fresh = inserted.filter((t: Task) => !existing.has(t.id));
          return [...prev, ...fresh].sort((a, b) => a.sort_order - b.sort_order);
        });
      }
      toast.success(tr.addedTasks(newTasks.length), { id: "process" });
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

  const openEdit = (t: Task) => { setEditingTask(t); setEditOpen(true); };

  const saveEdit = async (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } as Task : t)));
    const { error } = await supabase.from("tasks").update(updates).eq("id", id);
    if (error) toast.error(error.message);
    else toast.success("Task updated");
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = tasks.findIndex((t) => t.id === active.id);
    const newIndex = tasks.findIndex((t) => t.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(tasks, oldIndex, newIndex);
    // recompute sort_order spaced by 1000
    const updated = reordered.map((t, i) => ({ ...t, sort_order: (i + 1) * 1000 }));
    setTasks(updated);
    // persist all
    await Promise.all(
      updated.map((t) => supabase.from("tasks").update({ sort_order: t.sort_order }).eq("id", t.id))
    );
  };

  const clearFilters = () => {
    setSearch(""); setCatFilter("all"); setPrioFilter("all"); setStatusFilter("all"); setDueFilter("all");
  };

  const hasActiveFilters = search || catFilter !== "all" || prioFilter !== "all" || statusFilter !== "all" || dueFilter !== "all";

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.04] pointer-events-none" />

      <header className="relative px-5 pt-8 pb-4 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center glow-primary">
              <Waves className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold tracking-tight">
                <span className="text-gradient">Voxel</span>
              </h1>
              <p className="text-xs text-muted-foreground -mt-0.5">{tr.tagline}</p>
            </div>
          </div>
          <HeaderMenu />
        </div>
      </header>

      <main className="relative px-5 pb-44 max-w-2xl mx-auto">
        {tab === "home" ? (
          <div className="pt-8">
            <EmptyState />
            {(() => {
              const active = tasks.filter((t) => !t.completed).length;
              return active > 0 ? (
                <div className="mt-6 text-center">
                  <Button variant="ghost" onClick={() => setTab("tasks")} className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {tr.viewActive(active)}
                  </Button>
                </div>
              ) : null;
            })()}
          </div>
        ) : (
          <div className="mt-2 space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={tr.searchTasks}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-card/50 backdrop-blur border-border/60"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2">
              <Select value={catFilter} onValueChange={(v) => setCatFilter(v as any)}>
                <SelectTrigger className="bg-card/50 border-border/60 text-xs h-9"><SelectValue placeholder={tr.category} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr.allCategories}</SelectItem>
                  {categoriesPresent.map((c) => (
                    <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={prioFilter} onValueChange={(v) => setPrioFilter(v as any)}>
                <SelectTrigger className="bg-card/50 border-border/60 text-xs h-9"><SelectValue placeholder={tr.priority} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr.allPriorities}</SelectItem>
                  <SelectItem value="high">{tr.high}</SelectItem>
                  <SelectItem value="med">{tr.medium}</SelectItem>
                  <SelectItem value="low">{tr.low}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="bg-card/50 border-border/60 text-xs h-9"><SelectValue placeholder={tr.status} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr.allStatus}</SelectItem>
                  <SelectItem value="active">{tr.active}</SelectItem>
                  <SelectItem value="completed">{tr.completed}</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dueFilter} onValueChange={(v) => setDueFilter(v as any)}>
                <SelectTrigger className="bg-card/50 border-border/60 text-xs h-9"><SelectValue placeholder={tr.due} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{tr.anyTime}</SelectItem>
                  <SelectItem value="today">{tr.today}</SelectItem>
                  <SelectItem value="week">{tr.thisWeek}</SelectItem>
                  <SelectItem value="overdue">{tr.overdue}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                <X className="h-3 w-3" /> {tr.clearFilters}
              </button>
            )}

            {/* Task list */}
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-12">
                {tasks.length === 0 ? tr.noTasksYet : tr.noMatch}
              </p>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filtered.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {filtered.map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        onToggle={toggleTask}
                        onDelete={deleteTask}
                        onEdit={openEdit}
                        draggable
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        )}
      </main>

      <EditTaskDialog task={editingTask} open={editOpen} onOpenChange={setEditOpen} onSave={saveEdit} knownCategories={categoriesPresent} />

      {/* Floating record dock */}
      <div className="fixed bottom-16 inset-x-0 z-30 pointer-events-none">
        <div className="max-w-2xl mx-auto px-5 pb-4 pt-16 bg-gradient-to-t from-background via-background/90 to-transparent">
          <div className="flex flex-col items-center gap-2 pointer-events-auto">
            {transcript && (
              <div className="max-w-md text-center text-xs text-muted-foreground bg-card/70 backdrop-blur border border-border/60 rounded-full px-4 py-1.5 animate-float-up">
                "{transcript}"
              </div>
            )}
            <RecordButton state={recorder.state} onPress={handlePress} onRelease={handleRelease} />
            <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
              {recorder.state === "recording" ? tr.listening : recorder.state === "processing" ? tr.thinking : tr.holdToRecord}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur">
        <div className="max-w-2xl mx-auto grid grid-cols-2">
          {([
            { id: "home", label: tr.home, Icon: Home },
            { id: "tasks", label: tr.tasks, Icon: ListChecks },
          ] as const).map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 py-2.5 transition",
                tab === id ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] uppercase tracking-[0.2em]">{label}</span>
              {id === "tasks" && tasks.filter((t) => !t.completed).length > 0 && (
                <span className="absolute mt-0 ml-8 text-[9px] bg-primary text-primary-foreground rounded-full px-1.5 py-px">
                  {tasks.filter((t) => !t.completed).length}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Index;
