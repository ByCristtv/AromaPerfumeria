"use client";
import Link from "next/link";
import { motion } from "framer-motion"

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#333333] to-[#100d13] px-6 py-16 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 text-center mt-12">
          <h1 className="text-4xl font-bold text-[#ececec] tracking-wide mb-4">
            Panel de Administración
          </h1>
          <p className="text-[#a5a5a5] text-lg">
            Gestiona tu tienda de perfumes con facilidad
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/admin/products" className="group">
            <motion.article
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
             className="h-full rounded-2xl border border-[#c9a96e]/30 bg-[#1a1a1a] p-8 text-center shadow-[0_18px_64px_rgba(82,63,47,0.08)] transition-all duration-300 hover:border-[#c9a96e] hover:shadow-[0_0_20px_rgba(201,169,110,0.2)] hover:-translate-y-2">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c9a96e]/20 to-[#b8a060]/20 text-3xl text-[#c9a96e] shadow-inner shadow-[#c9a96e]/10">
                📦
              </div>
              <h3 className="mb-4 text-2xl font-bold text-[#ececec] group-hover:text-[#c9a96e] transition-colors">
                Administrar Productos
              </h3>
              <p className="text-sm leading-relaxed text-[#a5a5a5]">
                Agrega, elimina y edita todos tus productos aquí. Mantén tu catálogo actualizado con las últimas fragancias.
              </p>
            </motion.article>
          </Link>

          <Link href="/admin/dashboard" className="group">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="h-full rounded-2xl border border-[#c9a96e]/30 bg-[#1a1a1a] p-8 text-center shadow-[0_18px_64px_rgba(82,63,47,0.08)] transition-all duration-300 hover:border-[#c9a96e] hover:shadow-[0_0_20px_rgba(201,169,110,0.2)] hover:-translate-y-2">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c9a96e]/20 to-[#b8a060]/20 text-3xl text-[#c9a96e] shadow-inner shadow-[#c9a96e]/10">
                📊
              </div>
              <h3 className="mb-4 text-2xl font-bold text-[#ececec] group-hover:text-[#c9a96e] transition-colors">
                Mis Ventas
              </h3>
              <p className="text-sm leading-relaxed text-[#a5a5a5]">
                Observa todas tus ganancias y ventas totales. Analiza el rendimiento de tu tienda y toma decisiones informadas.
              </p>
            </motion.article>
          </Link>

          <Link href="/admin/orders" className="group md:col-span-2 lg:col-span-1">
            <motion.article
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="h-full rounded-2xl border border-[#c9a96e]/30 bg-[#1a1a1a] p-8 text-center shadow-[0_18px_64px_rgba(82,63,47,0.08)] transition-all duration-300 hover:border-[#c9a96e] hover:shadow-[0_0_20px_rgba(201,169,110,0.2)] hover:-translate-y-2">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c9a96e]/20 to-[#b8a060]/20 text-3xl text-[#c9a96e] shadow-inner shadow-[#c9a96e]/10">
                📋
              </div>
              <h3 className="mb-4 text-2xl font-bold text-[#ececec] group-hover:text-[#c9a96e] transition-colors">
                Administrar Órdenes
              </h3>
              <p className="text-sm leading-relaxed text-[#a5a5a5]">
                Aquí puedes administrar tus órdenes pendientes. Gestiona envíos, actualizaciones y soporte al cliente.
              </p>
            </motion.article>
          </Link>
        </div>
      </div>
    </main>
  );
}