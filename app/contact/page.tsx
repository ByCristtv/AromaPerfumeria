"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function ContactPage() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsVisible(true), 50);
    return () => window.clearTimeout(timeout);
  }, []);

  return (
      <main className={`min-h-screen bg-linear-to-b from-[#333333] to-[#100d13] text-[#1f1f1f] px-6 py-16 sm:px-10 lg:px-16 transition-all duration-700 ease-out ${isVisible ? "opacity-100 translate-y-0" : "opacity-75 translate-y-4"}`}>
          <section className="mx-auto max-w-6xl mt-12 rounded-2xl border border-[#c9a96e] bg-black p-8 shadow-[0_30px_90px_rgba(0,0,0,0.08)] backdrop-blur-sm sm:p-12">
              <div className="mb-10 flex flex-col gap-6 text-center sm:gap-8">
                  <div className="inline-flex items-center justify-center rounded-full bg-[#ececec] px-4 py-2 text-sm font-semibold uppercase tracking-[0.35em] text-[#c9a96e] shadow-sm shadow-[#d4c1a6]/60">
                      Contacto
                  </div>
                  <div className="space-y-4">
                      <h1 className="text-3xl font-semibold tracking-tight text-[#ececec] sm:text-4xl">
                          Ponte en contacto con nosotros
                      </h1>
                      <p className="mx-auto max-w-3xl text-base leading-8 text-[#a5a5a5] sm:text-lg">
                          Resolve cualquier tipo de duda que tengas. Estamos aquí para ayudarte con tu compra, envíos, devoluciones y cualquier consulta sobre nuestros productos.
                      </p>
                  </div>
              </div>

              <div className="p-6 shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)] sm:p-8">

                  <div className="grid gap-6 md:grid-cols-3">
                      <article className="flex flex-col rounded-2xl border border-[#c9a96e]/30 bg-[#1a1a1a] p-8 text-center transition hover:border-[#c9a96e] hover:shadow-[0_0_20px_rgba(201,169,110,0.2)]">
                          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center text-[#c9a96e]">
                              <Image
                                  src="/icons/instagram.svg"
                                  alt="Instagram Icon"
                                  width={32}
                                  height={32}
                                  className="brightness-110"
                              />
                          </div>
                          <h3 className="mb-3 text-xl text-[#ececec] font-bold">Instagram</h3>
                          <p className="mb-6 text-sm leading-relaxed text-[#a5a5a5]">
                              Descubre nuestras notas exclusivas y novedades.
                          </p>
                          <Link
                              href="https://www.instagram.com/aromaperfumeriacr/"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded-full border border-[#c9a96e] px-6 py-2 text-sm font-semibold text-[#c9a96e] transition hover:bg-[#c9a96e] hover:text-black"
                          >
                              Ir a Instagram
                          </Link>
                      </article>
                      <article className="flex flex-col rounded-2xl border border-[#c9a96e]/30 bg-[#1a1a1a] p-8 text-center transition hover:border-[#c9a96e] hover:shadow-[0_0_20px_rgba(201,169,110,0.2)]">
                          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center text-[#c9a96e]">
                              <Image
                                  src="/icons/facebook.svg"
                                  alt="Facebook Icon"
                                  width={32}
                                  height={32}
                                  className="brightness-110"
                              />
                          </div>
                          <h3 className="mb-3 text-xl text-[#ececec] font-bold">Facebook</h3>
                          <p className="mb-6 text-sm leading-relaxed text-[#a5a5a5]">
                              Síguenos en Facebook para conocer nuestras promociones y feed.
                          </p>
                          <Link
                              href="https://www.facebook.com/aromaperfumeriacr?locale=es_LA"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded-full border border-[#c9a96e] px-6 py-2 text-sm font-semibold text-[#c9a96e] transition hover:bg-[#c9a96e] hover:text-black"
                          >
                              Ir a Facebook
                          </Link>
                      </article>
                      <article className="flex flex-col rounded-2xl border border-[#c9a96e]/30 bg-[#1a1a1a] p-8 text-center transition hover:border-[#c9a96e] hover:shadow-[0_0_20px_rgba(201,169,110,0.2)]">
                          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center text-[#c9a96e]">
                              <Image
                                  src="/icons/whatsapp.svg"
                                  alt="WhatsApp Icon"
                                  width={32}
                                  height={32}
                                  className="brightness-110"
                              />
                          </div>
                          <h3 className="mb-3 text-xl text-[#ececec] font-bold">WhatsApp</h3>
                          <p className="mb-6 text-sm leading-relaxed text-[#a5a5a5]">
                              Chatea con nosotros en WhatsApp para soporte inmediato
                          </p>
                          <Link
                              href="https://wa.me/71387812"
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center justify-center rounded-full border border-[#c9a96e] px-6 py-2 text-sm font-semibold text-[#c9a96e] transition hover:bg-[#c9a96e] hover:text-black"
                          >
                              Ir a WhatsApp
                          </Link>
                      </article>

                  </div>
              </div>
          </section>
      </main>
  );
}
