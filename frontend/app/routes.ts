import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("dashboard", "routes/dashboard.tsx"),
  route("auth", "routes/auth.tsx", [
    index("routes/auth/login.tsx"),
    route("register", "routes/auth/register.tsx"),
    route("verify-email", "routes/auth/verify-email.tsx"),
    route("callback", "routes/auth/callback.tsx"),
  ]),
] satisfies RouteConfig;
