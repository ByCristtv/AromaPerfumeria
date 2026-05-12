"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const images = [
  "/hero-image.jpg",
  "/hero-image2.jpg",
  "/hero-image3.jpg",
  "/hero-image4.jpg",
];

export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const handleScroll = () => {
    document
      .getElementById("catalog")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % images.length);
    }, 4000); // 4 segundos

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const animationFrame = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(animationFrame);
  }, []);

  return (
    <section
      className={`h-screen w-full relative flex items-center justify-center overflow-hidden transition-all duration-1000 ease-out ${
        isVisible ? "opacity-100" : "opacity-80"
      }`}
    >
      
      {/* Fondo con fade */}
          <div className="absolute inset-0">
              {images.map((img, index) => (
                  <Image
                      key={index}
                      src={img}
                      alt="Perfume"
                      fill
                      className={`object-cover absolute inset-0 transition-all duration-4000 ${index === current
                          ? "opacity-100 scale-105"
                          : "opacity-0 scale-100"
                          }`}
                      priority={index === 0}
                  />
              ))}

              {/* Overlay oscuro */}
              <div className="absolute inset-0 bg-black/40" />
          </div>

      {/* Contenido */}
      <div
        className={`relative z-10 text-center text-white px-4 transition-all duration-1000 delay-150 ease-out ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <h1
          className="text-4xl md:text-6xl tracking-widest mb-6"
          style={{
            fontFamily:
              "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif",
          }}
        >
          "Hablemos de perfumería"
        </h1>

        <button
          onClick={handleScroll}
          className="bg-black text-[#c9a96e] px-8 py-4 font-semibold hover:scale-105 hover:text-black hover:bg-[#c9a96e] transition border-[#c9a96e] border"
          style={{
            fontFamily:
              "'Cormorant Garamond', 'Garamond', 'Times New Roman', serif",
          }}
        >
          VER CATÁLOGO
        </button>
      </div>
    </section>
  );
}