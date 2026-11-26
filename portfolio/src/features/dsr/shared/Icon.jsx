// features/dsr/shared/Icon.jsx
// Inline SVG icon set used across the DSR screens.

export const Icon = ({ name, size = 16, strokeWidth = 1.8, style, className }) => {
  const c = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style, // only for genuinely dynamic values
    className: className ? `block shrink-0 ${className}` : "block shrink-0",
  };
  switch (name) {
    case "records":
      return (
        <svg {...c}>
          <rect x="5" y="4" width="14" height="17" rx="2" />
          <rect x="9" y="2.2" width="6" height="3.4" rx="1" />
          <line x1="8" y1="11.5" x2="16" y2="11.5" />
          <line x1="8" y1="15.5" x2="13.5" y2="15.5" />
        </svg>
      );
    case "addRecord":
      return (
        <svg {...c}>
          <circle cx="12" cy="12" r="9" />
          <line x1="12" y1="8" x2="12" y2="16" />
          <line x1="8" y1="12" x2="16" y2="12" />
        </svg>
      );
    case "store":
      return (
        <svg {...c}>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M5.5 10.5v9h13v-9" />
          <path d="M9.5 19.5v-5.5h5v5.5" />
        </svg>
      );
    case "star":
      return (
        <svg {...c}>
          <polygon points="12,3.2 14.9,9 21.2,9.9 16.6,14.4 17.7,20.7 12,17.7 6.3,20.7 7.4,14.4 2.8,9.9 9.1,9" />
        </svg>
      );
    case "trending":
      return (
        <svg {...c}>
          <polyline points="4,16 9.5,10.5 13.5,14.5 20,8" />
          <polyline points="14.5,8 20,8 20,13.5" />
        </svg>
      );
    case "home":
      return (
        <svg {...c}>
          <path d="M4 11.5 12 4.5l8 7" />
          <path d="M6 10v9.5h12V10" />
        </svg>
      );
    case "search":
      return (
        <svg {...c}>
          <circle cx="11" cy="11" r="6.5" />
          <line x1="15.8" y1="15.8" x2="20.5" y2="20.5" />
        </svg>
      );
    case "trash":
      return (
        <svg {...c}>
          <line x1="5" y1="7" x2="19" y2="7" />
          <path d="M9.5 7V4.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
          <path d="M7.5 7l1 12.3a1 1 0 0 0 1 .9h5a1 1 0 0 0 1-.9L16.5 7" />
        </svg>
      );
    case "edit":
      return (
        <svg {...c}>
          <path d="M14 5.5 18.5 10 8 20.5 3.5 21.5 4.5 17Z" />
          <line x1="12.3" y1="7.2" x2="16.8" y2="11.7" />
        </svg>
      );
    case "check":
      return (
        <svg {...c}>
          <polyline points="4,12.5 9,17.5 20,6" />
        </svg>
      );
    case "close":
      return (
        <svg {...c}>
          <line x1="6" y1="6" x2="18" y2="18" />
          <line x1="18" y1="6" x2="6" y2="18" />
        </svg>
      );
    case "wallet":
      return (
        <svg {...c}>
          <rect x="3" y="6.5" width="18" height="12.5" rx="2" />
          <path d="M3 10.5h18" />
          <circle
            cx="16.5"
            cy="14.5"
            r="1.1"
            fill="currentColor"
            stroke="none"
          />
        </svg>
      );
    case "calendar":
      return (
        <svg {...c}>
          <rect x="4" y="5" width="16" height="15.5" rx="2" />
          <line x1="4" y1="9.5" x2="20" y2="9.5" />
          <line x1="8" y1="3" x2="8" y2="6.5" />
          <line x1="16" y1="3" x2="16" y2="6.5" />
        </svg>
      );
    case "clock":
      return (
        <svg {...c}>
          <circle cx="12" cy="12" r="8.5" />
          <polyline points="12,7.5 12,12.3 15.3,14.3" />
        </svg>
      );
    case "download":
      return (
        <svg {...c}>
          <path d="M12 4v11.5" />
          <polyline points="7,11.5 12,16.5 17,11.5" />
          <line x1="5" y1="20" x2="19" y2="20" />
        </svg>
      );
    case "chevronDown":
      return (
        <svg {...c}>
          <polyline points="6,9 12,15.5 18,9" />
        </svg>
      );
    case "chevronUp":
      return (
        <svg {...c}>
          <polyline points="6,15.5 12,9 18,15.5" />
        </svg>
      );
    case "alert":
      return (
        <svg {...c}>
          <path d="M12 3 22 20H2Z" />
          <line x1="12" y1="10" x2="12" y2="15" />
          <circle cx="12" cy="17.7" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case "sparkle":
      return (
        <svg {...c} stroke="none" fill="currentColor">
          <path d="M12 2 13.8 9.2 21 11 13.8 12.8 12 20 10.2 12.8 3 11 10.2 9.2Z" />
        </svg>
      );
    case "pin":
      return (
        <svg {...c}>
          <circle cx="12" cy="10" r="4.2" />
          <path d="M8.3 13 12 21l3.7-8" />
        </svg>
      );
    case "inbox":
      return (
        <svg {...c}>
          <path d="M4 12.5h4.2l1.8 2.7h4l1.8-2.7H20" />
          <path d="M5 6.5h14L20.3 12.5v5.5a1 1 0 0 1-1 1H4.7a1 1 0 0 1-1-1v-5.5Z" />
        </svg>
      );
    case "sheet":
      return (
        <svg {...c}>
          <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <line x1="9" y1="13.5" x2="15" y2="19" />
          <line x1="15" y1="13.5" x2="9" y2="19" />
        </svg>
      );
    case "back":
      return (
        <svg {...c}>
          <line x1="19" y1="12" x2="5.5" y2="12" />
          <polyline points="11,6.5 5.5,12 11,17.5" />
        </svg>
      );
    case "upload":
      return (
        <svg {...c}>
          <path d="M12 16.5V5" />
          <polyline points="7.5,9.5 12,5 16.5,9.5" />
          <path d="M5 16.5v3a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3" />
        </svg>
      );
    case "arrowUp":
      return (
        <svg {...c}>
          <line x1="12" y1="19" x2="12" y2="6" />
          <polyline points="6.5,11.5 12,6 17.5,11.5" />
        </svg>
      );
    case "refresh":
      return (
        <svg {...c}>
          <path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" />
          <polyline points="18,3.5 18,7 14.5,7" />
          <polyline points="6,20.5 6,17 9.5,17" />
        </svg>
      );
    case "users":
      return (
        <svg {...c}>
          <circle cx="9.5" cy="8.5" r="3" />
          <path d="M3.5 19v-1.5a4 4 0 014-4h4a4 4 0 014 4V19" />
          <circle cx="17" cy="7.5" r="2.4" />
          <path d="M20.5 19v-1.5a3.6 3.6 0 00-2.4-3.4" />
        </svg>
      );
    case "lightbulb":
      return (
        <svg {...c}>
          <path d="M9 18h6" />
          <path d="M10 21h4" />
          <path d="M12 3a6 6 0 00-3.5 10.9c.6.4 1 1.2 1 2.1h5c0-.9.4-1.7 1-2.1A6 6 0 0012 3z" />
        </svg>
      );
    case "phone":
      return (
        <svg {...c}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z" />
        </svg>
      );
    case "whatsapp":
      return (
        <svg {...c}>
          <path d="M20 11.5a8 8 0 01-11.8 7L4 20l1.6-4.1A8 8 0 1120 11.5z" />
          <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-.8.8a3.5 3.5 0 01-1.5-1.5l.8-.8-1-2L9 9.5z" />
        </svg>
      );
    case "mail":
      return (
        <svg {...c}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3.5 6.5l8.5 6.5 8.5-6.5" />
        </svg>
      );
    case "user":
      return (
        <svg {...c}>
          <circle cx="12" cy="8" r="3.6" />
          <path d="M5 20v-1a5 5 0 015-5h4a5 5 0 015 5v1" />
        </svg>
      );
    case "copy":
      return (
        <svg {...c}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15V6a2 2 0 012-2h9" />
        </svg>
      );
    default:
      return null;
  }
};
