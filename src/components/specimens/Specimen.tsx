import type { ReactNode } from "react";

import styles from "./Specimen.module.css";

/**
 * Specimens: abstract hairline drawings of what each service works on, with
 * the Focus Frame corners on the part in focus. They illustrate the kind of
 * work, never a client, result or metric, so they carry no numbers that could
 * read as data. Decorative: the whole figure is hidden from assistive tech,
 * because the surrounding copy already says what the service is.
 */

export type SpecimenKind =
  | "seo"
  | "digital-marketing"
  | "web-apps"
  | "overview"
  | "concept-ecommerce"
  | "concept-healthcare"
  | "concept-dashboard";

const CAPTIONS: Record<SpecimenKind, [string, string]> = {
  seo: ["Fig. 01", "Search visibility"],
  "digital-marketing": ["Fig. 02", "Channel reach"],
  "web-apps": ["Fig. 03", "Web systems"],
  overview: ["Fig. 00", "Found, reached, served"],
  "concept-ecommerce": ["Concept screens", "Storefront · product · cart"],
  "concept-healthcare": ["Concept screens", "Availability · booking"],
  "concept-dashboard": ["Concept screens", "Overview · job board"],
};

type SpecimenProps = {
  kind: SpecimenKind;
  /** Play the load motion (corners settle, the highlighted path draws). */
  animate?: boolean;
  className?: string;
};

export function Specimen({ kind, animate = false, className }: SpecimenProps) {
  const [figure, title] = CAPTIONS[kind];
  const classes = [styles.figure, animate && styles.animate, className].filter(Boolean).join(" ");

  return (
    <figure className={classes} aria-hidden="true">
      <div className={styles.plate}>{DRAWINGS[kind]}</div>
      <figcaption className={styles.caption}>
        <span>{figure}</span>
        <span>{title}</span>
      </figcaption>
    </figure>
  );
}

/** Viewfinder corners around a box, in the drawing's own units. */
function Corners({ x, y, w, h, arm = 10 }: { x: number; y: number; w: number; h: number; arm?: number }) {
  const r = x + w;
  const b = y + h;
  return (
    <g className={styles.corner}>
      <path d={`M${x} ${y + arm}V${y}H${x + arm}`} />
      <path d={`M${r - arm} ${y}H${r}V${y + arm}`} />
      <path d={`M${x} ${b - arm}V${b}H${x + arm}`} />
      <path d={`M${r - arm} ${b}H${r}V${b - arm}`} />
    </g>
  );
}

/** One search result: rank, title, URL and a snippet line. */
function Result({ y, rank, title, focus = false }: { y: number; rank: string; title: number; focus?: boolean }) {
  return (
    <g>
      <text x="14" y={y + 7} className={focus ? styles.textStrong : styles.text}>
        {rank}
      </text>
      <rect x="44" y={y} width={title} height="7" className={focus ? styles.accent : styles.bar} />
      <rect x="44" y={y + 12} width="90" height="3" className={styles.barSoft} />
      <rect x="44" y={y + 19} width={title + 60} height="4" className={styles.barSoft} />
    </g>
  );
}

function SeoDrawing() {
  return (
    <svg className={styles.svg} viewBox="0 0 400 260">
      {/* Query bar */}
      <rect x="0" y="0" width="400" height="34" className={styles.panel} />
      <circle cx="18" cy="17" r="5.5" className={styles.rule} />
      <path d="M22 21l4 4" className={styles.rule} />
      <rect x="36" y="14" width="150" height="6" className={styles.bar} />
      <text x="386" y="20" textAnchor="end" className={styles.text}>
        SEARCH
      </text>

      <Result y={52} rank="01" title={190} />
      <Result y={98} rank="02" title={170} focus />
      <Result y={144} rank="03" title={210} />
      <Result y={190} rank="04" title={150} />

      {/* Where the page sat before: a ghost row, and the climb to the framed row. */}
      <rect x="44" y="236" width="170" height="7" className={styles.ruleDashed} />
      <text x="14" y="243" className={styles.text}>
        ··
      </text>
      <path d="M232 240 C 330 240 340 112 318 106" className={styles.accentLine} />
      <path d="M318 106l5 6M318 106l7 -2" className={styles.accentLine} />

      <text x="386" y="106" textAnchor="end" className={styles.textStrong}>
        YOUR SITE
      </text>
      <Corners x={4} y={88} w={392} h={44} />
    </svg>
  );
}

