"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import Image from "next/image";

export default function AccountLoginCard() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        supabase.auth.getSession().then(({ data }) => {
            setUser(data.session?.user ?? null);
            setLoading(false);
        }).catch(() => {
            // Ensure loading is cleared even if getSession fails
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <section className="min-h-screen pt-28 pb-10 px-4 bg-[radial-gradient(circle_at_10%_10%,#222_0%,#111_45%,#000_100%)]">
                <div className="max-w-md mx-auto text-center text-white/70">Cargando...</div>
            </section>
        );
    }

    if (user) {
        return (
            <section className="min-h-screen pt-28 pb-10 px-4 bg-[radial-gradient(circle_at_10%_10%,#222_0%,#111_45%,#000_100%)]">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className="max-w-md mx-auto "
                >
                    <div className="rounded-2xl border border-[#c9a96e]/35 bg-black/65 backdrop-blur-md shadow-[0_16px_60px_rgba(0,0,0,0.45)] p-6 sm:p-8">
                        <div className="text-center mb-8">
                            <div className="inline-flex flex-col leading-none select-none">
                                <span
                                    className="text-white tracking-[0.35em] text-3xl sm:text-4xl font-light"
                                    style={{ fontFamily: "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif" }}
                                >
                                    AROMA
                                </span>
                                <span
                                    className="text-[#c9a96e] text-[11px] tracking-[0.25em] font-light italic mt-1"
                                    style={{ fontFamily: "'Cormorant Garamond', 'Garamond', serif" }}
                                >
                                    Luxury Fragrance
                                </span>

                            </div>
                            <h1 className="text-white text-xl sm:text-2xl font-semibold mt-6">
                                Mi Cuenta
                            </h1>
                            <Image
                            width={96}
                            height={96}
                                src={user.user_metadata?.avatar_url || "/default-avatar.png"}
                                alt="Avatar"
                                className="w-24 h-24 rounded-full mx-auto mt-4 object-cover border-2 border-[#c9a96e]/40"
                            />

                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Nombre</p>
                                <p className="text-white text-base">{user.user_metadata?.full_name ?? "Sin nombre"}</p>
                            </div>
                            <div>
                                <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Email</p>
                                <p className="text-white text-base">{user.email}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full mt-8 rounded-xl border border-[#c9a96e]/40 text-[#c9a96e] py-3 px-4 font-medium hover:bg-[#c9a96e]/10 transition duration-200"
                        >
                            Cerrar sesión
                        </button>
                    </div>
                </motion.div>
            </section>
        );
    }

    return (

        <section className="min-h-screen pt-28 pb-10 px-4 bg-[radial-gradient(circle_at_10%_10%,#222_0%,#111_45%,#000_100%)]">
            <div className="max-w-md mx-auto">
                <div className="rounded-2xl border border-[#c9a96e]/35 bg-black/65 backdrop-blur-md shadow-[0_16px_60px_rgba(0,0,0,0.45)] p-6 sm:p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex flex-col leading-none select-none">
                            <span
                                className="text-white tracking-[0.35em] text-3xl sm:text-4xl font-light"
                                style={{
                                    fontFamily: "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif",
                                }}
                            >
                                AROMA
                            </span>
                            <span
                                className="text-[#c9a96e] text-[11px] tracking-[0.25em] font-light italic mt-1"
                                style={{
                                    fontFamily: "'Cormorant Garamond', 'Garamond', serif",
                                }}
                            >
                                Luxury Fragrance
                            </span>
                        </div>
                        <h1 className="text-white text-xl sm:text-2xl font-semibold mt-6">
                            Iniciar sesion
                        </h1>
                        <p className="text-white/70 text-sm mt-2">
                            Accede a tu cuenta para gestionar pedidos y favoritos.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="w-full flex items-center justify-center gap-3 rounded-xl bg-white text-black py-3.5 px-4 font-medium hover:bg-neutral-100 transition duration-200"
                        onClick={handleGoogleLogin}
                   >
                        <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                            <path
                                fill="#EA4335"
                                d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4A9.6 9.6 0 0 0 2.4 12 9.6 9.6 0 0 0 12 21.6c5.5 0 9.1-3.9 9.1-9.3 0-.6 0-1.1-.1-1.5H12Z"
                            />
                            <path
                                fill="#34A853"
                                d="M2.4 7.9l3.2 2.4C6.5 8.5 9 6 12 6c1.9 0 3.1.8 3.8 1.4l2.6-2.5C16.8 3.3 14.6 2.4 12 2.4 8.3 2.4 5.1 4.5 3.5 7.5l-1.1.4Z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M12 21.6c2.6 0 4.8-.9 6.5-2.4l-3-2.4c-.8.6-2 1.1-3.5 1.1-3 0-5.5-2-6.4-4.7l-3.1 2.4A9.6 9.6 0 0 0 12 21.6Z"
                            />
                            <path
                                fill="#4285F4"
                                d="M21.1 10.5H12v3.9h5.5c-.3 1.2-1.1 2.2-2 2.9l3 2.4c1.8-1.6 2.6-4 2.6-7.1 0-.6 0-1.1-.1-1.5Z"
                            />
                        </svg>
                        Continuar con Google
                    </button>
                    <p className="text-center text-xs text-white/55 mt-5 leading-relaxed">
                        Al continuar, aceptas nuestros terminos y condiciones.
                    </p>
                </div>
            </div>
        </section>
    );

}