export const EDGE_ANIMATION_STYLES = [
  { id: "none", label: "None", desc: "Static line, no motion" },
  {
    id: "dash-flow",
    label: "Flowing Dashes",
    desc: "Classic moving dash line",
  },
  { id: "dash-flow-fast", label: "Fast Flow", desc: "Same, but quicker" },
  { id: "dash-flow-slow", label: "Slow Flow", desc: "Same, but more relaxed" },
  {
    id: "dash-flow-reverse",
    label: "Reverse Flow",
    desc: "Dashes flow backward",
  },
  {
    id: "marching-ants",
    label: "Marching Ants",
    desc: "Short tight dashes, brisk pace",
  },
  { id: "conveyor", label: "Conveyor", desc: "Bold, blocky dashes rolling by" },
  { id: "dash-dot", label: "Dash-Dot", desc: "Dash, dot, dash, dot, flowing" },
  { id: "pulse-glow", label: "Pulse Glow", desc: "Line breathes in opacity" },
  { id: "heartbeat", label: "Heartbeat", desc: "Quick double-pulse thickness" },
  { id: "blink", label: "Blink", desc: "Line flashes on and off" },
  {
    id: "sparkle",
    label: "Sparkle",
    desc: "Dotted line twinkles along the path",
  },
  {
    id: "traveling-dot",
    label: "Traveling Dot",
    desc: "One dot travels the path",
  },
  {
    id: "traveling-dot-multi",
    label: "Multi Dots",
    desc: "Three dots chase each other",
  },
  {
    id: "traveling-arrow",
    label: "Traveling Arrow",
    desc: "Small arrow glides, pointing forward",
  },
  { id: "comet", label: "Comet", desc: "Dot with a fading trail" },
  {
    id: "gradient-flow",
    label: "Gradient Flow",
    desc: "Soft light sweeps along line",
  },
  {
    id: "rainbow-flow",
    label: "Rainbow Flow",
    desc: "Dashes flow while hue cycles",
  },
  {
    id: "bouncing-dot",
    label: "Bouncing Dot",
    desc: "Dot bounces as it travels",
  },
  {
    id: "orbit-dots",
    label: "Orbiting Dots",
    desc: "Little moon circles a bigger dot",
  },
  {
    id: "traveling-arrow-multi",
    label: "Arrow Stream",
    desc: "A line of arrows glides along",
  },
  {
    id: "double-arrow",
    label: "Double Arrow",
    desc: "Arrows glide both ways at once",
  },
  {
    id: "magic-orb",
    label: "Magic Orb",
    desc: "Glowing orb drifts along the path",
  },
  {
    id: "fairy-dust",
    label: "Fairy Dust",
    desc: "Twinkling sparkles trail behind",
  },
  {
    id: "neon-glow",
    label: "Neon Glow",
    desc: "Neon tube glow with a flicker",
  },
  {
    id: "neon-pulse",
    label: "Neon Pulse",
    desc: "Smooth glowing neon heartbeat",
  },
  {
    id: "electric",
    label: "Electric",
    desc: "Jittery lightning-style flicker",
  },
  { id: "fire-flow", label: "Fire Flow", desc: "Flickering flame-like warmth" },
  {
    id: "laser",
    label: "Laser Beam",
    desc: "Glowing dot scans the path, hue shifts",
  },
  {
    id: "confetti",
    label: "Confetti",
    desc: "Colorful bits tumble along the path",
  },
  {
    id: "neural-pulse",
    label: "Neural Pulse",
    desc: "Signal fires along the line",
  },
  {
    id: "data-packet",
    label: "Data Packet",
    desc: "Packets shuttle along, network style",
  },
  {
    id: "binary-stream",
    label: "Binary Stream",
    desc: "Bits flow along the connection",
  },
  {
    id: "electric-fast",
    label: "Electric Fast",
    desc: "Same jitter, quicker cycle",
  },
  {
    id: "electric-arc",
    label: "Electric Arc",
    desc: "Bold arcing flicker with a glow",
  },
  {
    id: "fire-flow-fast",
    label: "Fire Flow Fast",
    desc: "Quicker flame flicker",
  },
  {
    id: "ember-trail",
    label: "Ember Trail",
    desc: "Glowing embers drift and fade",
  },
  {
    id: "signal-ping",
    label: "Signal Ping",
    desc: "Ring pings outward as it travels",
  },
  {
    id: "water-flow",
    label: "Water Flow",
    desc: "Gentle ripple, calm and continuous",
  },
];