const CHANNELS = [
  { label: "SEARCH", y: 34 },
  { label: "SOCIAL", y: 98, focus: true },
  { label: "EMAIL", y: 162 },
  { label: "VIDEO", y: 226 },
] as const;

function MarketingDrawing() {
  const cx = 316;
  const cy = 130;
  return (
    <svg className={styles.svg} viewBox="0 0 400 260">
      {/* Rings: the audience, narrowing to one customer. */}
      <circle cx={cx} cy={cy} r="64" className={styles.ruleDashed} />
      <circle cx={cx} cy={cy} r="40" className={styles.rule} />
      <circle cx={cx} cy={cy} r="20" className={styles.rule} />
      <circle cx={cx} cy={cy} r="7" className={styles.accent} />

      {CHANNELS.map((channel) => {
        const d = `M96 ${channel.y} C 190 ${channel.y} 210 ${cy} ${cx - 20} ${cy}`;
        return (
          <g key={channel.label}>
            <path d={d} className={"focus" in channel ? styles.accentLine : styles.rule} />
            <rect x="0" y={channel.y - 13} width="96" height="26" className={styles.panel} />
            <text x="12" y={channel.y + 3} className={"focus" in channel ? styles.textStrong : styles.text}>
              {channel.label}
            </text>
            {/* A touchpoint along each route */}
            <circle cx="170" cy={(channel.y * 3 + cy) / 4} r="2.5" className={styles.bar} />
          </g>
        );
      })}

      <text x={cx} y={cy + 86} textAnchor="middle" className={styles.text}>
        CUSTOMER
      </text>
      <Corners x={cx - 28} y={cy - 28} w={56} h={56} arm={9} />
    </svg>
  );
}

function WebAppDrawing() {
  return (
    <svg className={styles.svg} viewBox="0 0 400 260">
      {/* Window */}
      <rect x="0.5" y="0.5" width="399" height="259" className={styles.rule} />
      <rect x="1" y="1" width="398" height="22" className={styles.panel} />
      <circle cx="13" cy="12" r="3" className={styles.bar} />
      <circle cx="24" cy="12" r="3" className={styles.bar} />
      <circle cx="35" cy="12" r="3" className={styles.bar} />
      <rect x="140" y="8" width="120" height="8" className={styles.barSoft} />

      {/* Sidebar navigation, one item active */}
      <path d="M84 23V259" className={styles.rule} />
      <rect x="14" y="40" width="44" height="5" className={styles.bar} />
      <rect x="10" y="57" width="3" height="9" className={styles.accent} />
      <rect x="18" y="59" width="52" height="5" className={styles.bar} />
      <rect x="18" y="78" width="38" height="5" className={styles.barSoft} />
      <rect x="18" y="97" width="46" height="5" className={styles.barSoft} />
      <rect x="18" y="116" width="34" height="5" className={styles.barSoft} />

      {/* Overview tiles: a trend, a bar set and a status */}
      <rect x="98" y="38" width="90" height="56" className={styles.panel} />
      <polyline points="106,82 120,74 134,77 148,64 162,66 178,52" className={styles.rule} />
      <circle cx="178" cy="52" r="2.5" className={styles.signal} />
      <rect x="196" y="38" width="90" height="56" className={styles.panel} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={206 + i * 12} y={84 - (i % 3) * 8 - i * 3} width="6" height={8 + (i % 3) * 8 + i * 3} className={styles.bar} />
      ))}
      <rect x="294" y="38" width="92" height="56" className={styles.panel} />
      <rect x="304" y="50" width="40" height="5" className={styles.bar} />
      <rect x="304" y="66" width="62" height="12" className={styles.barSoft} />

      {/* Records */}
      <rect x="98" y="108" width="288" height="12" className={styles.barSoft} />
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x="98" y={128 + i * 20} width="288" height="14" className={styles.panel} />
          <rect x="106" y={133 + i * 20} width={60 + ((i * 37) % 50)} height="4" className={styles.bar} />
        </g>
      ))}

      {/* The flow in focus: a booking step with its action */}
      <rect x="262" y="214" width="124" height="34" className={styles.panel} />
      <rect x="270" y="222" width="54" height="4" className={styles.bar} />
      <rect x="270" y="231" width="40" height="4" className={styles.barSoft} />
      <rect x="334" y="221" width="44" height="20" className={styles.accent} />
      <Corners x={256} y={208} w={136} h={46} />
      <text x="248" y="236" textAnchor="end" className={styles.textStrong}>
        BOOKING FLOW
      </text>
    </svg>
  );
}

