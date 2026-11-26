// features/keyCustomers/components/KeyListControls.jsx
// Toolbar of the key view: filter chips · Download · sort · Add customers, then the search box.
import { Icon } from "../../dsr/shared";
import { KEY_FILTERS, KEY_SORTS } from "../constants";
import { goldButton } from "./styles";

const SEARCH_MIN_ROWS = 7; // the search box only appears for longer lists

/**
 * @param {object} props
 * @param {number} props.total          key customers overall
 * @param {number} props.shown          rows after filters
 * @param {{all:number, due:number, month:number}} props.counts
 * @param {string} props.sort
 * @param {string} props.chip
 * @param {string} props.query
 * @param {boolean} props.adding        add panel open
 */
export function KeyListControls({
  total,
  shown,
  counts,
  sort,
  chip,
  query,
  adding,
  onSort,
  onChip,
  onQuery,
  onDownload,
  onToggleAdd,
}) {
  const filtered = query.trim() !== "";
  return (
    <>
      <div className="flex items-center justify-between gap-2.5 flex-wrap mb-3">
        <div role="group" aria-label="Filter key customers" className="flex gap-2 flex-wrap">
          {KEY_FILTERS.map((f) => (
            <button
              key={f.id}
              className={`dsr-filter-chip${chip === f.id ? " active" : ""}`}
              aria-pressed={chip === f.id}
              onClick={() => onChip(f.id)}
            >
              {f.label} <span className="cnt">{counts[f.id]}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="dsr-ghost-btn h-[30px] text-[12px]"
            disabled={shown === 0}
            title="Download key customers in Excel"
            onClick={onDownload}
          >
            <Icon name="download" size={13} strokeWidth={2.1} /> Download
            {filtered ? ` (${shown})` : ""}
          </button>
          <div className="kc-seg" role="group" aria-label="Sort key customers">
            {KEY_SORTS.map((s) => (
              <button key={s.id} className={sort === s.id ? "on" : ""} onClick={() => onSort(s.id)}>
                {s.label}
              </button>
            ))}
          </div>
          <button className={goldButton} onClick={onToggleAdd} aria-expanded={adding}>
            <Icon name={adding ? "close" : "addRecord"} size={13} strokeWidth={2} />
            {adding ? "Close" : "Add customers"}
          </button>
        </div>
      </div>

      {total >= SEARCH_MIN_ROWS && (
        <div className="relative mb-3">
          <Icon name="search" size={14} className="absolute top-3 left-3 text-ds-text3" />
          <input
            className="dsr-input dsr-field h-10 pl-8.5"
            placeholder="Search key customers…"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
          />
        </div>
      )}
    </>
  );
}
