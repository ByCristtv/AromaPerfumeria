"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { motion } from "framer-motion";
import Image from "next/image";
import {
  getAccountData,
  updatePhone,
  upsertAddress,
  type AccountData,
} from "@/features/account/getAccountData";
import {
  getProvinces,
  getCantones,
  findCanton,
} from "@/lib/cr-geo";

export default function AccountLoginCard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accountData, setAccountData] = useState<AccountData | null>(null);

  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneSaving, setPhoneSaving] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const [editingAddress, setEditingAddress] = useState(false);
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [cantonCode, setCantonCode] = useState("");
  const [district, setDistrict] = useState("");
  const [exactAddress, setExactAddress] = useState("");
  const [reference, setReference] = useState("");

  const provinces = getProvinces();
  const cantonesForProvince = getCantones(selectedProvince);

  const loadAccountData = useCallback(async (userId: string) => {
    const data = await getAccountData(userId);
    setAccountData(data);
    if (data.profile?.phone) setPhoneValue(data.profile.phone);
    if (data.address) {
      setDistrict(data.address.district);
      setExactAddress(data.address.exact_address);
      setReference(data.address.references ?? "");
      const canton = findCanton(data.address.canton);
      if (canton) {
        setSelectedProvince(canton.provinceCode);
        setCantonCode(canton.code);
      }
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (!mounted) return;
        if (error) console.error(error);

        setUser(user ?? null);
        if (user) loadAccountData(user.id);
      } catch (err) {
        console.error(err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      if (session?.user) loadAccountData(session.user.id);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadAccountData]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setAccountData(null);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error(error);
  };

  const handleSavePhone = async () => {
    if (!user) return;
    const trimmed = phoneValue.trim();
    if (trimmed.length < 8) {
      setPhoneError("Teléfono inválido (mínimo 8 dígitos)");
      return;
    }
    if (trimmed.length > 20) {
      setPhoneError("Teléfono demasiado largo");
      return;
    }
    setPhoneSaving(true);
    setPhoneError("");
    try {
      await updatePhone(user.id, trimmed);
      await loadAccountData(user.id);
      setEditingPhone(false);
    } catch {
      setPhoneError("Error al guardar el teléfono");
    } finally {
      setPhoneSaving(false);
    }
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    setAddressError("");

    if (!cantonCode) {
      setAddressError("Selecciona un cantón válido");
      return;
    }
    if (!district.trim()) {
      setAddressError("El distrito es requerido");
      return;
    }
    if (exactAddress.trim().length < 10) {
      setAddressError("Escribe las señas exactas (al menos 10 caracteres)");
      return;
    }

    const canton = findCanton(cantonCode);
    if (!canton) {
      setAddressError("Cantón inválido");
      return;
    }

    setAddressSaving(true);
    try {
      await upsertAddress(
        user.id,
        {
          province: canton.provinceCode,
          canton: canton.code,
          district: district.trim(),
          exact_address: exactAddress.trim(),
          references: reference.trim() || null,
        },
        accountData?.address?.id
      );
      await loadAccountData(user.id);
      setEditingAddress(false);
    } catch {
      setAddressError("Error al guardar la dirección");
    } finally {
      setAddressSaving(false);
    }
  };

  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProvince(e.target.value);
    setCantonCode("");
  };

  const displayPhone = accountData?.profile?.phone ?? null;
  const displayAddress = accountData?.address ?? null;

  const formatAddress = () => {
    if (!displayAddress) return null;
    const canton = findCanton(displayAddress.canton);
    const parts = [
      displayAddress.exact_address,
      displayAddress.district,
      canton?.name,
    ].filter(Boolean);
    return parts.join(", ");
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
          className="max-w-md mx-auto"
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

              {/* ── Teléfono ── */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-white/50 text-xs uppercase tracking-wider">Teléfono</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingPhone) {
                        setEditingPhone(false);
                        setPhoneError("");
                        setPhoneValue(displayPhone ?? "");
                      } else {
                        setEditingPhone(true);
                      }
                    }}
                    className="text-[#c9a96e] text-xs hover:underline"
                  >
                    {editingPhone ? "Cancelar" : displayPhone ? "Editar" : "Agregar"}
                  </button>
                </div>
                {editingPhone ? (
                  <div className="space-y-2">
                    <input
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      value={phoneValue}
                      onChange={(e) => setPhoneValue(e.target.value)}
                      placeholder="8888-8888"
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50"
                    />
                    {phoneError && <p className="text-xs text-red-400">{phoneError}</p>}
                    <button
                      type="button"
                      onClick={handleSavePhone}
                      disabled={phoneSaving}
                      className="w-full rounded-lg bg-[#c9a96e] text-black py-2 text-sm font-medium hover:bg-[#c9a96e]/90 transition disabled:opacity-50"
                    >
                      {phoneSaving ? "Guardando…" : "Guardar teléfono"}
                    </button>
                  </div>
                ) : (
                  <p className="text-white text-base">{displayPhone ?? "Sin teléfono"}</p>
                )}
              </div>

              {/* ── Dirección ── */}
              <div>
                <div className="flex items-baseline justify-between mb-1">
                  <p className="text-white/50 text-xs uppercase tracking-wider">Dirección</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (editingAddress) {
                        setEditingAddress(false);
                        setAddressError("");
                        if (accountData?.address) {
                          setDistrict(accountData.address.district);
                          setExactAddress(accountData.address.exact_address);
                          setReference(accountData.address.references ?? "");
                          const canton = findCanton(accountData.address.canton);
                          if (canton) {
                            setSelectedProvince(canton.provinceCode);
                            setCantonCode(canton.code);
                          }
                        }
                      } else {
                        setEditingAddress(true);
                      }
                    }}
                    className="text-[#c9a96e] text-xs hover:underline"
                  >
                    {editingAddress ? "Cancelar" : displayAddress ? "Editar" : "Agregar"}
                  </button>
                </div>
                {editingAddress ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-white/50 text-xs mb-1 block">Provincia</label>
                        <select
                          value={selectedProvince}
                          onChange={handleProvinceChange}
                          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50"
                        >
                          <option value="" className="bg-black">— Selecciona —</option>
                          {provinces.map((p) => (
                            <option key={p.code} value={p.code} className="bg-black">
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-white/50 text-xs mb-1 block">Cantón</label>
                        <select
                          value={cantonCode}
                          onChange={(e) => setCantonCode(e.target.value)}
                          disabled={!selectedProvince}
                          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 disabled:opacity-50"
                        >
                          <option value="" className="bg-black">
                            {selectedProvince ? "— Selecciona —" : "Provincia primero"}
                          </option>
                          {cantonesForProvince.map((c) => (
                            <option key={c.code} value={c.code} className="bg-black">
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Distrito</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="Ej. Carmen"
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Señas exactas</label>
                      <textarea
                        rows={3}
                        value={exactAddress}
                        onChange={(e) => setExactAddress(e.target.value)}
                        placeholder="200m sur de la iglesia católica, casa azul portón negro"
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50 resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-white/50 text-xs mb-1 block">Referencia (opcional)</label>
                      <input
                        type="text"
                        value={reference}
                        onChange={(e) => setReference(e.target.value)}
                        placeholder="Ej. Frente al parque"
                        className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-[#c9a96e]/50"
                      />
                    </div>
                    {addressError && <p className="text-xs text-red-400">{addressError}</p>}
                    <button
                      type="button"
                      onClick={handleSaveAddress}
                      disabled={addressSaving}
                      className="w-full rounded-lg bg-[#c9a96e] text-black py-2 text-sm font-medium hover:bg-[#c9a96e]/90 transition disabled:opacity-50"
                    >
                      {addressSaving ? "Guardando…" : "Guardar dirección"}
                    </button>
                  </div>
                ) : (
                  <p className="text-white text-base">{formatAddress() ?? "Sin dirección"}</p>
                )}
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
