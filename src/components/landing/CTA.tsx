import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="relative py-32 container">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative glass-strong rounded-[2.5rem] p-12 md:p-20 text-center overflow-hidden divine-glow"
      >
        <div className="absolute inset-0 bg-gradient-divine opacity-80" />
        <div className="relative z-10">
          <h2 className="font-serif text-4xl md:text-6xl font-light leading-tight mb-6 max-w-3xl mx-auto text-balance">
            Your journey toward <span className="gold-text italic font-medium">divine wisdom</span> begins now
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-10">
            Join thousands walking the path of light. The first lesson awaits — freely given.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild variant="divine" size="lg" className="group">
              <Link to="/auth">
                Begin Free
                <ArrowRight className="ml-1 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="glass" size="lg">Speak with a Mentor</Button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default CTA;