/** The hero composite: channels lead into a site that search brings into focus. */
function OverviewDrawing() {
  const targetY = 150;
  return (
    <svg className={styles.svg} viewBox="0 0 480 340">
      {/* Channels on the left, routed into the site */}
      {[
        { label: "SEARCH", y: 70, focus: false },
        { label: "SOCIAL", y: 150, focus: true },
        { label: "EMAIL", y: 230, focus: false },
      ].map((channel) => (
        <g key={channel.label}>
          <path
            d={`M86 ${channel.y} C 120 ${channel.y} 118 ${targetY} 148 ${targetY}`}
            className={channel.focus ? styles.accentLine : styles.rule}
          />
          <rect x="0" y={channel.y - 12} width="86" height="24" className={styles.panel} />
          <text x="10" y={channel.y + 3} className={channel.focus ? styles.textStrong : styles.text}>
            {channel.label}
          </text>
        </g>
      ))}

      {/* The site: a browser window showing a ranked page */}
      <rect x="148.5" y="0.5" width="331" height="339" className={styles.rule} />
      <rect x="149" y="1" width="330" height="22" className={styles.panel} />
      <circle cx="161" cy="12" r="3" className={styles.bar} />
      <circle cx="172" cy="12" r="3" className={styles.bar} />
      <circle cx="183" cy="12" r="3" className={styles.bar} />
      <rect x="250" y="8" width="130" height="8" className={styles.barSoft} />

      <rect x="164" y="40" width="300" height="26" className={styles.panel} />
      <circle cx="178" cy="53" r="5" className={styles.rule} />
      <path d="M182 57l3.5 3.5" className={styles.rule} />
      <rect x="194" y="50" width="120" height="6" className={styles.bar} />

      {[
        { y: 86, w: 170 },
        { y: 140, w: 150, focus: true },
        { y: 194, w: 190 },
        { y: 248, w: 140 },
        { y: 292, w: 176 },
      ].map((row, i) => (
        <g key={row.y}>
          <rect x="176" y={row.y} width={row.w} height="7" className={row.focus ? styles.accent : styles.bar} />
          <rect x="176" y={row.y + 13} width="84" height="3" className={styles.barSoft} />
          <rect x="176" y={row.y + 21} width={row.w + 90 > 270 ? 270 : row.w + 90} height="4" className={styles.barSoft} />
          {i === 1 ? null : <rect x="176" y={row.y + 29} width="120" height="4" className={styles.barSoft} />}
        </g>
      ))}
      <text x="456" y="147" textAnchor="end" className={styles.textStrong}>
        YOUR SITE
      </text>
      <Corners x={164} y={128} w={300} h={44} arm={11} />
    </svg>
  );
}

/** Browser chrome for the concept screens: frame, title bar, three dots, address bar. */
function Window({ w, h }: { w: number; h: number }) {
  return (
    <g>
      <rect x="0.5" y="0.5" width={w - 1} height={h - 1} className={styles.rule} />
      <rect x="1" y="1" width={w - 2} height="20" className={styles.panel} />
      <circle cx="12" cy="11" r="3" className={styles.bar} />
      <circle cx="23" cy="11" r="3" className={styles.bar} />
      <circle cx="34" cy="11" r="3" className={styles.bar} />
      <rect x={w / 2 - 60} y="7" width="120" height="8" className={styles.barSoft} />
    </g>
  );
}

/** A phone outline at (x, y), 92 × 196, with a notch; children draw the screen. */
function Phone({ x, y, children }: { x: number; y: number; children: ReactNode }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect x="0" y="0" width="92" height="196" rx="12" className={styles.phone} />
      <rect x="34" y="7" width="24" height="5" rx="2.5" className={styles.bar} />
      {children}
    </g>
  );
}

