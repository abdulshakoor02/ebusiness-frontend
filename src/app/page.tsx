"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LoginForm } from "@/components/auth/LoginForm";
import Image from "next/image";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-black text-white flex select-none">
      {/* Left side - Branding Context */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-zinc-950 border-r border-zinc-800 relative overflow-hidden">
        {/* Abstract Background Element */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900/50 via-zinc-950/20 to-black pointer-events-none" />
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-white/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[0%] right-[0%] w-[80%] h-[40%] rounded-full bg-blue-500/5 blur-[150px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="z-10 flex w-full justify-center mt-8 mb-4"
        >
          <Image src="/1.png" alt="ebusiness+" width={360} height={99} className="rounded-2xl w-[360px] h-[99px] object-cover object-center" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="z-10 max-w-md"
        >
          <h1 className="text-5xl font-medium tracking-tight mb-6 leading-tight">
            Manage your entire enterprise in one cohesive operating system.
          </h1>
          <p className="text-zinc-400 text-lg">
            Ebusiness provides an elegant, scalable, and powerful platform to manage
            tenants, users, and resources globally.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
          className="z-10 text-zinc-500 text-sm"
        >
          &copy; {new Date().getFullYear()} Ebusiness. All rights reserved.
        </motion.div>
      </div>

      {/* Right side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left mb-8">
            <div className="lg:hidden mb-6">
              <Image src="/ebusiness_logo.jpeg" alt="ebusiness+" width={200} height={55} className="rounded-xl w-[200px] h-[55px] object-cover object-center" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight mb-2">Welcome back</h2>
            <p className="text-zinc-400">Please enter your details to sign in.</p>
          </div>

          <LoginForm />
        </motion.div>
      </div>
    </div>
  );
}
