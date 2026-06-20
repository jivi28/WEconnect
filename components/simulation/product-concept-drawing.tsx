import type { ProductIllustrationPlan } from "@/lib/types";

/**
 * Procedural "concept sketch" of the finished product — no image API.
 *
 * It first tries to recognise the product from its NAME (keyword match) and
 * draw a real, product-shaped line illustration (vacuum, drone, speaker, …).
 * If nothing matches, it falls back to the model's abstract `illustrationPlan`
 * (silhouette + palette + features). Everything is plain SVG.
 */

type Palette = { body: string; dark: string; light: string; accent: string };

const PALETTES: Record<ProductIllustrationPlan["palette"], Palette> = {
  red: { body: "#c4161c", dark: "#6e0a0f", light: "#f4868b", accent: "#ffd2d4" },
  graphite: { body: "#454b54", dark: "#1b1f25", light: "#878f9b", accent: "#c3cad3" },
  silver: { body: "#b6bdc6", dark: "#5c646e", light: "#e9edf2", accent: "#ffffff" },
  blue: { body: "#1f6fb2", dark: "#0d3a5c", light: "#69b8e8", accent: "#cdebff" },
  green: { body: "#2f8a5e", dark: "#11472d", light: "#74c79c", accent: "#cdf0dd" },
};

const FALLBACK_PLAN: ProductIllustrationPlan = {
  silhouette: "rounded",
  palette: "graphite",
  features: ["controls", "sensor"],
};

