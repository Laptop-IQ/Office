// features/dsr/shared/stages.js
// Customer project stages (A → H) and their colours.
import { DS } from "./tokens";

export const PROJECT_STAGE_OPTIONS = [
  "A. Promotion Complete",
  "B. Lab Trials Complete",
  "C. P R Enhanced",
  "D. Bulk Trials Complete",
  "E. Trial Report to Customer with Highlights in body of mail",
  "F. Commercials Conveyed to Technical DMU",
  "G. Proposal & Final Meet",
  "H. Products Regularized",
];

export const STAGE_COLOR = {
  A: {
    bg: "var(--st-A-bg)",
    text: "var(--st-A-text)",
    border: "var(--ds-primary)",
  },
  B: {
    bg: "var(--st-B-bg)",
    text: "var(--st-B-text)",
    border: "var(--ds-primary)",
  },
  C: {
    bg: "var(--st-C-bg)",
    text: "var(--st-C-text)",
    border: "var(--ds-primary)",
  },
  D: {
    bg: "var(--st-D-bg)",
    text: "var(--st-D-text)",
    border: "var(--ds-primary)",
  },
  E: {
    bg: "var(--st-E-bg)",
    text: "var(--st-E-text)",
    border: "var(--ds-primary)",
  },
  F: {
    bg: "var(--st-F-bg)",
    text: "var(--st-F-text)",
    border: "var(--ds-primary)",
  },
  G: {
    bg: "var(--st-G-bg)",
    text: "var(--st-G-text)",
    border: "var(--ds-primary)",
  },
  H: {
    bg: "var(--st-H-bg)",
    text: "var(--st-H-text)",
    border: "var(--ds-success)",
  },
};

export const stageColor = (stage) => {
  if (!stage) return { bg: DS.surface, text: DS.text3, border: DS.border };
  const letter = stage.trim()[0]?.toUpperCase();
  return (
    STAGE_COLOR[letter] || { bg: DS.surface, text: DS.text3, border: DS.border }
  );
};

export const STAGE_LETTERS = PROJECT_STAGE_OPTIONS.map((s) => s[0]);
