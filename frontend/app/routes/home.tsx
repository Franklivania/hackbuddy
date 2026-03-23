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
  const title = "Hackathon Buddy - Win With Strategy, Not Guesswork";
  const description =
    "Hackathon Buddy transforms event briefs and winning patterns into a clear, step-by-step strategy your team can execute from idea to final submission.";
  const image =
    "https://res.cloudinary.com/dgtoh3s2a/image/upload/v1774259948/hackbuddy_ec7g8a.png";

  return [
    { title },
    { name: "description", content: description },
    { name: "author", content: "Chibuzo Franklin Odigbo" },
    { name: "creator", content: "Chibuzo Franklin Odigbo" },
    { name: "publisher", content: "Chibuzo Franklin Odigbo" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: "Hackathon Buddy social preview image" },
    { name: "twitter:creator", content: "@franklivania" },
    { name: "twitter:site", content: "@franklivania" },
    { property: "og:type", content: "website" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: "Hackathon Buddy social preview image" },
    { property: "og:site_name", content: "Hackathon Buddy" },
    { property: "profile:first_name", content: "Chibuzo" },
    { property: "profile:last_name", content: "Odigbo" },
    { property: "article:author", content: "Chibuzo Franklin Odigbo" },
    { name: "contact:website", content: "https://chibuzo.com.ng" },
    { name: "contact:twitter", content: "https://x.com/franklivania" },
    { name: "contact:github", content: "https://github.com/franklivania" },
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