export function ProductConceptDrawing({
  productName,
  plan = FALLBACK_PLAN,
}: {
  productName: string;
  plan?: ProductIllustrationPlan;
}) {
  const c = PALETTES[plan.palette] ?? PALETTES.graphite;
  const archetype = matchArchetype(productName);

  return (
    <svg
      viewBox="0 0 210 200"
      role="img"
      aria-label={`Technical concept drawing of ${productName}`}
      className="h-full w-full"
    >
      <Defs c={c} />

      {/* Sketch-paper backdrop. */}
      <rect width="210" height="200" fill="#f6fbf7" />
      <rect width="210" height="200" fill="url(#cd-grid)" opacity="0.55" />
      <rect width="210" height="200" fill="url(#cd-vignette)" />

      {/* Blueprint corner ticks. */}
      <g stroke={c.dark} strokeWidth="1" opacity="0.5" fill="none">
        <path d="M10 10 H22 M10 10 V22" />
        <path d="M200 10 H188 M200 10 V22" />
        <path d="M10 190 H22 M10 190 V178" />
        <path d="M200 190 H188 M200 190 V178" />
      </g>

      {/* Contact shadow. */}
      <ellipse cx="105" cy="170" rx="68" ry="9" fill="#0c2018" opacity="0.13" />

      <g filter="url(#cd-shadow)">
        {archetype ? (
          archetype.draw(c)
        ) : (
          <GenericProduct silhouette={plan.silhouette} features={plan.features} c={c} />
        )}
      </g>

      {/* Dimension line + scale label. */}
      <g stroke={c.dark} strokeWidth="1" opacity="0.4">
        <path d="M40 184 H170 M40 181 V187 M170 181 V187" />
      </g>
      <text x="105" y="197" textAnchor="middle" fontSize="7" fill={c.dark} opacity="0.55" fontFamily="ui-sans-serif, system-ui, sans-serif" letterSpacing="0.5">
        CONCEPT · NOT TO SCALE
      </text>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Shared SVG defs                                                    */
/* ------------------------------------------------------------------ */

function Defs({ c }: { c: Palette }) {
  return (
    <defs>
      <linearGradient id="cd-body" x1="0" y1="0" x2="0.85" y2="1">
        <stop offset="0" stopColor={c.light} />
        <stop offset="0.45" stopColor={c.body} />
        <stop offset="1" stopColor={c.dark} />
      </linearGradient>
      <linearGradient id="cd-screen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#1a3340" />
        <stop offset="1" stopColor="#0a1820" />
      </linearGradient>
      <radialGradient id="cd-lens" cx="0.4" cy="0.35" r="0.75">
        <stop offset="0" stopColor="#bde6ff" />
        <stop offset="0.5" stopColor="#3aa0d6" />
        <stop offset="1" stopColor="#0f2c3d" />
      </radialGradient>
      <pattern id="cd-grid" width="12" height="12" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="0.7" fill="#c9d4d0" />
      </pattern>
      <radialGradient id="cd-vignette" cx="0.5" cy="0.42" r="0.75">
        <stop offset="0.6" stopColor="#000000" stopOpacity="0" />
        <stop offset="1" stopColor="#0b1a14" stopOpacity="0.1" />
      </radialGradient>
      <filter id="cd-shadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#0a1f17" floodOpacity="0.26" />
      </filter>
    </defs>
  );
}

/** The `cd-body` gradient is repainted per palette in <Defs>; shapes just reference it. */
const BODY = "url(#cd-body)";

/* ------------------------------------------------------------------ */
/* Product archetypes — recognisable line drawings                    */
/* ------------------------------------------------------------------ */

type Archetype = { id: string; keywords: string[]; draw: (c: Palette) => React.ReactNode };

/** Wraps a drawing's SVG content in a group. */
function group(_c: Palette, children: React.ReactNode) {
  return <g>{children}</g>;
}

const ARCHETYPES: Archetype[] = [
  {
    id: "vacuum",
    keywords: ["vacuum", "vaccum", "hoover", "cleaner"],
    draw: (c) =>
      group(
        c,
        <>
          <rect x="50" y="148" width="100" height="16" rx="5" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <path d="M96 150 L104 122 H120 L130 150 Z" fill={c.dark} />
          <rect x="84" y="76" width="54" height="52" rx="16" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <rect x="91" y="84" width="40" height="38" rx="9" fill={c.accent} opacity="0.4" stroke={c.dark} strokeWidth="1.4" />
          <rect x="102" y="34" width="13" height="46" rx="5" fill={BODY} stroke={c.dark} strokeWidth="2.2" />
          <path d="M108 34 q24 0 24 24" fill="none" stroke={c.dark} strokeWidth="10" strokeLinecap="round" />
          <path d="M108 34 q24 0 24 24" fill="none" stroke={c.body} strokeWidth="5.5" strokeLinecap="round" />
        </>,
      ),
  },
  {
    id: "drone",
    keywords: ["drone", "quadcopter", "uav", "copter"],
    draw: (c) =>
      group(
        c,
        <>
          <g stroke={c.body} strokeWidth="7" strokeLinecap="round">
            <path d="M105 98 L60 60 M105 98 L150 60 M105 98 L60 136 M105 98 L150 136" />
          </g>
          <rect x="86" y="80" width="38" height="36" rx="10" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          {[[60, 60], [150, 60], [60, 136], [150, 136]].map(([x, y]) => (
            <g key={`${x}-${y}`}>
              <ellipse cx={x} cy={y} rx="24" ry="6" fill={c.light} opacity="0.55" />
              <circle cx={x} cy={y} r="6.5" fill={c.dark} />
            </g>
          ))}
        </>,
      ),
  },
  {
    id: "speaker",
    keywords: ["speaker", "subwoofer", "soundbar", "boombox"],
    draw: (c) =>
      group(
        c,
        <>
          <rect x="68" y="38" width="74" height="124" rx="12" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <circle cx="105" cy="78" r="21" fill={c.dark} />
          <circle cx="105" cy="78" r="13" fill={c.light} opacity="0.45" />
          <circle cx="105" cy="78" r="5" fill={c.dark} />
          <circle cx="105" cy="128" r="15" fill={c.dark} />
          <circle cx="105" cy="128" r="8" fill={c.light} opacity="0.45" />
        </>,
      ),
  },
  {
    id: "headphones",
    keywords: ["headphone", "headset", "earphone", "earbud", "earpod"],
    draw: (c) =>
      group(
        c,
        <>
          <path d="M58 116 V96 a47 47 0 0 1 94 0 V116" fill="none" stroke={c.body} strokeWidth="9" strokeLinecap="round" />
          <rect x="44" y="106" width="28" height="46" rx="12" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <rect x="138" y="106" width="28" height="46" rx="12" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
        </>,
      ),
  },
  {
    id: "lamp",
    keywords: ["lamp", "desk light", "spotlight", "luminaire"],
    draw: (c) =>
      group(
        c,
        <>
          <ellipse cx="78" cy="158" rx="34" ry="8" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <path d="M78 154 L86 98 L130 72" fill="none" stroke={c.body} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="86" cy="98" r="5" fill={c.dark} />
          <path d="M118 54 L152 64 L140 90 L112 78 Z" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <path d="M126 88 L142 116" stroke="#ffe879" strokeWidth="6" opacity="0.55" strokeLinecap="round" />
        </>,
      ),
  },
  {
    id: "bulb",
    keywords: ["bulb", "led light", "light source", "downlight"],
    draw: (c) =>
      group(
        c,
        <>
          <circle cx="105" cy="82" r="42" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <circle cx="105" cy="82" r="42" fill="#ffe879" opacity="0.22" />
          <path d="M87 118 H123 L119 142 H91 Z" fill={c.dark} />
          <path d="M90 127 H120 M91 134 H119" stroke={c.body} strokeWidth="2" />
          <path d="M96 88 V76 q9 -11 18 0 V88" fill="none" stroke="#ffd34d" strokeWidth="3" strokeLinecap="round" />
          <g stroke="#ffe879" strokeWidth="3" strokeLinecap="round" opacity="0.6">
            <path d="M105 26 V16 M152 44 L160 36 M58 44 L50 36" />
          </g>
        </>,
      ),
  },
  {
    id: "router",
    keywords: ["router", "hub", "gateway", "access point", "modem", "wifi", "wi-fi"],
    draw: (c) =>
      group(
        c,
        <>
          <g stroke={c.body} strokeWidth="5" strokeLinecap="round">
            <path d="M80 106 V66 M130 106 V66" />
          </g>
          <circle cx="80" cy="64" r="4" fill={c.dark} />
          <circle cx="130" cy="64" r="4" fill={c.dark} />
          <rect x="58" y="104" width="94" height="46" rx="9" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <g fill={c.accent}>
            <circle cx="75" cy="138" r="3" />
            <circle cx="89" cy="138" r="3" />
            <circle cx="103" cy="138" r="3" />
          </g>
          <g fill="none" stroke={c.body} strokeWidth="2.4" opacity="0.5">
            <path d="M104 52 a26 26 0 0 1 22 12" />
            <path d="M104 40 a40 40 0 0 1 34 18" />
          </g>
        </>,
      ),
  },
  {
    id: "phone",
    keywords: ["phone", "smartphone", "mobile", "handset"],
    draw: (c) =>
      group(
        c,
        <>
          <rect x="78" y="32" width="54" height="136" rx="13" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <rect x="84" y="44" width="42" height="106" rx="4" fill="url(#cd-screen)" />
          <rect x="98" y="37" width="14" height="3" rx="1.5" fill={c.dark} />
          <circle cx="105" cy="159" r="4" fill={c.dark} />
        </>,
      ),
  },
  {
    id: "laptop",
    keywords: ["laptop", "notebook", "computer", "pc"],
    draw: (c) =>
      group(
        c,
        <>
          <rect x="58" y="48" width="94" height="64" rx="6" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <rect x="63" y="53" width="84" height="54" rx="3" fill="url(#cd-screen)" />
          <path d="M44 152 L62 112 H148 L166 152 Z" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <path d="M72 144 H138" stroke={c.dark} strokeWidth="3" strokeLinecap="round" opacity="0.5" />
        </>,
      ),
  },
  {
    id: "monitor",
    keywords: ["monitor", "tv", "television", "display", "screen"],
    draw: (c) =>
      group(
        c,
        <>
          <rect x="38" y="42" width="134" height="86" rx="8" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <rect x="46" y="50" width="118" height="70" rx="3" fill="url(#cd-screen)" />
          <rect x="98" y="128" width="14" height="20" fill={c.dark} />
          <rect x="76" y="148" width="58" height="8" rx="4" fill={BODY} stroke={c.dark} strokeWidth="2" />
        </>,
      ),
  },
  {
    id: "camera",
    keywords: ["camera", "dslr", "webcam", "cctv", "surveillance"],
    draw: (c) =>
      group(
        c,
        <>
          <rect x="72" y="64" width="28" height="16" rx="3" fill={BODY} stroke={c.dark} strokeWidth="2" />
          <rect x="54" y="76" width="102" height="66" rx="10" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <circle cx="116" cy="110" r="25" fill={c.dark} />
          <circle cx="116" cy="110" r="16" fill="url(#cd-lens)" />
          <circle cx="110" cy="104" r="4" fill="#fff" opacity="0.7" />
          <circle cx="68" cy="72" r="4" fill={c.accent} />
        </>,
      ),
  },
  {
    id: "fan",
    keywords: ["fan", "cooler", "ventilator", "blower"],
    draw: (c) =>
      group(
        c,
        <>
          <rect x="100" y="120" width="10" height="38" fill={c.dark} />
          <ellipse cx="105" cy="160" rx="26" ry="7" fill={BODY} stroke={c.dark} strokeWidth="2.2" />
          <circle cx="105" cy="84" r="50" fill="none" stroke={c.body} strokeWidth="6" />
          <circle cx="105" cy="84" r="44" fill={c.accent} opacity="0.14" />
          <g fill={c.body} opacity="0.85" stroke={c.dark} strokeWidth="1">
            <path d="M105 84 Q80 56 104 44 Q116 64 105 84 Z" />
            <path d="M105 84 Q136 70 134 102 Q108 98 105 84 Z" />
            <path d="M105 84 Q98 118 70 102 Q92 80 105 84 Z" />
          </g>
          <circle cx="105" cy="84" r="8" fill={c.dark} />
        </>,
      ),
  },
  {
    id: "scooter",
    keywords: ["scooter", "e-bike", "ebike", "bike", "bicycle", "skateboard"],
    draw: (c) =>
      group(
        c,
        <>
          <g fill="#1a1d22" stroke={c.dark} strokeWidth="2.4">
            <circle cx="56" cy="150" r="16" />
            <circle cx="154" cy="150" r="16" />
          </g>
          <g fill="#8c98a6">
            <circle cx="56" cy="150" r="5" />
            <circle cx="154" cy="150" r="5" />
          </g>
          <path d="M56 150 H150" stroke={c.body} strokeWidth="8" strokeLinecap="round" />
          <path d="M154 150 L150 58" stroke={c.body} strokeWidth="7" strokeLinecap="round" />
          <path d="M130 58 H170" stroke={c.dark} strokeWidth="7" strokeLinecap="round" />
        </>,
      ),
  },
  {
    id: "robot",
    keywords: ["robot", "bot", "android", "humanoid"],
    draw: (c) =>
      group(
        c,
        <>
          <path d="M105 40 V30" stroke={c.dark} strokeWidth="3" />
          <circle cx="105" cy="27" r="4" fill="#ffe879" />
          <rect x="80" y="42" width="50" height="40" rx="10" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <circle cx="94" cy="62" r="5" fill={c.accent} />
          <circle cx="116" cy="62" r="5" fill={c.accent} />
          <rect x="72" y="90" width="66" height="58" rx="10" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <circle cx="105" cy="118" r="10" fill={c.dark} />
          <path d="M72 100 H58 V134" stroke={c.body} strokeWidth="6" fill="none" strokeLinecap="round" />
          <path d="M138 100 H152 V134" stroke={c.body} strokeWidth="6" fill="none" strokeLinecap="round" />
        </>,
      ),
  },
  {
    id: "washer",
    keywords: ["washing", "washer", "dryer", "dishwasher", "laundry"],
    draw: (c) =>
      group(
        c,
        <>
          <rect x="62" y="40" width="86" height="120" rx="8" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <path d="M62 64 H148" stroke={c.dark} strokeWidth="1.6" opacity="0.4" />
          <circle cx="78" cy="52" r="4" fill={c.dark} />
          <rect x="92" y="49" width="46" height="6" rx="3" fill={c.dark} opacity="0.5" />
          <circle cx="105" cy="112" r="32" fill={c.dark} />
          <circle cx="105" cy="112" r="24" fill="url(#cd-screen)" />
          <circle cx="105" cy="112" r="24" fill={c.accent} opacity="0.15" />
        </>,
      ),
  },
  {
    id: "thermostat",
    keywords: ["thermostat", "thermometer", "climate", "hvac", "temperature"],
    draw: (c) =>
      group(
        c,
        <>
          <circle cx="105" cy="96" r="52" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <circle cx="105" cy="96" r="38" fill="url(#cd-screen)" />
          <g stroke={c.accent} strokeWidth="2" opacity="0.55">
            <path d="M105 50 V58 M151 96 H143 M105 142 V134 M59 96 H67" />
          </g>
          <circle cx="92" cy="84" r="9" fill={c.light} opacity="0.25" />
        </>,
      ),
  },
  {
    id: "charger",
    keywords: ["charger", "adapter", "usb-c charger", "wall plug", "power supply", "psu"],
    draw: (c) =>
      group(
        c,
        <>
          <rect x="74" y="58" width="62" height="72" rx="13" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <g stroke={c.dark} strokeWidth="5" strokeLinecap="round">
            <path d="M94 58 V42 M116 58 V42" />
          </g>
          <path d="M105 130 q0 26 26 32" fill="none" stroke={c.dark} strokeWidth="5" strokeLinecap="round" />
          <circle cx="105" cy="96" r="4" fill={c.accent} />
        </>,
      ),
  },
  {
    id: "battery",
    keywords: ["battery", "power bank", "powerbank", "cell", "ups", "energy storage"],
    draw: (c) =>
      group(
        c,
        <>
          <rect x="66" y="62" width="78" height="96" rx="12" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <rect x="92" y="54" width="26" height="10" rx="3" fill={c.dark} />
          <path d="M110 82 L94 114 H106 L100 138 L122 102 H108 Z" fill={c.accent} stroke={c.dark} strokeWidth="1.4" strokeLinejoin="round" />
          <g fill={c.accent}>
            <circle cx="80" cy="148" r="2.5" />
            <circle cx="90" cy="148" r="2.5" />
            <circle cx="100" cy="148" r="2.5" />
          </g>
        </>,
      ),
  },
  {
    id: "watch",
    keywords: ["watch", "wearable", "fitness band", "tracker", "smartwatch"],
    draw: (c) =>
      group(
        c,
        <>
          <path d="M88 30 H122 L118 64 H92 Z" fill={c.dark} opacity="0.85" />
          <path d="M92 138 H118 L122 172 H88 Z" fill={c.dark} opacity="0.85" />
          <rect x="74" y="58" width="62" height="84" rx="18" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <rect x="82" y="66" width="46" height="68" rx="12" fill="url(#cd-screen)" />
          <circle cx="138" cy="92" r="3.4" fill={c.accent} />
        </>,
      ),
  },
  {
    id: "car",
    keywords: ["car", "vehicle", "automobile", "ev ", "electric car", "automotive"],
    draw: (c) =>
      group(
        c,
        <>
          <path d="M28 120 L46 78 Q53 64 72 63 H134 Q150 64 159 80 L182 120 V142 H28 Z" fill={BODY} stroke={c.dark} strokeWidth="2.4" />
          <path d="M58 66 Q64 78 64 92 H102 V64 Z" fill="#bfe3f2" stroke={c.dark} strokeWidth="1.6" opacity="0.85" />
          <path d="M110 64 V92 H150 Q150 76 142 66 Z" fill="#bfe3f2" stroke={c.dark} strokeWidth="1.6" opacity="0.85" />
          <g fill="#1a1d22" stroke="#e7eef5" strokeWidth="2.4">
            <circle cx="62" cy="146" r="17" />
            <circle cx="150" cy="146" r="17" />
          </g>
          <g fill="#8c98a6">
            <circle cx="62" cy="146" r="6" />
            <circle cx="150" cy="146" r="6" />
          </g>
        </>,
      ),
  },
];

function matchArchetype(productName: string): Archetype | null {
  const name = ` ${productName.toLowerCase()} `;
  for (const archetype of ARCHETYPES) {
    if (archetype.keywords.some((kw) => name.includes(kw))) return archetype;
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Generic fallback (model's abstract silhouette + features)          */
/* ------------------------------------------------------------------ */

function GenericProduct({
  silhouette,
  features,
  c,
}: {
  silhouette: ProductIllustrationPlan["silhouette"];
  features: ProductIllustrationPlan["features"];
  c: Palette;
}) {
  const has = (f: ProductIllustrationPlan["features"][number]) =>
    features.includes(f);
  const edge = { stroke: c.dark, strokeWidth: 2.4 };

  return (
    <g>
      {silhouette === "circular" && <circle cx="105" cy="96" r="58" fill={BODY} {...edge} />}
      {silhouette === "tall" && <rect x="68" y="26" width="74" height="140" rx="22" fill={BODY} {...edge} />}
      {silhouette === "wide" && <rect x="24" y="58" width="162" height="92" rx="20" fill={BODY} {...edge} />}
      {silhouette === "panel" && <path d="M26 50 L172 40 L186 142 L40 154 Z" fill={BODY} {...edge} />}
      {silhouette === "wearable" && ARCHETYPES.find((a) => a.id === "watch")!.draw(c)}
      {silhouette === "vehicle" && ARCHETYPES.find((a) => a.id === "car")!.draw(c)}
      {silhouette === "rounded" && <rect x="42" y="40" width="126" height="120" rx="30" fill={BODY} {...edge} />}

      {has("display") && (
        <>
          <rect x="74" y="70" width="62" height="38" rx="6" fill="#0a151b" />
          <rect x="77" y="73" width="56" height="32" rx="4" fill="url(#cd-screen)" />
          <path d="M81 100 L94 88 L104 95 L117 81 L129 90" fill="none" stroke="#5fd0ff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.85" />
        </>
      )}
      {has("controls") && (
        <g>
          {[88, 105, 122].map((x) => (
            <g key={x}>
              <circle cx={x} cy="130" r="6.5" fill={c.dark} />
              <circle cx={x} cy="130" r="2.2" fill={c.accent} />
              <path d={`M${x} 124.5 V 127`} stroke="#ffffff" strokeWidth="1.4" strokeLinecap="round" />
            </g>
          ))}
        </g>
      )}
      {has("vents") && (
        <g stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" opacity="0.5">
          <path d="M150 70 H172 M150 80 H172 M150 90 H172 M150 100 H172" />
        </g>
      )}
      {has("sensor") && (
        <g>
          <circle cx="105" cy="55" r="8.5" fill="#0e2a3a" />
          <circle cx="105" cy="55" r="6.5" fill="url(#cd-lens)" />
          <circle cx="102.5" cy="52.5" r="1.8" fill="#ffffff" opacity="0.85" />
        </g>
      )}
      {has("lighting") && (
        <path d="M60 150 Q105 164 150 150" fill="none" stroke="#ffe879" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
      )}
    </g>
  );
}
