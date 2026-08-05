import type { Metadata } from "next";
import WholesaleApplyView from "@/components/wholesale/WholesaleApplyView";

export const metadata: Metadata = {
  title: "Solicitar cuenta mayorista",
  description:
    "Solicita una cuenta mayorista para comprar al por mayor con precios especiales.",
  // Gated, account-specific page — keep it out of the index.
  robots: { index: false, follow: false },
};

export default function WholesaleApplyPage() {
  return <WholesaleApplyView />;
}
