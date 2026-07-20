type AuthIllustrationProps = {
  className?: string;
};

export default function AuthIllustration({ className = "" }: AuthIllustrationProps) {
  return (
    <svg
      viewBox="0 0 320 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Courbe verte */}
      <path
        d="M40 180 C40 120, 80 80, 160 100 C240 120, 280 60, 280 40"
        stroke="#059669"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Courbe bleue haute */}
      <path
        d="M20 60 C60 20, 120 40, 160 70 C200 100, 260 80, 300 50"
        stroke="#0284C7"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      {/* Courbe bleue basse */}
      <path
        d="M60 200 C100 160, 140 170, 180 150 C220 130, 260 150, 290 120"
        stroke="#0284C7"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.5"
      />

      {/* Tram */}
      <g transform="translate(148, 82)">
        <circle cx="12" cy="12" r="18" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <rect x="6" y="8" width="12" height="8" rx="2" fill="#0284C7" />
        <circle cx="8" cy="18" r="1.5" fill="#0284C7" />
        <circle cx="16" cy="18" r="1.5" fill="#0284C7" />
      </g>

      {/* Vélo */}
      <g transform="translate(228, 28)">
        <circle cx="12" cy="12" r="18" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <circle cx="8" cy="14" r="4" stroke="#059669" strokeWidth="1.5" fill="none" />
        <circle cx="16" cy="14" r="4" stroke="#059669" strokeWidth="1.5" fill="none" />
        <path d="M8 14 L12 8 L16 14" stroke="#059669" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>

      {/* Trottinette */}
      <g transform="translate(258, 102)">
        <circle cx="12" cy="12" r="18" fill="white" stroke="#E5E7EB" strokeWidth="1.5" />
        <line x1="12" y1="6" x2="12" y2="16" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="8" y1="10" x2="16" y2="10" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="12" cy="18" r="2" fill="#059669" />
      </g>
    </svg>
  );
}
