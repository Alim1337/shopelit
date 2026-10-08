"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ShoppingBag, Star, Shield, Truck, RotateCcw } from "lucide-react";

const SLIDES = [
  {
    badge: "🔥 Promo d'Été - Jusqu'à 30% de réduction",
    title: "Équipement Gaming,",
    titleHighlight: "Qualité Premium",
    description:
      "Découvrez notre sélection de périphériques gaming et accessoires PC. Paiement à la livraison, partout en Algérie.",
    cta: "Voir la Boutique",
    ctaHref: "/products",
    secondary: "Explorer les Catégories",
    secondaryHref: "/categories",
    bg: "from-indigo-950 via-slate-900 to-purple-950",
    accent: "from-indigo-500 to-purple-500",
    stats: [
      { value: "9", label: "Catégories" },
      { value: "COD", label: "Paiement à la livraison" },
      { value: "58", label: "Wilayas couvertes" },
    ],
  },
  {
    badge: "🆕 Nouveautés",
    title: "Les Derniers",
    titleHighlight: "Indispensables",
    description:
      "Souris, claviers, casques, manettes et plus encore — des nouveautés ajoutées régulièrement.",
    cta: "Voir les Nouveautés",
    ctaHref: "/products?isNewArrival=true",
    secondary: "Meilleures Ventes",
    secondaryHref: "/products?isBestSeller=true",
    bg: "from-slate-900 via-indigo-950 to-slate-900",
    accent: "from-purple-500 to-pink-500",
    stats: [
      { value: "4", label: "Marques" },
      { value: "Cash", label: "À la livraison" },
      { value: "48h", label: "Livraison rapide" },
    ],
  },
];

const TRUST_BADGES = [
  { icon: Truck, text: "Paiement à la livraison" },
  { icon: RotateCcw, text: "Retours faciles" },
  { icon: Shield, text: "Achat sécurisé" },
  { icon: Star, text: "Service client réactif" },
];

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[currentSlide];

  return (
    <section className="relative overflow-hidden">
      {/* Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.bg} transition-all duration-1000`} />
      <Image
        src="https://res.cloudinary.com/n627qp5k/image/upload/v1790847718/gaming-pc-background-s1tzwbc9gnjpsrr1.jpg"
        alt="Hero background"
        fill
        className="object-cover opacity-20 mix-blend-overlay"
        priority
      />

      {/* Animated blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.2, 1], x: [0, 30, 0], y: [0, -20, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-indigo-600/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 0.8, 1], x: [0, -30, 0], y: [0, 20, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl"
        />
        <motion.div
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-indigo-900/10 blur-3xl"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-[90vh] flex-col items-center justify-center text-center py-24">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              {/* Badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm px-5 py-2 mb-8"
              >
                <span className="text-sm font-medium text-white">{slide.badge}</span>
              </motion.div>

              {/* Headline */}
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
                {slide.title}{" "}
                <span
                  className={`bg-gradient-to-r ${slide.accent} bg-clip-text text-transparent`}
                >
                  {slide.titleHighlight}
                </span>
              </h1>

              {/* Description */}
              <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                {slide.description}
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={slide.ctaHref}
                    className="flex items-center gap-2 h-14 px-8 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold text-lg shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 transition-all"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    {slide.cta}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    href={slide.secondaryHref}
                    className="flex items-center gap-2 h-14 px-8 rounded-2xl border-2 border-white/30 text-white font-bold text-lg backdrop-blur-sm hover:bg-white/10 transition-all"
                  >
                    {slide.secondary}
                  </Link>
                </motion.div>
              </div>

              {/* Stats */}
              <div className="flex items-center justify-center gap-8 sm:gap-16">
                {slide.stats.map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="text-center"
                  >
                    <div className="text-3xl font-black text-white">{stat.value}</div>
                    <div className="text-sm text-slate-400 mt-0.5">{stat.label}</div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Slide Indicators */}
          <div className="flex gap-2 mt-12">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  i === currentSlide ? "w-8 bg-white" : "w-2 bg-white/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Trust badges */}
      <div className="relative border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-white/10">
            {TRUST_BADGES.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center justify-center gap-3 py-4 px-6">
                <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-indigo-400" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-white/80">{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
