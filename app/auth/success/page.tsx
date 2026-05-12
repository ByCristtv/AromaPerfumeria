"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const router = useRouter();

export default function AuthSuccess() {
  useEffect(() => {
    router.push("/");
  }, []);

  return <div>Cargando sesión...</div>;
}