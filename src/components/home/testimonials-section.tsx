"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Sarah Johnson",
    role: "Verified Customer",
    avatar: "SJ",
    rating: 5,
    text: "Absolutely love ShopElite! The product quality is exceptional, delivery was faster than expected, and the customer service team is incredibly responsive. Will definitely shop here again!",
    product: "Premium Wireless Headphones",
    color: "from-blue-500 to-indigo-500",
  },
  {
    name: "Michael Chen",
    role: "Verified Customer",
    avatar: "MC",
    rating: 5,
    text: "The shopping experience is seamless from start to finish. The UI is beautiful, checkout is a breeze, and they kept me updated throughout shipping. Top-notch e-commerce platform!",
    product: "Smart Watch Series X",
    color: "from-purple-500 to-pink-500",
  },
  {
    name: "Emily Rodriguez",
    role: "Verified Customer",
    avatar: "ER",
    rating: 5,
    text: "I've been shopping online for years and ShopElite is by far the best experience I've had. Great prices, authentic products, and the returns process was effortless.",
    product: "Designer Handbag",
    color: "from-orange-500 to-red-500",
  },
  {
    name: "David Thompson",
    role: "Verified Customer",
    avatar: "DT",
    rating: 5,
    text: "Found exactly what I was looking for and at a great price! The product arrived well-packaged and exactly as described. ShopElite has earned a loyal customer.",
    product: "Gaming Laptop",
    color: "from-green-500 to-teal-500",
  },
  {
    name: "Jessica Park",
    role: "Verified Customer",
    avatar: "JP",
    rating: 5,
    text: "The quality of every item I've ordered has been impeccable. The brand selection is impressive, and I love that I can track my order in real-time. Highly recommended!",
    product: "Skincare Bundle",
    color: "from-pink-500 to-rose-500",
  },
  {
    name: "Alex Williams",
    role: "Verified Customer",
    avatar: "AW",
    rating: 5,
    text: "Fast shipping, great customer support, and products that exceed expectations every time. ShopElite is my go-to for everything from electronics to fashion.",
    product: "Running Shoes",
    color: "from-yellow-500 to-orange-500",
  },
];

export default function TestimonialsSection() {
  const [activeIndex, setActiveIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <section className="py-16 lg:py-24 bg-slate-50 dark:bg-slate-800/50 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-1 w-8 rounded-full bg-amber-500" />
            <span className="text-sm font-semibold text-amber-500 uppercase tracking-wider">
              Social Proof
            </span>
            <div className="h-1 w-8 rounded-full bg-amber-500" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-3">
            What Our Customers Say
          </h2>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              4.9 from 50,000+ reviews
            </span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {TESTIMONIALS.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md transition-shadow"
            >
              {/* Quote Icon */}
              <div className="absolute top-6 right-6 text-slate-100 dark:text-slate-800">
                <Quote className="h-10 w-10 fill-current" />
              </div>

              {/* Rating */}
              <div className="flex mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i <= testimonial.rating
                        ? "fill-amber-400 text-amber-400"
                        : "text-slate-200"
                    }`}
                  />
                ))}
              </div>

              {/* Review */}
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-5 relative z-10">
                "{testimonial.text}"
              </p>

              {/* Product */}
              <div className="mb-5">
                <span className="inline-block text-xs bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-medium">
                  📦 {testimonial.product}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 border-t border-slate-100 dark:border-slate-800 pt-4">
                <div
                  className={`h-10 w-10 rounded-full bg-gradient-to-br ${testimonial.color} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-white text-xs font-bold">
                    {testimonial.avatar}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {testimonial.name}
                  </p>
                  <p className="text-xs text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
