import React, { useEffect, useRef, useState } from "react";
import IconBadge from "../../components/IconBadge";

const FEATURES = [
  {
    id: "01",
    title: "CHAT",
    description:
      "The system provides real-time messaging. Users can also share files, images, and other media directly in the chat, making collaboration more interactive and convenient.",
    type: "chat",
  },
  {
    id: "02",
    title: "Study Time",
    description:
      "The web application has a study timer that allows users to track their study hours. To gamify, each user can choose a virtual sea creature pet that grows whenever a study session is completed.",
    type: "clock",
  },
  {
    id: "03",
    title: "Like & Comment",
    description:
      "Users can comment on posts to exchange ideas and discussions, as well as like posts they find interesting. This makes the platform more lively and community-driven.",
    type: "heart",
  },
];

export default function FeatureSection() {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0.2,
    });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className="w-full bg-white">
      <div className="mx-auto w-full max-w-[1280px] px-4 md:px-6 py-16 md:py-20">
        {/* 3/4 : 1/4 that maintains the proportions on all screens */}
        <div className="grid grid-cols-1 lg:[grid-template-columns:3fr_1fr] gap-10 items-start">
          {/* LEFT: cards (auto-fit, automatically adjusts the number of columns) */}
          <div className="grid grid-cols-1 sm:[grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] gap-7">
            {FEATURES.map((f, i) => (
              <div
                key={f.id}
                style={{ transitionDelay: `${i * 120}ms` }}
                className={`min-h-[clamp(380px,48vw,520px)] bg-[#EAEAEA] rounded-2xl p-7
                            flex flex-col items-center justify-center text-center
                            shadow-sm border border-black/5
                            transition-all duration-700 ease-out
                            ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
                            hover:-translate-y-1 hover:shadow-md`}
              >
                <div className="text-gray-500 text-sm mb-3 self-start">/{f.id}</div>

                {/* Icon */}
                <div className="mb-5">
                  <IconBadge type={f.type} size={176} />
                </div>

                {/* Title */}
                <h3 className="text-xl font-extrabold mb-3">{f.title}</h3>

                {/* Description */}
                <p className="text-[15px] md:text-[16px] leading-7 text-gray-700">
                  {f.description}
                </p>
              </div>
            ))}
          </div>

          {/* RIGHT: headline */}
          <div
            className={`transition-all duration-700 ease-out delay-200
                        ${inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <span className="inline-block bg-gray-100 text-gray-800 px-4 py-2 rounded-full mb-6 shadow-sm">
              Feature
            </span>

            <h2 className="font-extrabold leading-[1.1] text-[28px] md:text-[36px] xl:text-[40px]">
              Smart tools for smarter student life.
            </h2>

            <div className="h-[2px] w-3/4 bg-gray-200 my-6 rounded-full" />

            <p className="text-green-700 font-semibold leading-[1.1] text-[28px] md:text-[36px] xl:text-[40px]">
              Everything you need in one place.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
