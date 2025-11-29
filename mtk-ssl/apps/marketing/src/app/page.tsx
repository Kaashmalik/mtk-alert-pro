import { Nav } from "@/components/nav";
import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { Pricing } from "@/components/pricing";
import { TrustBadges } from "@/components/trust-badges";
import { Waitlist } from "@/components/waitlist";
import { Footer } from "@/components/footer";

export default function MarketingPage() {
  return (
    <main className="min-h-screen">
      <Nav />
      <Hero />
      <section id="features">
        <Features />
      </section>
      <TrustBadges />
      <section id="pricing">
        <Pricing />
      </section>
      <Waitlist />
      <Footer tenantBranding={null} />
    </main>
  );
}
