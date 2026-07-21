/* eslint-disable react/react-in-jsx-scope */

export default function Icon({ name, size = 14 }) {
  const icons = {
    cursor: (
      <path d="M4 2l12 7-5 1.5-3 4.5V2z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    ),
    hand: (
      <>
        <path d="M8 12V6m-2 2V5m4 7V5m2 7V7m2 5V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M4 14s0 4 6 4 6-4 6-4V9" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </>
    ),
    link: (
      <path d="M10 13H7a4 4 0 010-8h3M14 11h3a4 4 0 000-8h-3M8 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    ),
    plus: (
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    ),
    trash: (
      <path d="M6 7h12M9 7V5h6v2M10 11v5M14 11v5M7 7l1 11h8l1-11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    undo: (
      <>
        <path d="M4 8h9a5 5 0 010 10H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M4 8l3-3-3 3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    redo: (
      <>
        <path d="M20 8h-9a5 5 0 000 10h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M20 8l-3-3 3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M20 20l-4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    magic: (
      <path d="M12 2L9 9l-7 3 7 3 3 7 3-7 7-3-7-3-3-7z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    ),
    eye: (
      <>
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </>
    ),
    copy: (
      <>
        <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </>
    ),
    note: (
      <>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </>
    ),
    collapse: (
      <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h3M16 3h3a2 2 0 012 2v14a2 2 0 01-2 2h-3M12 8v8M9 12l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    ),
    chevronR: (
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    chevronL: (
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    zoomin: (
      <>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M20 20l-4-4M11 8v6M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    zoomout: (
      <>
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M20 20l-4-4M8 11h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    fit: (
      <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    pin: (
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
    ),
    save: (
      <>
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <polyline points="17 21 17 13 7 13 7 21" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <polyline points="7 3 7 8 15 8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </>
    ),
    cloud: (
      <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" stroke="currentColor" strokeWidth="1.5" fill="none" />
    ),
    tag: (
      <>
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <line x1="7" y1="7" x2="7.01" y2="7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </>
    ),
    image: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="15" y="3" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="3" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="15" y="15" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </>
    ),
    down: (
      <path d="M12 4v14M6 13l6 6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    up: (
      <path d="M12 20V6M6 11l6-6 6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    ),
    page: (
      <>
        <rect x="4" y="2" width="16" height="20" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M8 7h8M8 11h8M8 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    x: (
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    ),
    pencil: (
      <>
        <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </>
    ),
    group: (
      <>
        <rect x="3" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="13" y="3" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <rect x="3" y="13" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M17 13v-2m0-2V7M7 17h2m2 0h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    history: (
      <>
        <path d="M1 4v6h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M3.51 15a9 9 0 102.13-9.36L1 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M12 7v5l4 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </>
    ),
    palette: (
      <>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="9" cy="9" r="1.5" fill="currentColor" />
        <circle cx="15" cy="9" r="1.5" fill="currentColor" />
        <circle cx="9" cy="15" r="1.5" fill="currentColor" />
        <circle cx="15" cy="15" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="2" fill="currentColor" />
      </>
    ),
    export: (
      <>
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <polyline points="7 10 12 15 17 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    connect: (
      <>
        <circle cx="6" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="18" cy="6" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <circle cx="18" cy="18" r="3" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M9 12h2m2 0h2M16 7.5l-2 3M16 16.5l-2-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    ungroup: (
      <>
        <path d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeDasharray="4 2" />
        <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </>
    ),
    theme: (
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    ),
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: "block", flexShrink: 0 }}>
      {icons[name] || null}
    </svg>
  );
}
