"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { LoginForm } from "@/components/auth/LoginForm";
import Image from "next/image";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function LoginPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex select-none">
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 bg-card border-r border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-muted/30 via-background to-background pointer-events-none" />
        <div className="absolute -top-[25%] -left-[15%] w-[60%] h-[60%] rounded-full bg-blue-500/[0.06] blur-[160px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[70%] h-[50%] rounded-full bg-indigo-500/[0.05] blur-[180px] pointer-events-none" />
        <div className="absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full bg-emerald-500/[0.03] blur-[140px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="z-10 flex w-full justify-center mt-8 mb-4"
        >
          <Image src="/1.png" alt="ebusiness+" width={360} height={99} className="rounded-2xl w-[360px] h-[99px] object-contain" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="z-10 max-w-md"
        >
          <h1 className="text-5xl font-medium tracking-tight mb-6 leading-[1.1]">
            Manage your entire enterprise in one cohesive operating system.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Ebusiness provides an elegant, scalable, and powerful platform to manage
            tenants, users, and resources globally.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="z-10 text-muted-foreground text-sm"
        >
          &copy; {new Date().getFullYear()} Ebusiness. All rights reserved.
        </motion.div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-sm"
        >
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left mb-8">
            <div className="lg:hidden mb-6">
              <Image src="/ebusiness_logo.jpeg" alt="ebusiness+" width={200} height={55} className="rounded-xl w-[200px] h-[55px] object-contain" />
            </div>
            <h2 className="text-3xl font-semibold tracking-tight mb-2">Welcome back</h2>
            <p className="text-muted-foreground">Please enter your details to sign in.</p>
          </div>

          <LoginForm />
        </motion.div>
      </div>
    </div>
  );
}
