/**
 * DADA — the RADAAR mascot. A little clay robot whose head is a radar dish.
 * Pure SVG, claymorphic shading: key light top-left, cool occlusion below.
 */
export default function Mascot({ size = 300, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 300 300"
      fill="none"
      className={className}
      role="img"
      aria-label="DADA, the RADAAR mascot"
    >
      <defs>
        {/* clay body gradients: light from top-left */}
        <radialGradient id="mBody" cx="0.32" cy="0.24" r="0.95">
          <stop offset="0%" stopColor="#FFD9AD" />
          <stop offset="55%" stopColor="#FFB877" />
          <stop offset="100%" stopColor="#F2884B" />
        </radialGradient>
        <radialGradient id="mDish" cx="0.35" cy="0.25" r="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#EAF1FE" />
          <stop offset="100%" stopColor="#C9D9F6" />
        </radialGradient>
        <radialGradient id="mDishInner" cx="0.5" cy="0.4" r="0.9">
          <stop offset="0%" stopColor="#BFD5FA" />
          <stop offset="100%" stopColor="#8FB2EE" />
        </radialGradient>
        <radialGradient id="mCheek" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FF8A5C" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FF8A5C" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="mVisor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2E4B8F" />
          <stop offset="100%" stopColor="#16295B" />
        </linearGradient>
      </defs>

      {/* ground shadow */}
      <ellipse cx="150" cy="282" rx="86" ry="14" fill="#0E2F66" opacity="0.35" />

      {/* body */}
      <path
        d="M150 132c-52 0-84 34-84 84 0 38 34 62 84 62s84-24 84-62c0-50-32-84-84-84z"
        fill="url(#mBody)"
      />
      {/* belly light */}
      <ellipse cx="150" cy="238" rx="52" ry="30" fill="#FFE3C2" opacity="0.85" />
      {/* tiny heart on belly */}
      <path
        d="M150 232c-6-8-18-6-18 3 0 7 10 12 18 18 8-6 18-11 18-18 0-9-12-11-18-3z"
        fill="#F96A3C"
        opacity="0.9"
      />

      {/* arms */}
      <ellipse cx="62" cy="222" rx="16" ry="24" fill="url(#mBody)" transform="rotate(14 62 222)" />
      <ellipse cx="238" cy="222" rx="16" ry="24" fill="url(#mBody)" transform="rotate(-14 238 222)" />

      {/* head: the radar dish */}
      <g>
        {/* dish back */}
        <ellipse cx="150" cy="92" rx="88" ry="74" fill="url(#mDish)" />
        {/* dish inner */}
        <ellipse cx="150" cy="96" rx="66" ry="54" fill="url(#mDishInner)" />
        {/* face plate */}
        <ellipse cx="150" cy="100" rx="54" ry="44" fill="url(#mVisor)" />
        {/* eyes: shiny clay orbs */}
        <circle cx="130" cy="96" r="11" fill="#FFFFFF" />
        <circle cx="170" cy="96" r="11" fill="#FFFFFF" />
        <circle cx="132" cy="98" r="6.5" fill="#16295B" />
        <circle cx="172" cy="98" r="6.5" fill="#16295B" />
        <circle cx="128" cy="92" r="2.6" fill="#FFFFFF" />
        <circle cx="168" cy="92" r="2.6" fill="#FFFFFF" />
        {/* smile */}
        <path d="M138 116q12 10 24 0" stroke="#9FE8FF" strokeWidth="5" strokeLinecap="round" fill="none" />
        {/* cheeks */}
        <circle cx="112" cy="112" r="10" fill="url(#mCheek)" />
        <circle cx="188" cy="112" r="10" fill="url(#mCheek)" />
      </g>

      {/* antenna: pulsing radar ball */}
      <g className="mascot-antenna" style={{ transformOrigin: "150px 18px" }}>
        <line x1="150" y1="20" x2="150" y2="44" stroke="#C9D9F6" strokeWidth="7" strokeLinecap="round" />
        <circle cx="150" cy="18" r="10" fill="#F96A3C" />
        <circle cx="147" cy="15" r="3.4" fill="#FFD1B8" />
        {/* ping rings */}
        <circle cx="150" cy="18" r="14" stroke="#FFC24B" strokeWidth="3" fill="none" opacity="0.8">
          <animate attributeName="r" values="12;26" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.85;0" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx="150" cy="18" r="14" stroke="#FFC24B" strokeWidth="2" fill="none" opacity="0.6">
          <animate attributeName="r" values="12;26" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.7;0" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* side radar ears */}
      <circle cx="58" cy="96" r="13" fill="#FFC24B" />
      <circle cx="55" cy="92" r="4" fill="#FFE3AD" />
      <circle cx="242" cy="96" r="13" fill="#FFC24B" />
      <circle cx="239" cy="92" r="4" fill="#FFE3AD" />
    </svg>
  );
}
