"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Landing page after a successful OAuth round-trip. The
 * `/auth/callback` route handler redirects here once it has exchanged
 * the auth code for a session; we then forward the user to the home
 * page so they see the authenticated UI.
 */
export default function AuthSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white/70">
      Cargando sesión...
    </div>
  );
}
