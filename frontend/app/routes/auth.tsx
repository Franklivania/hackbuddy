import Image from "@/components/ui/image";
import { Outlet } from "react-router";
import { Link } from "react-router";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col md:flex-row dark">
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:px-12 lg:px-16 bg-background border-r border-border">
        <div className="w-full max-w-[400px] mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mb-8"
          >
            <Image src="/favicon.ico" alt="HackBuddy" width={100} height={100} />
          </Link>
          <Outlet />
        </div>
      </div>
      <div
        className="hidden md:flex flex-1 flex-col justify-center px-12 lg:px-20 bg-muted/30 text-muted-foreground"
        aria-hidden
      >
        <p className="text-lg font-medium text-foreground">
          Win hackathons with strategy, not guesswork.
        </p>
        <p className="mt-2 text-sm">
          Convert event briefs and past winner data into a structured execution roadmap.
        </p>
      </div>
    </div>
  );
}
