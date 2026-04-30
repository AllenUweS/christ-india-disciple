import { motion } from "framer-motion";
import { Cross, Crown, Quote } from "lucide-react";
import revRaviPrasad from "@/assets/rev_ravi_prasad.jpeg";

const Founder = () => {
  return (
    <section id="founder" className="relative overflow-hidden bg-background">

      {/* Ambient gold glow — top left */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.07]"
        style={{ background: "radial-gradient(circle, hsl(42 90% 60%), transparent 70%)" }} />
      {/* Ambient gold glow — bottom right */}
      <div className="pointer-events-none absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full opacity-[0.06]"
        style={{ background: "radial-gradient(circle, hsl(42 90% 60%), transparent 70%)" }} />

      {/* ── FOUNDER ── */}
      <div className="container max-w-7xl py-28 md:py-36">

        {/* Section eyebrow — centered */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center gap-3 mb-20"
        >
          <div className="flex items-center gap-3">
            <div className="w-16 h-px bg-gradient-to-r from-transparent to-primary/50" />
            <Crown className="w-4 h-4 text-primary" fill="currentColor" />
            <div className="w-16 h-px bg-gradient-to-l from-transparent to-primary/50" />
          </div>
          <p className="text-xs tracking-[0.4em] uppercase text-primary">The Calling Behind It All</p>
          <h2 className="font-serif text-4xl md:text-6xl font-light text-center">
            Meet Our <span className="gold-text italic font-medium">Founder</span>
          </h2>
          <div className="hairline w-24 mt-2" />
        </motion.div>

        {/* Main founder block */}
        <div className="grid lg:grid-cols-2 gap-0 items-stretch rounded-3xl overflow-hidden glass divine-glow-soft">

          {/* ── LEFT: Text panel ── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative flex flex-col justify-center p-10 md:p-16 order-2 lg:order-1"
          >
            {/* Vertical gold rule */}
            <div className="hidden lg:block absolute right-0 top-12 bottom-12 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

            {/* Large decorative quote mark */}
            <div className="font-serif text-[120px] leading-none gold-text opacity-10 select-none absolute top-6 left-8">
              "
            </div>

            <div className="relative z-10">
              {/* Name */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.15 }}
              >
                <p className="text-xs tracking-[0.35em] uppercase text-primary mb-3">Founder & Chairman</p>
                 <h3 className="font-serif font-medium italic leading-tight mb-8 gold-text" style={{ fontSize: "clamp(2.4rem, 4.5vw, 4rem)" }}>
                  Rev. B. Ravi Prasad
                </h3>
                
              </motion.div>

              {/* Quote */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.28 }}
                className="relative mb-10"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full bg-gradient-to-b from-primary via-primary/50 to-transparent" />
                <p className="font-serif text-base md:text-lg text-muted-foreground italic leading-[1.9] pl-6">
                  What you see today in Christ India Disciples began in quiet
                  moments with God — where He shaped, corrected, and called us.
                  This is more than a ministry; it is a response to His voice.
                  A response that calls for discipline in the unseen, so that
                  we may truly become disciples who reflect Christ in every season.
                </p>
              </motion.div>

              {/* Signature line */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.42 }}
                className="flex items-center gap-4"
              >
                <div className="hairline w-10" />
                <Cross className="w-3 h-3 text-primary/50" />
                <span className="text-xs tracking-[0.28em] uppercase text-primary/60">Called · Shaped · Sent</span>
              </motion.div>
            </div>
          </motion.div>

          {/* ── RIGHT: Photo panel ── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9 }}
            className="relative order-1 lg:order-2 min-h-[420px] lg:min-h-[600px] overflow-hidden"
          >
            {/* Photo fills the panel, cropped to show face clearly */}
            <img
              src={revRaviPrasad}
              alt="Rev. B. Ravi Prasad — Founder & Chairman"
              className="absolute inset-0 w-full h-full object-cover"
              style={{ objectPosition: "center 15%" }}
            />

            {/* Subtle dark vignette on left edge to blend with text panel */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/60 via-transparent to-transparent" />
            {/* Bottom vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
            {/* Top vignette */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent" />

            {/* Gold frame corners — decorative */}
            {/* Top-right */}
            <svg className="absolute top-4 right-4 w-12 h-12 text-primary/40" viewBox="0 0 48 48" fill="none">
              <path d="M48 0 L48 18" stroke="currentColor" strokeWidth="1"/>
              <path d="M48 0 L30 0" stroke="currentColor" strokeWidth="1"/>
            </svg>
            {/* Bottom-left */}
            <svg className="absolute bottom-4 left-4 w-12 h-12 text-primary/40" viewBox="0 0 48 48" fill="none">
              <path d="M0 48 L0 30" stroke="currentColor" strokeWidth="1"/>
              <path d="M0 48 L18 48" stroke="currentColor" strokeWidth="1"/>
            </svg>

            {/* Name overlay at bottom — visible on mobile */}
            <div className="absolute bottom-0 left-0 right-0 p-6 lg:hidden">
              <p className="font-serif text-2xl font-light text-foreground">Rev. B. <span className="gold-text font-medium italic">Ravi Prasad</span></p>
              <p className="text-xs tracking-[0.3em] uppercase text-primary mt-1">Founder & Chairman</p>
            </div>
          </motion.div>

        </div>
      </div>

      {/* ── CO-FOUNDERS ── */}
      <div className="relative pb-28">
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-px h-16 bg-gradient-to-b from-primary/25 to-transparent" />

        <div className="container max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="text-center mb-14"
          >
            <p className="text-xs tracking-[0.35em] uppercase text-primary/70 mb-3">Alongside the Vision</p>
            <h3 className="font-serif text-3xl md:text-5xl font-light">
              Co-<span className="gold-text font-medium italic">Founders</span>
            </h3>
            <div className="hairline w-16 mx-auto mt-5" />
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {[
              { initials: "BK", name: "B. Karteek", delay: 0.15 },
              { initials: "BK", name: "B. Kavya",   delay: 0.28 },
            ].map((person) => (
              <motion.div
                key={person.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.75, delay: person.delay }}
                className="relative glass rounded-2xl divine-glow-soft overflow-hidden"
              >
                {/* Gold top line */}
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                <div className="p-8 flex flex-col items-center text-center gap-5">
                  {/* Avatar ring */}
                  <div className="relative">
                    <div className="absolute -inset-2 rounded-full border border-primary/15 animate-spin" style={{ animationDuration: "30s" }} />
                    <div className="w-24 h-24 rounded-full glass border border-primary/35 divine-glow-soft flex items-center justify-center">
                      <span className="font-serif text-2xl font-light gold-text">{person.initials}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-serif text-xl font-medium mb-1">{person.name}</h4>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-px bg-primary/40" />
                      <p className="text-xs tracking-[0.25em] uppercase text-primary">Co-Founder</p>
                      <div className="w-5 h-px bg-primary/40" />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full">
                    <div className="hairline flex-1" />
                    <Cross className="w-2 h-2 text-primary/30" />
                    <div className="hairline flex-1" />
                  </div>

                  <p className="text-sm text-muted-foreground font-serif italic leading-relaxed">
                    Walking together in faith, building what God has purposed.
                  </p>
                </div>

                <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/25 to-transparent" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
};

export default Founder;