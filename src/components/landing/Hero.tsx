import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import divineLight from "@/assets/divine-light.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-24">
      {/* Divine background */}
      <div className="absolute inset-0 -z-10">
        <img
          src={divineLight}
          alt="Divine light streaming through clouds"
          width={1920}
          height={1080}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
        <div className="absolute inset-0 bg-gradient-divine animate-glow-pulse" />
      </div>

      <div className="container relative z-10 text-center max-w-5xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 mb-8 text-xs tracking-[0.2em] uppercase text-primary"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
          AI-Powered Christian Learning
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-light leading-[1.05] text-balance mb-6"
        >
          Walk in <span className="gold-text font-medium italic">Wisdom.</span>
          <br />
          Learn by <span className="gold-text font-medium italic">Light.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.25 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 text-balance"
        >
          A divinely-crafted Learning Management System for tutors and seekers — tiered courses,
          live mentorship, and an AI guide trained on sacred teachings.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button asChild variant="divine" size="lg" className="group">
            <Link to="/auth">
              Begin Your Journey
              <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button variant="glass" size="lg" className="group">
            <Play className="w-4 h-4 fill-current" />
            Watch Testimony
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.7 }}
          className="mt-20 flex items-center justify-center gap-8 md:gap-16 text-sm text-muted-foreground"
        >
          {[
            { v: "12k+", l: "Souls Enrolled" },
            { v: "320+", l: "Sacred Lessons" },
            { v: "98%", l: "Completion" },
          ].map((s) => (
            <div key={s.l} className="text-center">
              <div className="font-serif text-3xl md:text-4xl gold-text font-medium">{s.v}</div>
              <div className="text-xs uppercase tracking-[0.2em] mt-1">{s.l}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Hero;
