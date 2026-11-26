// features/dsr/shared/StageLadder.jsx
import { DS } from "./tokens";
import { STAGE_LETTERS, stageColor } from "./stages";

// SIGNATURE: Stage Ladder with urgency glow on filled segments
export const StageLadder = ({ stage, size = "md" }) => {
  const letter = stage ? stage.trim()[0]?.toUpperCase() : null;
  const idx = letter ? STAGE_LETTERS.indexOf(letter) : -1;
  const sc = stageColor(stage);
  const segW = size === "sm" ? 6 : 9;
  return (
    <div
      className="inline-flex items-center gap-[7px] min-w-0"
      title={stage || "No stage set"}
    >
      <div
        className={`flex shrink-0 ${size === "sm" ? "gap-0.5" : "gap-[3px]"}`}
      >
        {STAGE_LETTERS.map((l, i) => (
          <div
            key={l}
            className="dsr-ladder-seg rounded-xs"
            style={{ width: segW, height: segW, background: i <= idx ? sc.border : DS.border, boxShadow:
                i <= idx
                  ? `0 0 7px color-mix(in srgb, ${sc.border} 73.3%, transparent), 0 0 2px ${sc.border}`
                  : "none" }}
          />
        ))}
      </div>
      <span
        style={{ color: sc.text }}
        className={`dsr-mono shrink-0 font-semibold ${size === "sm" ? "text-[9px]" : "text-[10px]"}`}
      >
        {letter ? `${letter}/${STAGE_LETTERS.length}` : "—"}
      </span>
    </div>
  );
};
