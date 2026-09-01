"use client";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
const qbeLogo = "/assets/qbe-logo.png";

interface WelcomeProps {
  onContinue: () => void;
  role: "underwriter" | "manager";
}

export function Welcome({ onContinue, role }: WelcomeProps) {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="h-screen w-screen bg-[#F9F9F8] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-md px-8"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="flex items-center justify-center mb-10"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F9760A] to-[#00205B] flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl text-[#1A1A1A] mb-3"
          style={{ fontWeight: 300 }}
        >
          {getGreeting()}, {role === "manager" ? "Mike Farrell" : "Mike"}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-[#9B9B98] mb-12"
        >
          {role === "manager"
            ? "Your AI UW agents are ready. Let's review your portfolio."
            : "Your AI UW assistant is ready. Let's review your queue."}
        </motion.p>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          onClick={onContinue}
          className="px-8 py-3 bg-[#2D2D2D] text-white rounded-full text-sm hover:bg-[#1A1A1A] transition-colors"
        >
          Start
        </motion.button>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1.2 }}
          className="mt-10 flex items-center justify-center gap-2"
        >
          <Image src={qbeLogo} alt="QBE" width={20} height={20} className="w-5 h-5 opacity-40" />
          <span className="text-[10px] text-[#B0B0AC]">QBE Commercial Property AI Workbench</span>
        </motion.div>
      </motion.div>
    </div>
  );
}



