// src/components/IconBadge.jsx
import React from "react";


export default function IconBadge({ type = "chat", size = 176 }) {

  const inner = Math.round(size * 0.68);

  return (
    <div
      aria-label={type}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.22,
        background:
          "radial-gradient(120% 120% at 50% 20%, #5d5d5d 0%, #505050 60%, #4a4a4a 100%)",
      }}
      className="relative grid place-items-center shadow-[0_18px_40px_rgba(0,0,0,0.28)]"
    >
      {type === "chat"  && <ChatSVG  size={inner} />}
      {type === "clock" && <ClockSVG size={inner} />}
      {type === "heart" && <HeartCommentSVG size={inner} />}
    </div>
  );
}

/* SVGs */

function ChatSVG({ size = 120 }) {
  return (
    <svg
      width={size}
      height={size * 0.78}
      viewBox="0 0 64 50"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.25)]"
    >
      {/* Message box */}
      <rect x="6" y="6" width="52" height="30" rx="9" fill="#2EAC47" />
      {/* tail */}
      <path d="M18 36 L26 36 L18 46 Z" fill="#2EAC47" />
      {/* Text lines */}
      <rect x="14" y="13" width="36" height="4" rx="2" fill="white" opacity="0.95" />
      <rect x="14" y="20" width="30" height="4" rx="2" fill="white" opacity="0.95" />
      <rect x="14" y="27" width="22" height="4" rx="2" fill="white" opacity="0.95" />
    </svg>
  );
}


function ClockSVG({ size = 120 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 220 220"
      className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.25)]"
    >
      <circle cx="110" cy="110" r="98" fill="#2EAC47" />
      <circle cx="110" cy="110" r="78" fill="#FFF2D6" />
      {/* markers */}
      {[...Array(12)].map((_, i) => {
        const a = (i * Math.PI) / 6;
        const r1 = 62, r2 = 70;
        const x1 = 110 + r1 * Math.cos(a), y1 = 110 + r1 * Math.sin(a);
        const x2 = 110 + r2 * Math.cos(a), y2 = 110 + r2 * Math.sin(a);
        return (
          <line
            key={i}
            x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#123D6B" strokeWidth="6" strokeLinecap="round"
          />
        );
      })}
      {/* hands */}
      <line x1="110" y1="110" x2="110" y2="64" stroke="#123D6B" strokeWidth="8" strokeLinecap="round" />
      <line x1="110" y1="110" x2="148" y2="132" stroke="#123D6B" strokeWidth="8" strokeLinecap="round" />
      <circle cx="110" cy="110" r="10" fill="#E33E3E" />
    </svg>
  );
}


function HeartCommentSVG({ size = 120 }) {
  const s = size * 1.1;

  return (
    <svg
      width={s}
      height={s}
      viewBox="0 0 260 240"
      className="drop-shadow-[0_6px_12px_rgba(0,0,0,0.25)]"
    >
      <defs>
        <filter id="heartShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="6" stdDeviation="4" floodOpacity="0.25" />
        </filter>
      </defs>

      <path
        d="M130 160c68-40 94-78 70-108-17-22-52-20-70 6-18-26-53-28-70-6-24 30 2 68 70 108z"
        fill="#27B24A"
        stroke="#126C33"
        strokeWidth="10"
        strokeLinejoin="round"
        filter="url(#heartShadow)"
      />

      <ellipse cx="130" cy="206" rx="82" ry="12" fill="black" opacity="0.12" />

      <g transform="translate(60,178)">
        <rect width="140" height="42" rx="21" fill="#176E36" />
        <rect x="6" y="6" width="128" height="30" rx="15" fill="#2EAC47" />
        <text
          x="20"
          y="26.5"
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="800"
          fontSize="18"
          fill="white"
        >
          COMMENT
        </text>
      </g>


    </svg>
  );
}
