// features/keyCustomers/components/styles.js — shared Tailwind class strings for the feature
const goldBase = "inline-flex items-center gap-1.5 px-3.5 text-[12px] font-semibold rounded-lg border border-solid";
const goldTone = "bg-[rgba(212,175,106,0.10)] text-ds-primary border-[rgba(212,175,106,0.25)]";

/** gold "primary-ish" button (34px) */
export const goldButton = `${goldBase} h-[34px] ${goldTone} cursor-pointer`;
/** same look without colours/height, for buttons that set their own */
export const goldButtonBase = goldBase;
export const goldButtonTone = goldTone;
