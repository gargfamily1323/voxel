import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export const EmptyState = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-float-up">
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-primary blur-3xl opacity-40 rounded-full" />
        <div className="relative h-32 w-32 rounded-full border border-primary/30 flex items-center justify-center bg-card/40 backdrop-blur">
          <div className="absolute inset-2 rounded-full border border-secondary/30 animate-pulse" />
          <div className="absolute inset-5 rounded-full border border-primary/20" />
          <Sparkles className="h-12 w-12 text-primary" strokeWidth={1.5} />
        </div>
      </div>
      <h2 className="text-2xl font-display font-semibold text-gradient mb-2">
        {t.emptyTitle}
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs">
        {t.emptyDesc}
      </p>
    </div>
  );
};