function EcommerceDrawing() {
  const tiles = [0, 1, 2, 3, 4, 5];
  return (
    <svg className={styles.svg} viewBox="0 0 480 300">
      <Window w={384} h={300} />
      {/* Store header: logo, menu, cart with a count dot */}
      <rect x="16" y="34" width="44" height="8" className={styles.bar} />
      <rect x="150" y="36" width="34" height="4" className={styles.barSoft} />
      <rect x="194" y="36" width="34" height="4" className={styles.barSoft} />
      <rect x="238" y="36" width="34" height="4" className={styles.barSoft} />
      <path d="M342 33h4l3 10h14l3-8h-18" className={styles.rule} />
      <circle cx="366" cy="32" r="3" className={styles.accent} />
      <path d="M1 54H383" className={styles.rule} />

      {/* Filters */}
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <rect x="16" y={70 + i * 20} width="8" height="8" className={i === 1 ? styles.accent : styles.rule} />
          <rect x="30" y={72 + i * 20} width={36 + ((i * 13) % 20)} height="4" className={styles.barSoft} />
        </g>
      ))}

      {/* Product grid */}
      {tiles.map((i) => {
        const x = 96 + (i % 3) * 94;
        const y = 66 + Math.floor(i / 3) * 112;
        return (
          <g key={i}>
            <rect x={x} y={y} width="84" height="70" className={styles.panel} />
            <path d={`M${x + 22} ${y + 50}l14-16 10 10 8-6 12 12`} className={styles.ruleDashed} />
            <rect x={x} y={y + 78} width="60" height="5" className={styles.bar} />
            <rect x={x} y={y + 89} width="28" height="5" className={i === 1 ? styles.accent : styles.barSoft} />
          </g>
        );
      })}
      <Corners x={184} y={60} w={96} h={106} arm={9} />

      {/* Phone: product page with options and add to cart */}
      <Phone x={388} y={74}>
        <rect x="8" y="22" width="76" height="70" className={styles.panel} />
        <circle cx="38" cy="98" r="2" className={styles.textFill} />
        <circle cx="46" cy="98" r="2" className={styles.bar} />
        <circle cx="54" cy="98" r="2" className={styles.bar} />
        <rect x="8" y="108" width="62" height="6" className={styles.bar} />
        <rect x="8" y="120" width="30" height="5" className={styles.barSoft} />
        {[0, 1, 2].map((i) => (
          <rect key={i} x={8 + i * 26} y="134" width="22" height="12" className={i === 0 ? styles.ruleStrong : styles.rule} />
        ))}
        <rect x="8" y="160" width="76" height="20" className={styles.accent} />
      </Phone>
    </svg>
  );
}

function HealthcareDrawing() {
  const days = [0, 1, 2, 3, 4];
  const slots = [0, 1, 2, 3, 4, 5];
  // Which slots are taken: a fixed pattern, so the drawing is stable.
  const taken = (d: number, s: number) => (d * 7 + s * 3) % 5 === 0 || (d + s) % 4 === 0;
  return (
    <svg className={styles.svg} viewBox="0 0 480 300">
      <Window w={384} h={300} />
      <rect x="16" y="34" width="70" height="8" className={styles.bar} />
      <rect x="290" y="32" width="78" height="14" className={styles.rule} />
      <path d="M1 54H383" className={styles.rule} />

      {/* Practitioners */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          {i === 0 ? <rect x="8" y={68} width="3" height="30" className={styles.accent} /> : null}
          <circle cx="30" cy={83 + i * 44} r="11" className={i === 0 ? styles.ruleStrong : styles.rule} />
          <rect x="48" y={77 + i * 44} width="52" height="5" className={i === 0 ? styles.bar : styles.barSoft} />
          <rect x="48" y={87 + i * 44} width="34" height="4" className={styles.barSoft} />
        </g>
      ))}
      <path d="M116 54V300" className={styles.rule} />

      {/* Week of availability */}
      {days.map((d) => (
        <g key={d}>
          <rect x={130 + d * 50} y="66" width="30" height="5" className={styles.bar} />
          <rect x={130 + d * 50} y="76" width="18" height="4" className={styles.barSoft} />
          {slots.map((s) => {
            const selected = d === 2 && s === 2;
            const isTaken = !selected && taken(d, s);
            return (
              <rect
                key={s}
                x={130 + d * 50}
                y={92 + s * 30}
                width="42"
                height="20"
                className={selected ? styles.accent : isTaken ? styles.panel : styles.rule}
              />
            );
          })}
        </g>
      ))}
      <Corners x={224} y={146} w={54} h={32} arm={8} />

      {/* Phone: booking confirmed */}
      <Phone x={388} y={74}>
        <circle cx="46" cy="58" r="18" className={styles.accentLine} />
        <path d="M38 58l6 6 11-12" className={styles.accentLine} />
        <rect x="18" y="90" width="56" height="6" className={styles.bar} />
        <rect x="24" y="102" width="44" height="4" className={styles.barSoft} />
        <rect x="8" y="118" width="76" height="34" className={styles.panel} />
        <rect x="14" y="126" width="40" height="4" className={styles.bar} />
        <rect x="14" y="136" width="56" height="4" className={styles.barSoft} />
        <rect x="8" y="162" width="76" height="20" className={styles.ruleStrong} />
      </Phone>
    </svg>
  );
}

