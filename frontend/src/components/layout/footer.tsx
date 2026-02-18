import { Link } from "react-router";

const COPY_YEAR = new Date().getFullYear();

export function Footer() {
  return (
    <footer className="landing-footer">
      <Link to="/" className="landing-footer-logo">
        HackBuddy
      </Link>
      <span className="landing-footer-copy">
        © {COPY_YEAR} HackBuddy. All rights reserved.
      </span>
    </footer>
  );
}
