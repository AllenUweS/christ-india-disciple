import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";

const FloatingAI = () => {
  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 200 }}
      className="fixed bottom-6 right-6 z-50 group"
      aria-label="Open AI mentor"
    >
      <span className="absolute inset-0 rounded-full bg-gradient-gold blur-xl opacity-60 animate-glow-pulse" />
      <span className="relative flex items-center gap-2 glass-strong rounded-full pl-3 pr-5 py-3 divine-glow group-hover:scale-105 transition-transform">
        <span className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </span>
        <span className="font-serif text-sm hidden sm:inline">Ask the Mentor</span>
      </span>
    </motion.button>
  );
};

export default FloatingAI;
