import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

const PRESET_CATEGORIES = ["TECH", "SCHOOL", "PERSONAL", "BUSINESS", "HEALTH", "FINANCE"];

interface Props {
  task: Task | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onSave: (id: string, updates: Partial<Task>) => Promise<void> | void;
  knownCategories?: string[];
}

export const EditTaskDialog = ({ task, open, onOpenChange, onSave, knownCategories = [] }: Props) => {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("PERSONAL");
  const [customCategory, setCustomCategory] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);
  const [priority, setPriority] = useState<string>("med");
  const [dueDate, setDueDate] = useState<string>("");

  const allOptions = useMemo(() => {
    const set = new Set<string>([...PRESET_CATEGORIES, ...knownCategories.map((c) => c.toUpperCase())]);
    return Array.from(set);
  }, [knownCategories]);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      const isPreset = allOptions.includes(task.category);
      if (isPreset) {
        setCategory(task.category);
        setIsCustom(false);
        setCustomCategory("");
      } else {
        setCategory("__custom__");
        setIsCustom(true);
        setCustomCategory(task.category);
      }
      setPriority(task.priority);
      setDueDate(task.due_date ?? "");
    }
  }, [task, allOptions]);

  if (!task) return null;

  const handleCategoryChange = (v: string) => {
    if (v === "__custom__") {
      setIsCustom(true);
      setCategory(v);
    } else {
      setIsCustom(false);
      setCategory(v);
    }
  };

  const handleSave = async () => {
    const finalCategory = isCustom
      ? (customCategory.trim().toUpperCase() || "OTHER")
      : category;
    await onSave(task.id, {
      title: title.trim() || task.title,
      category: finalCategory,
      priority: priority as Task["priority"],
      due_date: dueDate || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border/60">
        <DialogHeader>
          <DialogTitle className="font-display">Edit Task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Category</label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allOptions.map((c) => (
                    <SelectItem key={c} value={c}>{c.charAt(0) + c.slice(1).toLowerCase()}</SelectItem>
                  ))}
                  <SelectItem value="__custom__">+ Other (custom)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="med">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {isCustom && (
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Custom category name</label>
              <Input
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Fitness, Travel, Hobby"
              />
            </div>
          )}
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-muted-foreground">Due date</label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} className="bg-gradient-primary">Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