export function getEdgeAnimationStyle(styleId, color) {
  switch (styleId) {
    case "dash-flow":
      return {
        strokeDasharray: "8 4",
        style: { animation: "edgeDashFlow 0.7s linear infinite" },
      };
    case "dash-flow-fast":
      return {
        strokeDasharray: "8 4",
        style: { animation: "edgeDashFlow 0.32s linear infinite" },
      };
    case "dash-flow-slow":
      return {
        strokeDasharray: "8 4",
        style: { animation: "edgeDashFlow 1.4s linear infinite" },
      };
    case "dash-flow-reverse":
      return {
        strokeDasharray: "8 4",
        style: { animation: "edgeDashFlowReverse 0.7s linear infinite" },
      };
    case "marching-ants":
      return {
        strokeDasharray: "3 3",
        style: { animation: "edgeDashFlow 0.35s linear infinite" },
      };
    case "conveyor":
      return {
        strokeDasharray: "16 8",
        style: { animation: "edgeDashFlow 0.9s linear infinite" },
      };
    case "dash-dot":
      return {
        strokeDasharray: "6 2 2 2",
        style: { animation: "edgeDashFlow 0.8s linear infinite" },
      };
    case "pulse-glow":
      return {
        style: { animation: "edgePulseGlow 1.4s ease-in-out infinite" },
      };
    case "heartbeat":
      return {
        style: { animation: "edgeHeartbeat 1.1s ease-in-out infinite" },
      };
    case "blink":
      return {
        style: { animation: "edgeBlink 1s ease-in-out infinite" },
      };
    case "sparkle":
      return {
        strokeDasharray: "2 6",
        style: { animation: "edgeSparkle 2.2s ease-in-out infinite" },
      };
    case "gradient-flow":
      return {
        strokeDasharray: "14 10",
        style: { animation: "edgeDashFlow 1s linear infinite" },
        strokeOpacity: 0.9,
      };
    case "rainbow-flow":
      return {
        strokeDasharray: "8 4",
        style: {
          animation:
            "edgeDashFlow 0.7s linear infinite, edgeRainbowHue 3s linear infinite",
        },
      };
    case "neon-glow":
      return {
        strokeOpacity: 1,
        style: {
          animation: "edgeNeonFlicker 1.8s ease-in-out infinite",
          filter: `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`,
        },
      };
    case "neon-pulse":
      return {
        style: {
          animation: "edgeNeonPulse 1.6s ease-in-out infinite",
          filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 10px ${color})`,
        },
      };
    case "electric":
      return {
        strokeDasharray: "5 3 1 3",
        style: {
          animation:
            "edgeDashFlow 0.25s linear infinite, edgeElectric 0.5s steps(6) infinite",
        },
      };
    case "fire-flow":
      return {
        strokeDasharray: "10 4",
        style: {
          animation:
            "edgeDashFlow 0.5s linear infinite, edgeFireFlicker 0.6s ease-in-out infinite",
        },
      };
    case "laser":
      return {
        strokeOpacity: 1,
        style: {
          "--edge-glow": color,
          animation: "edgeLaserGlowSpin 2.2s linear infinite",
        },
      };
    case "electric-fast":
      return {
        strokeDasharray: "5 3 1 3",
        style: {
          animation:
            "edgeDashFlow 0.12s linear infinite, edgeElectric 0.28s steps(6) infinite",
        },
      };
    case "electric-arc":
      return {
        strokeDasharray: "9 2 2 2 4 2",
        style: {
          animation:
            "edgeDashFlow 0.2s linear infinite, edgeElectricArc 0.45s steps(8) infinite",
          filter: `drop-shadow(0 0 3px ${color}) drop-shadow(0 0 8px ${color})`,
        },
      };
    case "fire-flow-fast":
      return {
        strokeDasharray: "10 4",
        style: {
          animation:
            "edgeDashFlow 0.25s linear infinite, edgeFireFlicker 0.35s ease-in-out infinite",
        },
      };
    case "water-flow":
      return {
        strokeDasharray: "12 6",
        strokeOpacity: 0.85,
        style: {
          animation:
            "edgeDashFlow 1.6s linear infinite, edgeWaterRipple 2.4s ease-in-out infinite",
        },
      };

    case "traveling-dot":
    case "traveling-dot-multi":
    case "traveling-arrow":
    case "traveling-arrow-multi":
    case "double-arrow":
    case "comet":
    case "bouncing-dot":
    case "orbit-dots":
    case "magic-orb":
    case "fairy-dust":
    case "confetti":
    case "neural-pulse":
    case "data-packet":
    case "binary-stream":
    case "ember-trail":
    case "signal-ping":
      return {};
    case "none":
    default:
      return {};
  }
}

export function AnimatedDotOverlay({ styleId, pathD, color, size = 4 }) {
  if (!pathD) return null;

  if (styleId === "traveling-dot") {
    return (
      <circle r={size} fill={color}>
        <animateMotion dur="1.6s" repeatCount="indefinite" path={pathD} />
      </circle>
    );
  }

  if (styleId === "traveling-dot-multi") {
    const begins = ["0s", "0.4s", "0.8s"];
    return (
      <>
        {begins.map((b, i) => (
          <circle key={i} r={size * 0.8} fill={color} opacity={0.9 - i * 0.2}>
            <animateMotion
              dur="1.6s"
              repeatCount="indefinite"
              path={pathD}
              begin={b}
            />
          </circle>
        ))}
      </>
    );
  }

  if (styleId === "traveling-arrow") {
    const s = size;
    const arrowPath = `M ${s * 1.5} 0 L ${-s * 0.9} ${s} L ${-s * 0.5} 0 L ${-s * 0.9} ${-s} Z`;
    return (
      <path d={arrowPath} fill={color}>
        <animateMotion
          dur="1.4s"
          repeatCount="indefinite"
          path={pathD}
          rotate="auto"
        />
      </path>
    );
  }

  if (styleId === "comet") {
    const trailCount = 5;
    return (
      <>
        {Array.from({ length: trailCount }).map((_, i) => (
          <circle
            key={i}
            r={size * (1 - i * 0.15)}
            fill={color}
            opacity={1 - i * 0.2}
          >
            <animateMotion
              dur="1.2s"
              repeatCount="indefinite"
              path={pathD}
              begin={`${i * 0.05}s`}
            />
          </circle>
        ))}
      </>
    );
  }

  if (styleId === "bouncing-dot") {
    return (
      <circle r={size} fill={color}>
        <animateMotion dur="1.4s" repeatCount="indefinite" path={pathD} />
        <animate
          attributeName="r"
          values={`${size};${size * 1.7};${size}`}
          dur="0.45s"
          repeatCount="indefinite"
        />
      </circle>
    );
  }

  if (styleId === "orbit-dots") {
    return (
      <g>
        <circle r={size} fill={color}>
          <animateMotion dur="1.8s" repeatCount="indefinite" path={pathD} />
        </circle>
        <g>
          <animateMotion dur="1.8s" repeatCount="indefinite" path={pathD} />
          <circle
            r={size * 0.5}
            fill={color}
            opacity={0.75}
            cx={size * 2}
            cy={0}
          >
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 0 0"
              to="360 0 0"
              dur="0.6s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </g>
    );
  }

  if (styleId === "traveling-arrow-multi") {
    const s = size;
    const arrowPath = `M ${s * 1.5} 0 L ${-s * 0.9} ${s} L ${-s * 0.5} 0 L ${-s * 0.9} ${-s} Z`;
    const begins = ["0s", "0.35s", "0.7s"];
    return (
      <>
        {begins.map((b, i) => (
          <path key={i} d={arrowPath} fill={color} opacity={0.9 - i * 0.25}>
            <animateMotion
              dur="1.4s"
              repeatCount="indefinite"
              path={pathD}
              begin={b}
              rotate="auto"
            />
          </path>
        ))}
      </>
    );
  }

  if (styleId === "double-arrow") {
    const s = size;
    const arrowPath = `M ${s * 1.5} 0 L ${-s * 0.9} ${s} L ${-s * 0.5} 0 L ${-s * 0.9} ${-s} Z`;
    return (
      <>
        <path d={arrowPath} fill={color}>
          <animateMotion
            dur="1.5s"
            repeatCount="indefinite"
            path={pathD}
            rotate="auto"
          />
        </path>
        <path d={arrowPath} fill={color} opacity={0.7}>
          <animateMotion
            dur="1.5s"
            repeatCount="indefinite"
            path={pathD}
            keyPoints="1;0"
            keyTimes="0;1"
            calcMode="linear"
            rotate="auto-reverse"
          />
        </path>
      </>
    );
  }

  if (styleId === "magic-orb") {
    return (
      <g>
        <circle r={size * 2.4} fill={color} opacity={0.12}>
          <animateMotion dur="1.8s" repeatCount="indefinite" path={pathD} />
        </circle>
        <circle r={size * 1.5} fill={color} opacity={0.3}>
          <animateMotion dur="1.8s" repeatCount="indefinite" path={pathD} />
        </circle>
        <circle r={size * 0.8} fill={color}>
          <animateMotion dur="1.8s" repeatCount="indefinite" path={pathD} />
          <animate
            attributeName="opacity"
            values="0.7;1;0.7"
            dur="0.5s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    );
  }

  if (styleId === "fairy-dust") {
    const begins = ["0s", "0.15s", "0.3s", "0.45s", "0.6s"];
    return (
      <>
        {begins.map((b, i) => (
          <circle key={i} r={size * (0.3 + (i % 3) * 0.15)} fill={color}>
            <animateMotion
              dur="2s"
              repeatCount="indefinite"
              path={pathD}
              begin={b}
            />
            <animate
              attributeName="opacity"
              values="0;1;0"
              dur={`${0.5 + (i % 3) * 0.2}s`}
              repeatCount="indefinite"
              begin={b}
            />
          </circle>
        ))}
      </>
    );
  }

  if (styleId === "confetti") {
    const palette = [color, "#FF6B6B", "#4ECDC4", "#FFD93D", "#A78BFA"];
    const begins = ["0s", "0.2s", "0.4s", "0.6s", "0.8s"];
    return (
      <>
        {begins.map((b, i) => (
          <rect
            key={i}
            x={-size * 0.4}
            y={-size * 0.4}
            width={size * 0.8}
            height={size * 0.8}
            fill={palette[i % palette.length]}
          >
            <animateMotion
              dur="1.6s"
              repeatCount="indefinite"
              path={pathD}
              begin={b}
            />
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="0.6s"
              repeatCount="indefinite"
              begin={b}
            />
          </rect>
        ))}
      </>
    );
  }

  if (styleId === "neural-pulse") {
    return (
      <g>
        <circle r={size * 1.8} fill={color} opacity={0.18}>
          <animateMotion dur="1.1s" repeatCount="indefinite" path={pathD} />
          <animate
            attributeName="r"
            values={`${size * 1.2};${size * 2.2};${size * 1.2}`}
            dur="0.55s"
            repeatCount="indefinite"
          />
        </circle>
        <circle r={size * 0.9} fill={color}>
          <animateMotion dur="1.1s" repeatCount="indefinite" path={pathD} />
          <animate
            attributeName="opacity"
            values="0.5;1;0.5"
            dur="0.35s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    );
  }

  if (styleId === "data-packet") {
    const begins = ["0s", "0.5s", "1s"];
    return (
      <>
        {begins.map((b, i) => (
          <rect
            key={i}
            x={-size * 1.4}
            y={-size * 0.7}
            width={size * 2.8}
            height={size * 1.4}
            rx={size * 0.5}
            fill={color}
            opacity={0.9 - i * 0.2}
          >
            <animateMotion
              dur="1.5s"
              repeatCount="indefinite"
              path={pathD}
              begin={b}
              rotate="auto"
            />
          </rect>
        ))}
      </>
    );
  }

  if (styleId === "binary-stream") {
    const begins = ["0s", "0.18s", "0.36s", "0.54s", "0.72s", "0.9s"];
    return (
      <>
        {begins.map((b, i) => (
          <rect
            key={i}
            x={-size * 0.35}
            y={i % 2 === 0 ? -size * 0.9 : -size * 0.35}
            width={size * 0.7}
            height={i % 2 === 0 ? size * 1.8 : size * 0.7}
            fill={color}
            opacity={0.85}
          >
            <animateMotion
              dur="2.4s"
              repeatCount="indefinite"
              path={pathD}
              begin={b}
            />
          </rect>
        ))}
      </>
    );
  }

  if (styleId === "ember-trail") {
    const begins = ["0s", "0.2s", "0.4s", "0.6s", "0.8s"];
    return (
      <>
        {begins.map((b, i) => (
          <circle key={i} r={size * (0.5 + (i % 3) * 0.15)} fill={color}>
            <animateMotion
              dur="1.3s"
              repeatCount="indefinite"
              path={pathD}
              begin={b}
            />
            <animate
              attributeName="opacity"
              values="1;0.6;0"
              dur="0.7s"
              repeatCount="indefinite"
              begin={b}
            />
          </circle>
        ))}
      </>
    );
  }

  if (styleId === "signal-ping") {
    return (
      <g>
        <circle r={size} fill={color}>
          <animateMotion dur="1.6s" repeatCount="indefinite" path={pathD} />
        </circle>
        <circle
          r={size}
          fill="none"
          stroke={color}
          strokeWidth={1.5}
          opacity={0.8}
        >
          <animateMotion dur="1.6s" repeatCount="indefinite" path={pathD} />
          <animate
            attributeName="r"
            values={`${size};${size * 3.2}`}
            dur="0.9s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.8;0"
            dur="0.9s"
            repeatCount="indefinite"
          />
        </circle>
      </g>
    );
  }

  if (styleId === "laser") {
    return (
      <g
        style={{
          "--edge-glow": color,
          animation: "edgeLaserDotHue 2.2s linear infinite",
        }}
      >
        <circle r={size * 2} fill={color} opacity={0.15}>
          <animateMotion dur="0.8s" repeatCount="indefinite" path={pathD} />
        </circle>
        <circle r={size * 1.1} fill={color} opacity={0.5}>
          <animateMotion dur="0.8s" repeatCount="indefinite" path={pathD} />
        </circle>
        <circle r={size * 0.55} fill="#ffffff">
          <animateMotion dur="0.8s" repeatCount="indefinite" path={pathD} />
        </circle>
      </g>
    );
  }

  return null;
}

export function EdgeAnimationPicker({ value, onChange, T }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {EDGE_ANIMATION_STYLES.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              width: "100%",
              padding: "7px 10px",
              borderRadius: 6,
              border: `1px solid ${active ? T.accent : T.border}`,
              background: active ? T.accent + "18" : T.surface,
              color: active ? T.text : T.muted,
              cursor: "pointer",
              textAlign: "left",
              fontSize: 12,
            }}
          >
            <span style={{ fontWeight: active ? 600 : 400 }}>{s.label}</span>
            <span style={{ fontSize: 10, opacity: 0.65 }}>{s.desc}</span>
          </button>
        );
      })}
    </div>
  );
}

export function EdgeAnimationKeyframes() {
  return (
    <style>{`
      @keyframes edgeDashFlow { to { stroke-dashoffset: -24; } }
      @keyframes edgeDashFlowReverse { to { stroke-dashoffset: 24; } }
      @keyframes edgePulseGlow {
        0%, 100% { opacity: 0.35; }
        50% { opacity: 1; }
      }
      @keyframes edgeHeartbeat {
        0%, 100% { stroke-width: 1.4; opacity: 0.6; }
        20% { stroke-width: 3; opacity: 1; }
        35% { stroke-width: 1.6; opacity: 0.7; }
        50% { stroke-width: 2.6; opacity: 1; }
        70% { stroke-width: 1.4; opacity: 0.6; }
      }
      @keyframes edgeBlink {
        0%, 45% { opacity: 1; }
        50%, 95% { opacity: 0.15; }
        100% { opacity: 1; }
      }
      @keyframes edgeSparkle {
        0%, 100% { opacity: 0.5; filter: brightness(1); }
        15% { opacity: 1; filter: brightness(1.7); }
        22% { opacity: 0.5; filter: brightness(1); }
        48% { opacity: 1; filter: brightness(1.7); }
        55% { opacity: 0.5; filter: brightness(1); }
        80% { opacity: 1; filter: brightness(1.7); }
        87% { opacity: 0.5; filter: brightness(1); }
      }
      @keyframes edgeRainbowHue {
        0% { filter: hue-rotate(0deg) saturate(1.6); }
        100% { filter: hue-rotate(360deg) saturate(1.6); }
      }
      @keyframes edgeNeonFlicker {
        0%, 19%, 21%, 23%, 80%, 100% { opacity: 1; }
        20%, 22%, 81% { opacity: 0.4; }
      }
      @keyframes edgeNeonPulse {
        0%, 100% { opacity: 0.6; }
        50% { opacity: 1; }
      }
      @keyframes edgeElectric {
        0%, 100% { opacity: 1; }
        10% { opacity: 0.55; }
        20% { opacity: 1; }
        35% { opacity: 0.5; }
        45% { opacity: 1; }
        60% { opacity: 0.65; }
        75% { opacity: 1; }
        85% { opacity: 0.55; }
      }
      @keyframes edgeFireFlicker {
        0%, 100% { opacity: 0.85; stroke-width: 2; }
        30% { opacity: 1; stroke-width: 2.6; }
        55% { opacity: 0.7; stroke-width: 1.8; }
        80% { opacity: 1; stroke-width: 2.4; }
      }
      @keyframes edgeLaserGlowSpin {
        0% { filter: drop-shadow(0 0 4px var(--edge-glow, #ff0080)) drop-shadow(0 0 12px var(--edge-glow, #ff0080)) hue-rotate(0deg); }
        100% { filter: drop-shadow(0 0 4px var(--edge-glow, #ff0080)) drop-shadow(0 0 12px var(--edge-glow, #ff0080)) hue-rotate(360deg); }
      }
      @keyframes edgeLaserDotHue {
        0% { filter: hue-rotate(0deg); }
        100% { filter: hue-rotate(360deg); }
      }
    `}</style>
  );
}
