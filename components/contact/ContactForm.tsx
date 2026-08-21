"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { CheckCircle2, Send } from "lucide-react";
import ImagePlaceholder from "./ImagePlaceholder";
import SectionHeading from "./SectionHeading";
import { CONTACT } from "./contactData";
import { fadeUp, serif, stagger } from "./styles";

const contactSchema = z.object({
  fullName: z.string().min(2, "Ingresa tu nombre completo."),
  email: z.string().email("Ingresa un correo electrónico válido."),
  subject: z.string().min(3, "Cuéntanos el asunto de tu mensaje."),
  message: z.string().min(10, "Tu mensaje debe tener al menos 10 caracteres."),
});

type ContactValues = z.infer<typeof contactSchema>;

const fieldBase =
  "w-full rounded-xl border bg-krov-ink/80 px-4 py-3.5 text-krov-bone placeholder:text-white/30 transition-all duration-300 focus:outline-none focus:ring-1";

export default function ContactForm() {
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({
    resolver: zodResolver(contactSchema),
    mode: "onBlur",
  });

  const onSubmit = (values: ContactValues) => {
    // Compose a pre-filled WhatsApp message using the brand's real number.
    const text = [
      `*Nuevo mensaje desde la web*`,
      `Nombre: ${values.fullName}`,
      `Correo: ${values.email}`,
      `Asunto: ${values.subject}`,
      ``,
      values.message,
    ].join("\n");

    const url = `${CONTACT.whatsapp}?text=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank", "noopener,noreferrer");
    }
    setSent(true);
    reset();
  };

  const borderFor = (hasError: boolean) =>
    hasError
      ? "border-red-500/60 focus:border-red-500 focus:ring-red-500/40"
      : "border-krov-smoke focus:border-krov-blood focus:ring-krov-blood/40";

  return (
    <section
      id="contacto-formulario"
      aria-labelledby="formulario-heading"
      className="scroll-mt-24"
    >
      <div id="formulario-heading">
        <SectionHeading
          eyebrow="Escríbenos"
          title="Cuéntanos cómo"
          emphasis="ayudarte"
          description="Completa el formulario y tu mensaje se preparará para enviarse por WhatsApp a nuestro equipo."
        />
      </div>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-14"
      >
        {/* Illustration */}
        <motion.div variants={fadeUp} className="order-1 lg:order-2">
          <ImagePlaceholder
            alt="Ilustración o fotografía de atención personalizada"
            label="Ilustración del formulario"
            src="/images/contact/Message.avif"
          />
        </motion.div>

        {/* Form */}
        <motion.div
          variants={fadeUp}
          className="order-2 rounded-[1.6rem] border border-white/5 bg-white/[0.025] p-6 backdrop-blur-sm sm:p-9 lg:order-1"
        >
          {sent ? (
            <div
              role="status"
              className="flex flex-col items-center justify-center gap-5 py-12 text-center"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full border border-krov-blood/40 bg-krov-blood/10 text-krov-rose">
                <CheckCircle2 size={28} strokeWidth={1.4} aria-hidden="true" />
              </span>
              <h3 className="text-2xl text-white" style={{ fontFamily: serif }}>
                ¡Mensaje preparado!
              </h3>
              <p
                className="max-w-sm text-white/60"
                style={{ fontFamily: serif }}
              >
                Abrimos WhatsApp con tu mensaje listo para enviar. Si no se abrió
                automáticamente, escríbenos directamente y con gusto te
                atenderemos.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-2 border border-krov-blood/40 px-7 py-3 text-xs uppercase tracking-[0.2em] text-krov-rose transition-all duration-500 hover:bg-krov-blood hover:text-black"
              >
                Enviar otro mensaje
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nombre completo" error={errors.fullName?.message} htmlFor="fullName">
                  <input
                    id="fullName"
                    type="text"
                    placeholder="Tu nombre"
                    aria-invalid={!!errors.fullName}
                    className={`${fieldBase} ${borderFor(!!errors.fullName)}`}
                    {...register("fullName")}
                  />
                </Field>
                <Field label="Correo electrónico" error={errors.email?.message} htmlFor="email">
                  <input
                    id="email"
                    type="email"
                    placeholder="tu@correo.com"
                    aria-invalid={!!errors.email}
                    className={`${fieldBase} ${borderFor(!!errors.email)}`}
                    {...register("email")}
                  />
                </Field>
              </div>

              <Field label="Asunto" error={errors.subject?.message} htmlFor="subject">
                <input
                  id="subject"
                  type="text"
                  placeholder="¿En qué te ayudamos?"
                  aria-invalid={!!errors.subject}
                  className={`${fieldBase} ${borderFor(!!errors.subject)}`}
                  {...register("subject")}
                />
              </Field>

              <Field label="Mensaje" error={errors.message?.message} htmlFor="message">
                <textarea
                  id="message"
                  rows={5}
                  placeholder="Escribe tu consulta con el mayor detalle posible…"
                  aria-invalid={!!errors.message}
                  className={`${fieldBase} resize-none ${borderFor(!!errors.message)}`}
                  {...register("message")}
                />
              </Field>

              <button
                type="submit"
                disabled={isSubmitting}
                className="group inline-flex w-full items-center justify-center gap-2 border border-krov-blood bg-krov-blood px-8 py-4 text-sm uppercase tracking-[0.25em] text-black transition-all duration-500 hover:bg-transparent hover:text-krov-rose disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send
                  size={16}
                  aria-hidden="true"
                  className="transition-transform duration-500 group-hover:translate-x-1"
                />
                Enviar mensaje
              </button>
            </form>
          )}
        </motion.div>
      </motion.div>
    </section>
  );
}

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/55"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1.5 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
