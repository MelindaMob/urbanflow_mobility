"use client";

type WelcomeRouteMapProps = {
  className?: string;
};

/* Hub-and-spoke : 3 branches propres depuis un point de départ */
const ORIGIN = { x: 180, y: 208 };

const ROUTES = [
  {
    id: "route-tram",
    d: `M ${ORIGIN.x} ${ORIGIN.y} C 130 ${ORIGIN.y}, 95 145, 72 88`,
    stroke: "#059669",
    width: 4,
    animClass: "welcome-route-path-1",
  },
  {
    id: "route-metro",
    d: `M ${ORIGIN.x} ${ORIGIN.y} C ${ORIGIN.x} 168, ${ORIGIN.x} 118, ${ORIGIN.x} 68`,
    stroke: "#0284C7",
    width: 4,
    animClass: "welcome-route-path-2",
  },
  {
    id: "route-bike",
    d: `M ${ORIGIN.x} ${ORIGIN.y} C 230 ${ORIGIN.y}, 265 145, 288 88`,
    stroke: "#0284C7",
    width: 4,
    opacity: 0.55,
    animClass: "welcome-route-path-3",
  },
] as const;

const NODES = [
  { id: "node-tram", x: 72, y: 88, animClass: "welcome-route-node-1", type: "tram" as const },
  { id: "node-metro", x: 180, y: 68, animClass: "welcome-route-node-2", type: "metro" as const },
  { id: "node-bike", x: 288, y: 88, animClass: "welcome-route-node-3", type: "bike" as const },
] as const;

function NodeIcon({ type }: { type: "tram" | "metro" | "bike" }) {
  return (
    <>
      <circle cx="14" cy="14" r="13" fill="white" stroke="#E5E7EB" strokeWidth="1" />
      {type === "tram" && (
        <>
          <rect x="7" y="10" width="14" height="8" rx="2" fill="#059669" />
          <path d="M9 10 V8 M15 10 V8" stroke="#059669" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="10" cy="20" r="1.5" fill="#059669" />
          <circle cx="18" cy="20" r="1.5" fill="#059669" />
        </>
      )}
      {type === "metro" && (
        <>
          <rect x="7" y="11" width="14" height="7" rx="1.5" fill="#0284C7" />
          <path d="M7 14 H21" stroke="white" strokeWidth="1" opacity="0.5" />
          <circle cx="10" cy="20" r="1.5" fill="#0284C7" />
          <circle cx="18" cy="20" r="1.5" fill="#0284C7" />
        </>
      )}
      {type === "bike" && (
        <>
          <circle cx="9" cy="17" r="3.5" stroke="#0284C7" strokeWidth="1.4" fill="none" />
          <circle cx="19" cy="17" r="3.5" stroke="#0284C7" strokeWidth="1.4" fill="none" />
          <path d="M9 17 L13 9 L17 13 L19 17" stroke="#0284C7" strokeWidth="1.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </>
  );
}

export default function WelcomeRouteMap({ className = "" }: WelcomeRouteMapProps) {
  return (
    <div className={`relative w-full aspect-[5/2] max-h-[200px] sm:max-h-[220px] ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-50/80 to-white rounded-[1.5rem]" />

      <svg
        viewBox="0 0 360 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute inset-0 w-full h-full"
        aria-hidden="true"
      >
        <defs>
          <pattern id="welcome-grid" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="12" cy="12" r="0.75" fill="#E5E7EB" />
          </pattern>
          <filter id="welcome-node-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.08" />
          </filter>
        </defs>

        <rect width="360" height="240" fill="url(#welcome-grid)" opacity="0.5" />

        {/* Point de départ */}
        <g className="welcome-route-origin">
          <circle cx={ORIGIN.x} cy={ORIGIN.y} r="10" fill="white" stroke="#E5E7EB" strokeWidth="1" filter="url(#welcome-node-shadow)" />
          <circle cx={ORIGIN.x} cy={ORIGIN.y} r="4" fill="#059669" />
        </g>

        {ROUTES.map((route) => (
          <path
            key={route.id}
            d={route.d}
            stroke={route.stroke}
            strokeWidth={route.width}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            opacity={"opacity" in route ? route.opacity : 1}
            pathLength={1}
            className={route.animClass}
          />
        ))}

        {NODES.map((node) => (
          <g key={node.id} transform={`translate(${node.x - 14}, ${node.y - 14})`} filter="url(#welcome-node-shadow)">
            <g className={node.animClass}>
              <NodeIcon type={node.type} />
            </g>
          </g>
        ))}
      </svg>
    </div>
  );
}
