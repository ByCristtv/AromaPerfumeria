"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthUser } from "@/hooks/useAuthUser";
import { useWholesaleStatus } from "@/hooks/useWholesaleStatus";
import WholesaleApplicationForm from "@/components/wholesale/WholesaleApplicationForm";

const SERIF = "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif";

/**
 * /wholesale/apply — the gated wholesale request page.
 *
 * Renders one of five things depending on who's asking:
 *   guest → bounce to /login · admin → not applicable · already wholesale → done
 *   pending application → "in review" · everyone else (incl. rejected) → the form.
 */
export default function WholesaleApplyView() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuthUser();
  const { eligibility, isLoading: statusLoading } = useWholesaleStatus();

  // Guests can't apply — send them to sign in first.
  useEffect(() => {
    if (!authLoading && !user) router.replace("/login");
  }, [authLoading, user, router]);

  if (authLoading || !user || statusLoading) {
    return (
      <Shell>
        <div className="h-56 animate-pulse rounded-2xl bg-white/5" />
      </Shell>
    );
  }

  if (eligibility.role === "admin") {
    return (
      <Shell>
        <StatusCard
          title="No aplicable"
          body="Las cuentas de administrador no solicitan acceso mayorista."
          cta={{ href: "/admin", label: "Ir al panel" }}
        />
      </Shell>
    );
  }

  if (eligibility.isApproved || eligibility.role === "wholesale") {
    return (
      <Shell>
        <StatusCard
          title="Ya eres cliente mayorista"
          body="Tu cuenta tiene precios mayoristas activos. Los verás en el carrito al alcanzar la cantidad mínima de cada producto."
          cta={{ href: "/products", label: "Explorar catálogo" }}
          tone="success"
        />
      </Shell>
    );
  }

  if (eligibility.status === "pending") {
    return (
      <Shell>
        <StatusCard
          title="Solicitud en revisión"
          body="Recibimos tu solicitud de cuenta mayorista y la estamos revisando. Te notificaremos el resultado en tu perfil."
          cta={{ href: "/profile", label: "Ir a mi perfil" }}
        />
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="rounded-2xl border border-[#c9a96e]/20 bg-black/50 p-6 backdrop-blur-sm shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-8">
        {eligibility.status === "rejected" && (
          <p className="mb-5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs leading-relaxed text-amber-200/90">
            Tu solicitud anterior fue rechazada. Puedes corregir los datos y volver
            a enviarla.
          </p>
        )}
        <WholesaleApplicationForm />
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <section className="min-h-screen bg-[radial-gradient(circle_at_12%_8%,#1e1e1e_0%,#111_45%,#000_100%)] px-4 pt-28 pb-16">
      <div className="mx-auto max-w-lg">
        <header className="mb-8 text-center">
          <p
            className="mb-3 text-[10px] uppercase tracking-[0.35em] text-[#c9a96e]"
            style={{ fontFamily: SERIF }}
          >
            Programa mayorista
          </p>
          <h1
            className="text-3xl font-light tracking-[0.06em] text-white sm:text-4xl"
            style={{ fontFamily: SERIF }}
          >
            Cuenta mayorista
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/50">
            Compra al por mayor con precios especiales. Cuéntanos sobre tu negocio
            y revisaremos tu solicitud.
          </p>
        </header>
        {children}
      </div>
    </section>
  );
}

function StatusCard({
  title,
  body,
  cta,
  tone = "neutral",
}: {
  title: string;
  body: string;
  cta: { href: string; label: string };
  tone?: "neutral" | "success";
}) {
  return (
    <div className="rounded-2xl border border-[#c9a96e]/20 bg-black/50 p-8 text-center backdrop-blur-sm">
      <h2
        className={`text-2xl font-light tracking-wide ${
          tone === "success" ? "text-[#c9a96e]" : "text-white"
        }`}
        style={{ fontFamily: SERIF }}
      >
        {title}
      </h2>
      <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-white/55">
        {body}
      </p>
      <Link
        href={cta.href}
        className="mt-6 inline-block border border-[#c9a96e]/50 px-6 py-2.5 text-[10px] uppercase tracking-[0.2em] text-[#c9a96e] transition-colors duration-300 hover:bg-[#c9a96e] hover:text-black"
        style={{ fontFamily: SERIF }}
      >
        {cta.label}
      </Link>
    </div>
  );
}
