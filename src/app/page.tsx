import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/home/Hero";
import Statistics from "@/components/home/Statistics";
import Doctors from "@/components/home/Doctors";
import Features from "@/components/home/Features";
import AISection from "@/components/home/AISection";
import HowItWorks from "@/components/home/HowItWorks";
import Testimonials from "@/components/home/Testimonials";
import FAQ from "@/components/home/FAQ";
import CTA from "@/components/home/CTA";
import Footer from "@/components/home/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Statistics />
      <Features />
      <Doctors />
      <AISection />
      <HowItWorks />
      <Testimonials />
      <FAQ />
      <CTA />
      <Footer />
    </>
  );
}