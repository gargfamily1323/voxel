import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Calendar, Trash2 } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

const priorityStyles: Record<string, string> = {
  high: "bg-priority-high/15 text-priority-high border-priority-high/40",
  med: "bg-priority-med/15 text-priority-med border-priority-med/40",
  low: "bg-priority-low/15 text-priority-low border-priority-low/40",
};

const categoryStyles: Record<string, string> = {
  TECH: "bg-tech/10 text-tech border-tech/40",
  SCHOOL: "bg-school/10 text-school border-school/40",
  PERSONAL: "bg-personal/10 text-personal border-personal/40",
};

interface Props {
  task: Task;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export const TaskCard = ({ task, onToggle, onDelete }: Props) => {
  const formattedDate = task.due_date
    ? new Date(task.due_date + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : null;

  return (
    <div
      className={cn(
        "group relative rounded-2xl border border-border/60 p-4 animate-float-up",
        "bg-[var(--gradient-card)] backdrop-blur-sm",
        "transition-all hover:border-primary/40 hover:shadow-[0_0_24px_hsl(var(--primary)/0.15)]",
        task.completed && "opacity-50",
      )}
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={task.completed}
          onCheckedChange={(v) => onToggle(task.id, !!v)}
          className="mt-1 border-primary/50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        />
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium leading-snug", task.completed && "line-through")}>
            {task.title}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className={cn("text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border", categoryStyles[task.category])}>
              {task.category}
            </span>
            <span className={cn("text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-full border", priorityStyles[task.priority])}>
              {task.priority}
            </span>
            {formattedDate && (
              <span className="text-[10px] inline-flex items-center gap-1 text-muted-foreground px-2 py-0.5">
                <Calendar className="h-3 w-3" /> {formattedDate}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition"
          aria-label="Delete task"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};
