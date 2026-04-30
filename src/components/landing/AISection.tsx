import { motion } from "framer-motion";
import { Sparkles, MessageCircle } from "lucide-react";

const AISection = () => {
  return (
    <section id="ai" className="relative py-32 container">
      <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">AI Mentor</p>
          <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight mb-6">
            A <span className="gold-text italic font-medium">guide</span> who never sleeps
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-8">
            Trained on every PDF, lesson, and lecture in your course — our AI mentor answers
            questions in the language of scripture and study. Available the moment doubt arises,
            wisdom arrives.
          </p>
          <ul className="space-y-4">
            {[
              "Trained on your course content",
              "Cites lessons and scripture references",
              "Available 24/7 across every page",
              "Remembers your learning journey",
            ].map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-primary divine-glow" />
                <span className="text-foreground/90">{p}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative"
        >
          <div className="absolute -inset-4 bg-gradient-divine blur-3xl opacity-60" />
          <div className="relative glass-strong rounded-3xl p-6 space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center divine-glow">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <p className="font-serif text-lg leading-none">Divine Mentor</p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse" />
                  Always here
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <div className="glass rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] text-sm">
                What does Lesson 3 teach about humility?
              </div>
            </div>

            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-gold shrink-0 mt-1 flex items-center justify-center">
                <Sparkles className="w-3 h-3 text-primary-foreground" />
              </div>
              <div className="glass-strong rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%] text-sm leading-relaxed">
                Lesson 3 frames humility as the foundation of all spiritual growth — drawing on
                <span className="text-primary"> Philippians 2:3-4</span>. Three practices are
                offered: silence before speaking, service before recognition, and...
              </div>
            </div>

            <div className="glass rounded-full p-1.5 flex items-center gap-2 mt-6">
              <input
                placeholder="Ask anything from your lessons..."
                className="bg-transparent border-0 outline-none flex-1 px-4 text-sm placeholder:text-muted-foreground"
              />
              <button className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center divine-glow hover:scale-105 transition-transform">
                <MessageCircle className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AISection;
