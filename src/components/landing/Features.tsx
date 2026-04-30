import { motion } from "framer-motion";
import { BookOpen, Users, Video, Brain, ScrollText, Award } from "lucide-react";

const features = [
  { icon: BookOpen, title: "Sacred Curriculum", desc: "PDFs, presentations, video and scripture — woven into one luminous viewer." },
  { icon: Brain, title: "AI Mentor", desc: "An ever-present guide trained on every lesson, ready to answer in your moment of need." },
  { icon: Video, title: "Live Communion", desc: "30-minute flash sessions with tutors via seamless Google Meet integration." },
  { icon: ScrollText, title: "Tiered Wisdom", desc: "Progress from Basic to Senior — each module unlocking only when mastered." },
  { icon: Users, title: "Tutor Fellowship", desc: "Personal mentors track your walk, chat with you, and shepherd your growth." },
  { icon: Award, title: "Holy Assessments", desc: "MCQ and fill-in-the-blank trials — pass to ascend, redo to refine." },
];

const Features = () => {
  return (
    <section id="features" className="relative py-32 container">
      <div className="text-center mb-20">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">The Pillars</p>
        <h2 className="font-serif text-4xl md:text-6xl font-light mb-4">
          Everything you need to <span className="gold-text italic font-medium">grow</span>
        </h2>
        <div className="hairline w-32 mx-auto mt-6" />
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.08 }}
              className="glass rounded-3xl p-8 group divine-glow-soft hover:-translate-y-1 transition-transform duration-500"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center mb-6 divine-glow group-hover:animate-float">
                <Icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-serif text-2xl mb-3">{f.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};

export default Features;
