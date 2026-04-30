import { Sparkles } from "lucide-react";

const Footer = () => {
  return (
    <footer className="container py-16 border-t border-border/40">
      <div className="grid md:grid-cols-4 gap-12 mb-12">
        <div className="md:col-span-2">
          <a href="#" className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-gold flex items-center justify-center divine-glow">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-serif text-xl font-semibold">
              Divine <span className="gold-text">Faith</span>
            </span>
          </a>
          <p className="text-muted-foreground max-w-sm leading-relaxed">
            An AI-powered Christian Learning Management System — built to nurture wisdom,
            illuminate scripture, and shepherd souls.
          </p>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-primary mb-4">Learn</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#tiers" className="hover:text-foreground transition-colors">Tiers</a></li>
            <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
            <li><a href="#ai" className="hover:text-foreground transition-colors">AI Mentor</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs tracking-[0.2em] uppercase text-primary mb-4">Fellowship</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground transition-colors">For Tutors</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">For Candidates</a></li>
            <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="hairline mb-8" />
      <p className="text-xs text-muted-foreground text-center tracking-wider">
        © {new Date().getFullYear()} Christ India Disciple. Walk in the light.
      </p>
    </footer>
  );
};

export default Footer;
