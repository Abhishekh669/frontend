import HowItWorks from "@/components/landing/Howitworks";
import Stats from "@/components/landing/Stats";
import CTA from "@/components/landing/Cta";
import Navbar from "@/components/landing/Navbar";
import Features from "@/components/landing/Features";
import Hero from "@/components/landing/Hero";
import Testimonials from "@/components/landing/Testimonials";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Stats />
        <Testimonials />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}