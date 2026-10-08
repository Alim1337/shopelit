"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/product-card";
import type { Product } from "@/types";

interface FlashSaleSectionProps {
  products: Product[];
  endTime?: Date;
}

function useCountdown(endTime: Date) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const update = () => {
      const diff = endTime.getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ hours, minutes, seconds });
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return timeLeft;
}

function TimeUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="h-14 w-14 rounded-xl bg-slate-900 dark:bg-slate-800 flex items-center justify-center shadow-lg">
        <motion.span
          key={value}
          initial={{ rotateX: 90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          className="text-2xl font-black text-white tabular-nums"
        >
          {value.toString().padStart(2, "0")}
        </motion.span>
      </div>
      <span className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 font-medium uppercase">
        {label}
      </span>
    </div>
  );
}

export default function FlashSaleSection({
  products,
  endTime,
}: FlashSaleSectionProps) {
  const saleEndTime = useMemo(
    () => endTime || new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours from now
    [endTime]
  );
  const { hours, minutes, seconds } = useCountdown(saleEndTime);

  const saleProducts = products.slice(0, 4);

  if (!saleProducts.length) return null;

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-10 gap-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Zap className="h-5 w-5 text-white fill-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-xs font-bold text-red-600 uppercase tracking-widest">
                    Limited Time
                  </span>
                </div>
                <h2 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  Flash Sale
                </h2>
              </div>
            </div>

            {/* Countdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400 mr-1">
                Ends in:
              </span>
              <TimeUnit value={hours} label="Hours" />
              <span className="text-2xl font-bold text-slate-400 mb-4">:</span>
              <TimeUnit value={minutes} label="Mins" />
              <span className="text-2xl font-bold text-slate-400 mb-4">:</span>
              <TimeUnit value={seconds} label="Secs" />
            </div>
          </div>

          <Link
            href="/products?isOnSale=true"
            className="flex items-center gap-1.5 text-sm font-semibold text-red-600 hover:text-red-700 transition-colors"
          >
            View All Deals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Products */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {saleProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
