import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Tiers from "@/components/landing/Tiers";
import Founder from "@/components/landing/Founder";
import AISection from "@/components/landing/AISection";
import Testimony from "@/components/landing/Testimony";
import CTA from "@/components/landing/CTA";
import Footer from "@/components/landing/Footer";
import FloatingAI from "@/components/landing/FloatingAI";

const Index = () => {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <Features />
      <Tiers />
      <AISection />
      <Testimony />
      <Founder />
      <CTA />
      <Footer />
      <FloatingAI />
    </main>
  );
};

export default Index;