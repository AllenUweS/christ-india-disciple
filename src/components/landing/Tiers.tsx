import { PricingPlans } from "@/components/pricing/PricingPlans";

const Tiers = () => {
  return (
    <section id="tiers" className="relative py-32 container">
      <div className="text-center mb-20">
        <p className="text-xs tracking-[0.3em] uppercase text-primary mb-4">Three Tiers</p>
        <h2 className="font-serif text-4xl md:text-6xl font-light mb-4">
          Choose your <span className="gold-text italic font-medium">calling</span>
        </h2>
        <div className="hairline w-32 mx-auto mt-6" />
      </div>

      <PricingPlans publicMode />
    </section>
  );
};

export default Tiers;
