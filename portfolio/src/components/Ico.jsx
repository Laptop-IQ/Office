import React from "react";
import {
  RiAddCircleLine, RiAddLine, RiAlertLine, RiBarChart2Line, RiBox3Line, RiBuilding2Line,
  RiBuilding4Line, RiCalculatorLine, RiCalendarLine, RiCheckLine, RiCheckboxCircleLine,
  RiClipboardLine, RiCloseCircleLine, RiCloseLine, RiDeleteBinLine, RiDownload2Line,
  RiDropLine, RiEditLine, RiExchangeLine, RiEyeLine, RiFlaskLine, RiFolderOpenLine,
  RiGroupLine, RiHandHeartLine, RiHourglassLine, RiInboxArchiveLine, RiLayoutGridLine,
  RiLineChartLine, RiListUnordered, RiMapPin2Line, RiMoneyRupeeCircleLine, RiPaletteLine,
  RiPrinterLine, RiReceiptLine, RiRefreshLine, RiSave3Line, RiSearchLine, RiSendPlaneLine,
  RiSettings3Line, RiShoppingCartLine, RiStore2Line, RiThumbUpLine, RiTimeLine,
  RiTrophyLine, RiTruckLine, RiUpload2Line, RiWifiOffLine, RiForbidLine,
} from "react-icons/ri";

// emoji / symbol  ->  Remix icon
export const ICONS = {
  "📦": RiBox3Line, "📤": RiSendPlaneLine, "⬇": RiDownload2Line, "📥": RiInboxArchiveLine,
  "🖨": RiPrinterLine, "✏": RiEditLine, "📂": RiFolderOpenLine, "💰": RiMoneyRupeeCircleLine,
  "🏭": RiBuilding2Line, "🏢": RiBuilding2Line, "🏙": RiBuilding4Line, "🏬": RiStore2Line,
  "🕘": RiTimeLine, "◷": RiTimeLine, "🧪": RiFlaskLine, "⚗": RiFlaskLine,
  "✅": RiCheckboxCircleLine, "✓": RiCheckLine, "✕": RiCloseLine, "✗": RiCloseLine,
  "❌": RiCloseCircleLine, "⚠": RiAlertLine, "⏳": RiHourglassLine, "🧾": RiReceiptLine,
  "📍": RiMapPin2Line, "🗑": RiDeleteBinLine, "⬆": RiUpload2Line, "▦": RiLayoutGridLine,
  "☰": RiListUnordered, "📊": RiBarChart2Line, "↻": RiRefreshLine, "🔄": RiRefreshLine,
  "⚙": RiSettings3Line, "🔎": RiSearchLine, "🔍": RiSearchLine, "⌕": RiSearchLine,
  "🚫": RiForbidLine, "👋": RiHandHeartLine, "👌": RiThumbUpLine, "📋": RiClipboardLine,
  "✦": RiAddCircleLine, "💾": RiSave3Line, "🎨": RiPaletteLine, "📡": RiWifiOffLine,
  "🚚": RiTruckLine, "🛢": RiDropLine, "👥": RiGroupLine, "📅": RiCalendarLine,
  "📈": RiLineChartLine, "🏆": RiTrophyLine, "🧮": RiCalculatorLine, "👁": RiEyeLine,
  "🛒": RiShoppingCartLine, "⇄": RiExchangeLine, "＋": RiAddLine,
};

const norm = (s) => (typeof s === "string" ? s.replace(/[\uFE0E\uFE0F]/g, "").trim() : s);

/** <Ico e="📦" /> – renders the matching Remix icon, or the text itself if unknown. */
export function Ico({ e, size = "1em", className, style }) {
  const C = ICONS[norm(e)];
  if (!C) return <>{e}</>;
  return (
    <C
      aria-hidden="true"
      size={size}
      className={className}
      style={{ verticalAlign: "-0.15em", flexShrink: 0, ...style }}
    />
  );
}

export default Ico;