function DashboardDrawing() {
  const columns = [0, 1, 2];
  return (
    <svg className={styles.svg} viewBox="0 0 480 300">
      <Window w={384} h={300} />
      {/* Sidebar */}
      <path d="M72 21V300" className={styles.rule} />
      <rect x="12" y="34" width="40" height="7" className={styles.bar} />
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          {i === 1 ? <rect x="6" y={59 + i * 18} width="3" height="9" className={styles.accent} /> : null}
          <rect x="14" y={61 + i * 18} width={30 + ((i * 11) % 16)} height="5" className={i === 1 ? styles.bar : styles.barSoft} />
        </g>
      ))}

      {/* Overview tiles: shapes only, never figures */}
      {[0, 1, 2, 3].map((i) => (
        <g key={i}>
          <rect x={84 + i * 74} y="32" width="66" height="44" className={styles.panel} />
          <rect x={92 + i * 74} y="40" width="26" height="4" className={styles.barSoft} />
          <rect x={92 + i * 74} y="52" width={22 + i * 6} height="9" className={styles.bar} />
          <polyline
            points={`${92 + i * 74},70 ${104 + i * 74},${66 - i} ${116 + i * 74},68 ${130 + i * 74},${63 - i} ${142 + i * 74},64`}
            className={styles.rule}
          />
        </g>
      ))}

      {/* Job board: three status columns */}
      {columns.map((c) => (
        <g key={c}>
          <rect x={84 + c * 98} y="90" width="40" height="5" className={styles.bar} />
          <circle cx={174 + c * 98} cy="92.5" r="3" className={c === 0 ? styles.signal : c === 1 ? styles.accent : styles.bar} />
          {[0, 1, 2].map((r) => (
            <g key={r}>
              <rect x={84 + c * 98} y={104 + r * 62} width="90" height="52" className={styles.panel} />
              <rect x={92 + c * 98} y={112 + r * 62} width={50 + ((c + r) * 9) % 24} height="5" className={styles.bar} />
              <rect x={92 + c * 98} y={123 + r * 62} width="40" height="4" className={styles.barSoft} />
              <circle cx={162 + c * 98} cy={144 + r * 62} r="5" className={styles.rule} />
            </g>
          ))}
        </g>
      ))}
      <Corners x={178} y={162} w={102} h={64} arm={9} />

      {/* Phone: today's jobs */}
      <Phone x={388} y={74}>
        <rect x="8" y="22" width="44" height="6" className={styles.bar} />
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <rect x="8" y={38 + i * 30} width="76" height="24" className={styles.panel} />
            <circle cx="16" cy={50 + i * 30} r="3" className={i === 1 ? styles.accent : i === 0 ? styles.signal : styles.bar} />
            <rect x="24" y={44 + i * 30} width={40 + ((i * 7) % 16)} height="4" className={styles.bar} />
            <rect x="24" y={52 + i * 30} width="28" height="3" className={styles.barSoft} />
          </g>
        ))}
      </Phone>
    </svg>
  );
}

const DRAWINGS: Record<SpecimenKind, ReactNode> = {
  seo: <SeoDrawing />,
  "digital-marketing": <MarketingDrawing />,
  "web-apps": <WebAppDrawing />,
  overview: <OverviewDrawing />,
  "concept-ecommerce": <EcommerceDrawing />,
  "concept-healthcare": <HealthcareDrawing />,
  "concept-dashboard": <DashboardDrawing />,
};
