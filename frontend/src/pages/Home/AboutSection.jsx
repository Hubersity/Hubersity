import React, { useEffect, useRef, useState } from "react";
import { FiArrowUpRight } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function AboutSection() {
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 }
    );
    if (sectionRef.current) io.observe(sectionRef.current);
    return () => io.disconnect();
  }, []);

  return (
    <section id="about" ref={sectionRef} className="w-full bg-white overflow-x-clip">
      <div className="relative mx-auto max-w-[1280px] px-4 md:px-6 py-16 md:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 xl:gap-16 items-center">
          {/* LEFT: content */}
          <div className="z-10">
            <span className="inline-block bg-gray-100 text-gray-800 text-base md:text-lg px-6 py-2 rounded-full mb-8 shadow-sm">
              About Us
            </span>

            <h2 className="font-extrabold leading-tight text-[32px] md:text-[44px] xl:text-[52px] mb-8">
              Why We Built <span className="text-green-700">Hubersity</span>
            </h2>

            <p className="text-[17px] md:text-[18px] text-gray-700 leading-7 md:leading-8 mb-6">
              Hubersity was created with one goal in mind: to make student life less
              confusing and more connected. As students ourselves, we noticed how
              scattered information and repetitive questions often lead to stress,
              wasted time, and missed opportunities.
            </p>

            <p className="text-[17px] md:text-[18px] text-gray-700 leading-7 md:leading-8 mb-10">
              So we asked: What if there was a single, friendly space to ask,
              learn, and connect?
            </p>

            <Link
            to="/signup"
            className="group inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-6 py-3 rounded-full text-lg font-semibold shadow-md transition-all duration-300"
            >
            Try Now
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white text-green-700 group-hover:translate-x-1 transition-transform">
                <FiArrowUpRight className="text-lg" />
            </span>
            </Link>
          </div>

          {/* RIGHT: chat column */}
          <div className="relative z-10 flex flex-col gap-5">
            {/* ✅ BG now anchored to this column */}
            <div
              aria-hidden
              className={`pointer-events-none absolute -z-10 inset-x-[-16px] md:inset-x-[-24px]
                          -top-6 md:-top-2 h-[360px] md:h-[420px] xl:h-[460px]
                          rounded-[32px] bg-green-50 shadow-[0_20px_60px_rgba(16,185,129,0.18)]
                          transition-all duration-700 ease-out
                          ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            />

            {[
              "Has anyone taken Prof. Piya?",
              <>Me! I took it. Prof. Piya is very kind,<br/>I really love this professor!</>,
              "Does anyone have the ISP course summary?",
              "Yes! Uploading now 📂",
              "How is Prof. Kundjanasith’s teaching?",
              "Really great, highly recommended!"
            ].map((text, i) => (
              <div
                key={i}
                className={`max-w-[min(520px,85%)] break-words px-6 py-3 rounded-2xl shadow-md
                            transition-all duration-[900ms] ease-out will-change-transform
                            ${i % 2 === 0
                              ? "self-start bg-green-700 text-white rounded-bl-none"
                              : "self-end bg-green-100 text-green-900 rounded-br-none"}
                            ${inView ? "opacity-100 translate-y-0 scale-100"
                                     : "opacity-0 translate-y-8 scale-95"}`}
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}