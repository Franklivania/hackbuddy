import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@/components/ui/empty";
import { Button } from "@/components/ui/button";
import { CalendarPlus, UserPlus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardEmptyProps {
  onCreateSession?: () => void;
}

const steps = [
  {
    step: 1,
    icon: CalendarPlus,
    title: "Create a session",
    description: "Start a focused block to pair with your hackathon buddy.",
  },
  {
    step: 2,
    icon: UserPlus,
    title: "Pair together",
    description: "Work in real time and ship your project.",
  },
  {
    step: 3,
    icon: Sparkles,
    title: "Track your wins",
    description: "See session history and keep momentum going.",
  },
] as const;

export default function DashboardEmpty({ onCreateSession }: DashboardEmptyProps) {
  return (
    <Empty className="min-h-[50vh] m-auto">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CalendarPlus />
        </EmptyMedia>
        <EmptyTitle>No sessions yet</EmptyTitle>
        <EmptyDescription>
          Create a session to start pairing with your hackathon buddy and track your progress.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent className="w-full max-w-md">
        <div
          className={cn(
            "w-full rounded-xl border bg-card text-card-foreground shadow-sm",
            "p-5 sm:p-6 space-y-5"
          )}
        >
          <p className="text-sm font-medium text-foreground">How it works</p>
          <ol className="space-y-4">
            {steps.map(({ step, icon: Icon, title, description }) => (
              <li key={step} className="flex gap-4">
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full",
                    "bg-primary/10 text-primary text-sm font-semibold"
                  )}
                  aria-hidden
                >
                  {step}
                </span>
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-medium text-foreground text-sm">{title}</p>
                  <p className="text-muted-foreground text-sm leading-snug">
                    {description}
                  </p>
                </div>
                <span
                  className="shrink-0 text-muted-foreground/70 [&_svg]:size-5"
                  aria-hidden
                >
                  <Icon />
                </span>
              </li>
            ))}
          </ol>
          <Button onClick={onCreateSession} className="w-full" size="lg">
            <CalendarPlus className="size-4" />
            Create session
          </Button>
        </div>
      </EmptyContent>
    </Empty>
  );
}
