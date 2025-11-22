import React from "react";
import Navbar from "./Navbar";
import Homepage from "./Homepage";
import AboutSection from "./AboutSection";
import FeatureSection from "./FeatureSection";
import TeamSection from "./TeamSection";
import Footer from "../../components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <Navbar />
      <div className="pt-20" />

      {/* Homepage */}
      <section id="home" className="w-full scroll-mt-[88px]">
        <div className="mx-auto max-w-[1280px] 2xl:max-w-[1280px] px-4 md:px-6">
          <Homepage />
        </div>
      </section>

      {/* About */}
      <section id="about" className="w-full scroll-mt-[88px]">
        <div className="mx-auto max-w-[1280px] 2xl:max-w-[1280px] px-4 md:px-6">
          <AboutSection />
        </div>
      </section>

      {/* Feature */}
      <section id="feature" className="w-full scroll-mt-[88px]">
        <div className="mx-auto max-w-[1280px] 2xl:max-w-[1280px] px-4 md:px-6">
          <FeatureSection />
        </div>
      </section>

      {/* Team / Contact */}
      <section id="contact" className="w-full scroll-mt-[88px]">
        <div className="mx-auto max-w-[1280px] 2xl:max-w-[1280px] px-4 md:px-6">
          <TeamSection />
        </div>
      </section>

      {/* Footer */}
        <Footer />
    </div>
  );
}
