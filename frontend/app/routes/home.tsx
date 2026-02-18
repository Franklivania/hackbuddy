import type { Route } from "./+types/home";
import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router";
import {
  Hero,
  Ticker,
  SectionDivider,
  ProblemSection,
  WorkflowSection,
  OutputsSection,
  InsideSection,
  CtaSection,
} from "@/components/landing";
import { Footer } from "@/components/layout/footer";
import { Nav } from "@/components/layout/nav";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Hackathon Buddy - Win With Strategy, Not Guesswork" },
    {
      name: "description",
      content:
        "Convert event briefs and past winner data into a structured execution roadmap your team can act on.",
    },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    const authError = searchParams.get("auth_error");
    if (token || authError) {
      navigate(`/auth/callback?${searchParams.toString()}`, { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="landing-page dark">
      <Nav />
      <Hero />
      <Ticker />
      <SectionDivider />
      <ProblemSection />
      <SectionDivider />
      <WorkflowSection />
      <SectionDivider />
      <OutputsSection />
      <SectionDivider />
      <InsideSection />
      <CtaSection />
      <Footer />
    </div>
  );
}
