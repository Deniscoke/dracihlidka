import { redirect } from "next/navigation";

// Root "/" presmeruje na login stránku.
// Middleware handles: ak je user prihlásený → /app
// Ak neprihlásený → /auth/login
export default function RootPage() {
  redirect("/auth/login");
}
