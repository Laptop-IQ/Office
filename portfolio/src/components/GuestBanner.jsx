// components/GuestBanner.jsx
// Small floating notice while the guest demo is active.
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function GuestBanner() {
  const { isGuest, logout } = useAuth();
  const [leaving, setLeaving] = useState(false);
  if (!isGuest) return null;

  const exit = async () => {
    if (leaving) return;
    setLeaving(true);
    await logout(); // clears the demo data and returns to the login page
  };

  return (
    <div className="guest-pill" role="status">
      <span>
        <b>Guest demo</b> · changes are temporary and reset when you log out
      </span>
      <button type="button" onClick={exit} disabled={leaving}>
        {leaving ? "Clearing…" : "Exit demo"}
      </button>
    </div>
  );
}
