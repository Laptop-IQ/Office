import React from "react";
import { Activity, ArrowRight, IndianRupee, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";

/* =========================================================
   CSS
========================================================= */

const CSS = `
.hq,
.hq * {
  box-sizing: border-box;
}

.hq {
  --bg: #05070d;
  --text: #f8fafc;

  min-height: 100vh;
  width: 100%;
  position: relative;
  overflow: hidden;
  color: var(--text);
  background:
    radial-gradient(
      circle at 50% -20%,
      rgba(99, 102, 241, 0.14),
      transparent 38%
    ),
    var(--bg);

  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
}

.hq button {
  font: inherit;
}

.hq button:focus-visible {
  outline: 2px solid #818cf8;
  outline-offset: 3px;
}

/* =========================================================
   BACKGROUND
========================================================= */

.hq-grid {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.45;

  background-image:
    linear-gradient(
      rgba(255, 255, 255, 0.018) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.018) 1px,
      transparent 1px
    );

  background-size: 48px 48px;

  mask-image: linear-gradient(
    to bottom,
    black,
    transparent 90%
  );

  -webkit-mask-image: linear-gradient(
    to bottom,
    black,
    transparent 90%
  );
}

/* =========================================================
   CONTAINER
========================================================= */

.hq-container {
  position: relative;
  z-index: 2;
  width: min(1240px, calc(100% - 40px));
  min-height: 100vh;
  margin: 0 auto;
}

/* =========================================================
   HERO
========================================================= */

.hq-hero {
  min-height: 100vh;

  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(280px, 0.75fr);
  align-items: center;

  gap: 70px;

  padding: 70px 0;
}

/* =========================================================
   LEFT CONTENT
========================================================= */

.hq-hero-content {
  min-width: 0;
}

.hq-title {
  max-width: 760px;
  margin: 0;

  font-family:
    "Plus Jakarta Sans",
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;

  font-size: clamp(48px, 7vw, 82px);
  line-height: 0.98;
  letter-spacing: -0.065em;
  font-weight: 800;
}

.hq-gradient {
  display: inline-block;

  background: linear-gradient(
    100deg,
    #818cf8 0%,
    #22d3ee 48%,
    #c084fc 100%
  );

  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.hq-description {
  max-width: 590px;
  margin: 28px 0 0;

  color: #718096;
  font-size: 14px;
  line-height: 1.85;
}

/* =========================================================
   RIGHT ACTIONS
========================================================= */

.hq-side {
  width: 100%;
  display: flex;
  justify-content: center;
}

.hq-actions {
  width: 100%;
  max-width: 330px;

  display: flex;
  flex-direction: column;
  gap: 12px;
}

.hq-primary,
.hq-secondary {
  width: 100%;
  min-height: 50px;

  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 9px;

  padding: 0 18px;

  border-radius: 12px;

  cursor: pointer;

  transition:
    transform 0.18s ease,
    background 0.18s ease,
    border-color 0.18s ease,
    box-shadow 0.18s ease;
}

.hq-primary {
  border: 1px solid rgba(129, 140, 248, 0.3);

  color: #ffffff;
  background: #4f46e5;

  box-shadow:
    0 10px 30px rgba(79, 70, 229, 0.22);

  font-size: 12px;
  font-weight: 750;
}

.hq-primary:hover {
  transform: translateY(-2px);
  background: #5b55ed;

  box-shadow:
    0 14px 35px rgba(79, 70, 229, 0.3);
}

.hq-secondary {
  border: 1px solid rgba(255, 255, 255, 0.07);

  color: #cbd5e1;
  background: rgba(255, 255, 255, 0.035);

  font-size: 12px;
  font-weight: 650;
}

.hq-secondary:hover {
  transform: translateY(-2px);

  border-color: rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.065);
}

/* =========================================================
   MOBILE
========================================================= */

@media (max-width: 900px) {
  .hq-hero {
    grid-template-columns: 1fr;
    gap: 40px;

    min-height: auto;
    padding: 100px 0 70px;
  }

  .hq-side {
    justify-content: flex-start;
  }

  .hq-actions {
    max-width: 360px;
  }
}

@media (max-width: 600px) {
  .hq-container {
    width: calc(100% - 28px);
  }

  .hq-hero {
    padding: 70px 0 50px;
    gap: 35px;
  }

  .hq-title {
    font-size: clamp(44px, 13vw, 64px);
    letter-spacing: -0.055em;
  }

  .hq-description {
    margin-top: 22px;
    font-size: 13px;
    line-height: 1.75;
  }

  .hq-actions {
    max-width: none;
  }

  .hq-primary,
  .hq-secondary {
    min-height: 48px;
  }
}

@media (max-width: 380px) {
  .hq-container {
    width: calc(100% - 22px);
  }

  .hq-title {
    font-size: 42px;
  }
}

/* =========================================================
   REDUCED MOTION
========================================================= */

@media (prefers-reduced-motion: reduce) {
  .hq * {
    transition: none !important;
  }
}
`;

/* =========================================================
   MAIN
========================================================= */

export default function HeroSection() {
  const navigate = useNavigate();

  return (
    <>
      <style>{CSS}</style>

      <main className="hq">
        <div className="hq-grid" />

        <div className="hq-container">
          <section className="hq-hero">
            {/* LEFT */}
            <div className="hq-hero-content">
              <h1 className="hq-title">
                Your office.
                <br />
                <span className="hq-gradient">One command</span>
                <br />
                center.
              </h1>

              <p className="hq-description">
                Billing, sales, CRM and inventory — connected in one focused
                workspace. See what needs attention, act faster, and keep your
                entire operation moving.
              </p>
            </div>

            {/* RIGHT */}
            <div className="hq-side">
              <div className="hq-actions">
                <button
                  type="button"
                  className="hq-primary"
                  onClick={() => navigate("/DailySalesReport")}
                >
                  <Activity size={15} />
                  <span>Open Sales Report</span>
                  <ArrowRight size={15} />
                </button>

                <button
                  type="button"
                  className="hq-secondary"
                  onClick={() => navigate("/Stockmanager")}
                >
                  <Package size={15} />
                  <span>View Stock</span>
                </button>
                <button
                  type="button"
                  className="hq-secondary"
                  onClick={() => navigate("/OverduesDashboard")}
                >
                  <IndianRupee size={15} />
                  <span>Overdue Payment</span>
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
