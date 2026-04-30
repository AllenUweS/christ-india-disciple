import { motion } from "framer-motion";

const testimonies = [
  { quote: "Christ India Disciple transformed how I study scripture. The AI mentor feels like a patient elder, always ready.", name: "Esther M.", role: "Senior Tier Candidate" },
  { quote: "As a tutor, the dashboard gives me clarity over every soul under my care. A holy tool.", name: "Pastor Daniel K.", role: "Lead Tutor" },
  { quote: "The tiered path made me grow at the right pace. By the Senior level, I was ready to teach.", name: "Ruth A.", role: "Graduate" },
];

const Testimony = () => {
  return (
    <section id="testimony" className="relative py-32 container">
      <div className="text-center mb-20">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">Testimony</p>
        <h2 className="font-serif text-4xl md:text-6xl font-light mb-4">
          Words from the <span className="gold-text italic font-medium">faithful</span>
        </h2>
        <div className="hairline w-32 mx-auto mt-6" />
      </div>

      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {testimonies.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: i * 0.1 }}
            className="glass rounded-3xl p-8 divine-glow-soft"
          >
            <div className="font-serif text-5xl gold-text leading-none mb-2">"</div>
            <blockquote className="font-serif text-xl leading-relaxed text-foreground/90 italic mb-6">
              {t.quote}
            </blockquote>
            <figcaption>
              <p className="font-medium">{t.name}</p>
              <p className="text-sm text-muted-foreground">{t.role}</p>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
};

export default Testimony;
