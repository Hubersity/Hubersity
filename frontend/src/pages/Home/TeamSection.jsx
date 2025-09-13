// src/pages/Home/TeamSection.jsx
import React, { useEffect, useRef, useState } from "react";

const PEOPLE = [
  { name: "Karnpon Poochitkanon", role: "Frontend", img: "/images/Karnpon.jpg" },
  { name: "Patthiaon Panitanont", role: "Frontend", img: "/images/Patthiaon.jpg" },
  { name: "Khittitaj Bunupuradah", role: "Backend",  img: "/images/Khittitaj.jpg" },
  { name: "Watcharapat Pathanutpong", role: "Backend", img: "/images/Watcharapat.jpg" },
];

export default function TeamSection() {
  const ref = useRef(null);
  const [active, setActive] = useState(null);    
  const [hovered, setHovered] = useState(null); 
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.15 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  const currentIndex = hovered ?? active; 
  const current = currentIndex !== null && currentIndex !== undefined ? PEOPLE[currentIndex] : null;

  return (
    <section id="team" ref={ref} className="w-full bg-white flex items-center justify-center">
      <div
        className={`w-full max-w-[1280px] px-6 md:px-8 py-20
                    grid grid-cols-1 lg:[grid-template-columns:380px_1fr] gap-10 items-center
                    transition-all duration-700
                    ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      >
        {/* LEFT: info */}
        <div className="order-2 lg:order-1">
          <span className="inline-block bg-gray-100 text-gray-800 px-4 py-2 rounded-full mb-6 shadow-sm">
            Contact
          </span>

          <h3 className="font-extrabold leading-tight text-[32px] md:text-[40px] max-w-[340px] whitespace-normal break-words">
            {current ? current.name : "Team members"}
          </h3>

          <div className="h-[2px] w-2/3 bg-gray-200 my-5 rounded-full" />

          <p className="text-green-700 font-semibold text-[22px] md:text-[26px]">
            {current ? current.role : "Tap a photo to view"}
          </p>
        </div>

        {/* RIGHT: expandable cards */}
        <div className="order-1 lg:order-2">
          <div className="flex gap-4 h-[clamp(340px,36vw,460px)]">
            {PEOPLE.map((p, i) => {
              const isActive = i === (currentIndex ?? -1);
              return (
                <button
                  key={p.name}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setActive(i)}
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  className={`relative overflow-hidden rounded-[28px]
                              transition-[flex,box-shadow,transform] duration-500 ease-out shadow-xl
                              basis-0 ${isActive ? "flex-[1.8] ring-2 ring-green-500" : "flex-[1] ring-0"}
                              focus:outline-none`}
                >
                  <img src={p.img} alt={p.name} draggable={false} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}