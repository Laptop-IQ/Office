/**
 * QRGenerator.jsx
 *
 * A polished, fully-featured QR code generator.
 * Supports URL · Text · Email · Phone · WiFi
 *
 * Requirements:
 *   npm install react react-dom
 *   npm install -D tailwindcss @tailwindcss/vite (or postcss setup)
 *
 * Add to your global CSS (index.css / globals.css):
 *   @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@400;500;600;700&display=swap');
 *
 * Usage:
 *   import QRGenerator from './QRGenerator';
 *   export default function App() { return <QRGenerator />; }
 */

import { useState, useEffect, useRef, useCallback } from 'react';

/* ─── Design tokens ──────────────────────────────────────────────── */
const ACC   = '#00C896';
const ACC_D = '#009B74';
const ACC_L = '#ECFDF7';
const MONO  = '"DM Mono", monospace';
const SANS  = '"DM Sans", system-ui, sans-serif';

/* ─── QR content types ───────────────────────────────────────────── */
const QR_TYPES = [
  { id: 'URL',   icon: 'ti-link'      },
  { id: 'Text',  icon: 'ti-text-size' },
  { id: 'Email', icon: 'ti-mail'      },
  { id: 'Phone', icon: 'ti-phone'     },
  { id: 'WiFi',  icon: 'ti-wifi'      },
];

/* ─── Color presets ──────────────────────────────────────────────── */
const PRESETS = [
  { name: 'Classic', fg: '#000000', bg: '#FFFFFF' },
  { name: 'Night',   fg: '#FFFFFF', bg: '#0F0F1A' },
  { name: 'Mint',    fg: '#065F46', bg: '#ECFDF5' },
  { name: 'Ocean',   fg: '#1E3A8A', bg: '#EFF6FF' },
  { name: 'Amber',   fg: '#78350F', bg: '#FFFBEB' },
  { name: 'Rose',    fg: '#9F1239', bg: '#FFF1F2' },
  { name: 'Violet',  fg: '#4C1D95', bg: '#F5F3FF' },
  { name: 'Slate',   fg: '#0F172A', bg: '#F8FAFC' },
];

/* ─── Error correction levels ────────────────────────────────────── */
const ECC_LEVELS = {
  L: { label: 'Low',    hint: '7% recovery'  },
  M: { label: 'Medium', hint: '15% recovery' },
  Q: { label: 'High',   hint: '25% recovery' },
  H: { label: 'Max',    hint: '30% recovery' },
};

/* ─── Global CSS (injected once on mount) ────────────────────────── */
const INJECTED_CSS = `
  /* Signature: grid zone that dissolves when QR is live */
  .qr-zone {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 320px;
    padding: 32px;
    background-color: #F3F3F0;
    background-image:
      linear-gradient(#E8E8E4 1px, transparent 1px),
      linear-gradient(90deg, #E8E8E4 1px, transparent 1px);
    background-size: 22px 22px;
    transition: background-image 0.5s, background-color 0.4s;
  }
  .qr-zone.live {
    background-image: none;
    background-color: #F8F8F6;
  }

  /* Viewfinder corners */
  .vf,  .vf2  { position: relative; display: inline-block; }
  .vf::before, .vf::after,
  .vf2::before, .vf2::after {
    content: '';
    position: absolute;
    width: 18px;
    height: 18px;
  }
  .vf::before  { top: -3px; left: -3px;   border-top:    2.5px solid ${ACC}; border-left:   2.5px solid ${ACC}; border-radius: 2px 0 0 0; }
  .vf::after   { top: -3px; right: -3px;  border-top:    2.5px solid ${ACC}; border-right:  2.5px solid ${ACC}; border-radius: 0 2px 0 0; }
  .vf2::before { bottom: -3px; left: -3px;  border-bottom: 2.5px solid ${ACC}; border-left:   2.5px solid ${ACC}; border-radius: 0 0 0 2px; }
  .vf2::after  { bottom: -3px; right: -3px; border-bottom: 2.5px solid ${ACC}; border-right:  2.5px solid ${ACC}; border-radius: 0 0 2px 0; }

  /* Scan sweep */
  .sw { position: relative; overflow: hidden; display: inline-block; }
  .sw.run::after {
    content: '';
    position: absolute;
    left: 0; right: 0; top: 0;
    height: 2px;
    background: linear-gradient(90deg, transparent, ${ACC}, transparent);
    animation: qr-scan 0.65s ease-out forwards;
  }
  @keyframes qr-scan { from { top: 0; opacity: 1; } to { top: 100%; opacity: 0; } }

  /* QR image pop-in */
  @keyframes qr-pop { from { opacity: 0; transform: scale(0.91); } to { opacity: 1; transform: scale(1); } }
  .qr-pop { animation: qr-pop 0.28s cubic-bezier(0.16, 1, 0.3, 1) both; }

  /* Color + range input resets */
  input[type="color"] {
    -webkit-appearance: none; appearance: none;
    border: none; padding: 2px; cursor: pointer;
    border-radius: 6px; width: 36px; height: 36px;
  }
  input[type="color"]::-webkit-color-swatch-wrapper { padding: 0; }
  input[type="color"]::-webkit-color-swatch { border: none; border-radius: 4px; }
  .qr-range { -webkit-appearance: none; appearance: none; height: 4px; border-radius: 2px; cursor: pointer; }
  .qr-range::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 16px; height: 16px; border-radius: 50%;
    background: #0A0A0A; cursor: pointer;
  }
`;

/* ─── Helpers ────────────────────────────────────────────────────── */
function emptyFields() {
  return {
    url: '', text: '', email: '', subject: '',
    body: '', phone: '', ssid: '', password: '', security: 'WPA',
  };
}

function buildQRData(type, fields) {
  switch (type) {
    case 'URL':
      return (fields.url || '').trim();
    case 'Text':
      return (fields.text || '').trim();
    case 'Phone':
      return fields.phone ? `tel:${fields.phone}` : '';
    case 'WiFi': {
      const { ssid, password = '', security = 'WPA' } = fields;
      return ssid?.trim() ? `WIFI:T:${security};S:${ssid};P:${password};;` : '';
    }
    case 'Email': {
      if (!fields.email) return '';
      const qs = [];
      if (fields.subject) qs.push(`subject=${encodeURIComponent(fields.subject)}`);
      if (fields.body)    qs.push(`body=${encodeURIComponent(fields.body)}`);
      return `mailto:${fields.email}${qs.length ? '?' + qs.join('&') : ''}`;
    }
    default:
      return '';
  }
}

function buildQRImageUrl(data, { fg, bg, ecc, size, format = 'png' } = {}) {
  if (!data?.trim()) return null;
  const p = new URLSearchParams({
    data: data.trim(),
    size: `${size}x${size}`,
    color: fg.replace('#', ''),
    bgcolor: bg.replace('#', ''),
    ecc,
    qzone: 1,
    format,
  });
  return `https://api.qrserver.com/v1/create-qr-code/?${p}`;
}

/* ─── Shared primitives ──────────────────────────────────────────── */
function FieldLabel({ children }) {
  return (
    <span
      className="block mb-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-stone-400"
      style={{ fontFamily: MONO }}>
      {children}
    </span>
  );
}

function FormInput({ as: Tag = 'input', className = '', ...props }) {
  return (
    <Tag
      className={[
        'w-full bg-stone-50 border border-stone-200 rounded-xl',
        'px-3.5 py-2.5 text-sm text-stone-900 placeholder:text-stone-400',
        'outline-none transition-all',
        'focus:border-[#00C896] focus:ring-2 focus:ring-[#00C896]/10',
        className,
      ].join(' ')}
      {...props}
    />
  );
}

function FormField({ label, children }) {
  return (
    <div className="mb-3">
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  );
}

function ChipButton({ active, onClick, children, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
        active
          ? 'bg-stone-900 text-white border-stone-900'
          : 'text-stone-500 border-stone-200 hover:border-stone-900 hover:text-stone-900',
        className,
      ].join(' ')}
      style={{ fontFamily: MONO }}>
      {children}
    </button>
  );
}

function SectionCard({ children, className = '' }) {
  return (
    <div className={`bg-white border border-stone-200 rounded-2xl p-4 ${className}`}>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-stone-100 my-4"/>;
}

/* ─── Type-specific forms ────────────────────────────────────────── */
function URLForm({ fields, onChange }) {
  return (
    <FormField label="URL">
      <FormInput
        type="url"
        placeholder="https://example.com"
        value={fields.url || ''}
        onChange={e => onChange({ ...fields, url: e.target.value })}
        autoFocus
      />
    </FormField>
  );
}

function TextForm({ fields, onChange }) {
  return (
    <FormField label="Text content">
      <FormInput
        as="textarea"
        rows={4}
        placeholder="Enter any text…"
        value={fields.text || ''}
        onChange={e => onChange({ ...fields, text: e.target.value })}
        className="resize-none leading-relaxed"
      />
    </FormField>
  );
}

function PhoneForm({ fields, onChange }) {
  return (
    <FormField label="Phone number">
      <FormInput
        type="tel"
        placeholder="+1 555 000 0000"
        value={fields.phone || ''}
        onChange={e => onChange({ ...fields, phone: e.target.value })}
      />
    </FormField>
  );
}

function EmailForm({ fields, onChange }) {
  const upd = key => e => onChange({ ...fields, [key]: e.target.value });
  return (
    <>
      <FormField label="Email address">
        <FormInput type="email" placeholder="hello@example.com" value={fields.email || ''} onChange={upd('email')}/>
      </FormField>
      <FormField label="Subject">
        <FormInput type="text" placeholder="Optional" value={fields.subject || ''} onChange={upd('subject')}/>
      </FormField>
      <FormField label="Body">
        <FormInput as="textarea" rows={2} placeholder="Optional" value={fields.body || ''} onChange={upd('body')} className="resize-none"/>
      </FormField>
    </>
  );
}

function WiFiForm({ fields, onChange }) {
  const upd = key => e => onChange({ ...fields, [key]: e.target.value });
  const sec = fields.security || 'WPA';
  return (
    <>
      <FormField label="Network (SSID)">
        <FormInput type="text" placeholder="MyNetwork" value={fields.ssid || ''} onChange={upd('ssid')}/>
      </FormField>
      <FormField label="Password">
        <FormInput type="text" placeholder="Password" value={fields.password || ''} onChange={upd('password')}/>
      </FormField>
      <FormField label="Security">
        <div className="flex gap-2">
          {['WPA', 'WEP', 'None'].map(v => (
            <ChipButton key={v} active={sec === v} onClick={() => onChange({ ...fields, security: v })}>
              {v}
            </ChipButton>
          ))}
        </div>
      </FormField>
    </>
  );
}

const FORM_MAP = { URL: URLForm, Text: TextForm, Email: EmailForm, Phone: PhoneForm, WiFi: WiFiForm };

/* ─── TypeSelector ───────────────────────────────────────────────── */
function TypeSelector({ value, onChange }) {
  return (
    <SectionCard className="mb-3">
      <FieldLabel>Content type</FieldLabel>
      <div className="flex flex-wrap gap-2">
        {QR_TYPES.map(({ id, icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all',
              value === id
                ? 'bg-stone-900 text-white border-stone-900'
                : 'text-stone-500 border-stone-200 hover:border-stone-900 hover:text-stone-900',
            ].join(' ')}>
            <i className={`ti ${icon}`} style={{ fontSize: 13 }} aria-hidden="true"/>
            {id}
          </button>
        ))}
      </div>
    </SectionCard>
  );
}

/* ─── Customizer ─────────────────────────────────────────────────── */
function Customizer({ fg, bg, ecc, size, preset, onFgChange, onBgChange, onEccChange, onSizeChange, onPresetChange }) {
  return (
    <SectionCard>
      <FieldLabel>Customise</FieldLabel>

      {/* Color presets */}
      <p className="text-xs text-stone-400 mb-2">Color presets</p>
      <div className="flex gap-2 flex-wrap mb-4">
        {PRESETS.map((p, i) => (
          <button
            key={i}
            type="button"
            title={p.name}
            aria-label={p.name}
            onClick={() => onPresetChange(i)}
            className={[
              'w-[26px] h-[26px] rounded-full border-[2.5px] transition-all hover:scale-110',
              preset === i
                ? 'border-[#00C896] outline outline-[2.5px] outline-[#00C896] outline-offset-[2px]'
                : 'border-transparent',
            ].join(' ')}
            style={{ background: `linear-gradient(135deg, ${p.fg} 50%, ${p.bg} 50%)` }}
          />
        ))}
      </div>

      {/* Color pickers */}
      <div className="flex gap-5 mb-4">
        {[
          ['QR color',   fg, onFgChange],
          ['Background', bg, onBgChange],
        ].map(([label, val, handler]) => (
          <div key={label}>
            <p className="text-xs text-stone-400 mb-1.5">{label}</p>
            <div className="flex items-center gap-2">
              <div className="bg-stone-100 border border-stone-200 rounded-lg p-0.5">
                <input type="color" value={val} onChange={e => handler(e.target.value)}/>
              </div>
              <span className="text-xs text-stone-500" style={{ fontFamily: MONO }}>
                {val.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Divider/>

      {/* Size slider */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-stone-400">Output size</p>
          <span className="text-xs font-medium" style={{ color: ACC, fontFamily: MONO }}>
            {size} × {size} px
          </span>
        </div>
        <input
          type="range"
          min="150" max="500" step="50"
          value={size}
          onChange={e => onSizeChange(Number(e.target.value))}
          className="qr-range w-full bg-stone-200"
          style={{ accentColor: ACC }}
        />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-stone-300">150 px</span>
          <span className="text-[10px] text-stone-300">500 px</span>
        </div>
      </div>

      <Divider/>

      {/* Error correction */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <p className="text-xs text-stone-400">Error correction</p>
          <span className="text-xs text-stone-400">{ECC_LEVELS[ecc].hint}</span>
        </div>
        <div className="flex gap-2">
          {Object.entries(ECC_LEVELS).map(([key, { label }]) => (
            <ChipButton key={key} active={ecc === key} onClick={() => onEccChange(key)}>
              {label}
            </ChipButton>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

/* ─── QR Preview ─────────────────────────────────────────────────── */
function QRPreview({ qrUrl, bg, size, scanning, onLoad }) {
  const hasQR      = !!qrUrl;
  const displaySize = Math.min(size, 240);

  return (
    <div className={`qr-zone ${hasQR ? 'live' : ''}`}>
      {hasQR ? (
        <div className="vf">
          <div className="vf2">
            <div
              className={`sw ${scanning ? 'run' : ''}`}
              style={{ background: bg, borderRadius: 12, padding: 14, boxShadow: '0 10px 44px rgba(0,0,0,.13)' }}>
              <img
                key={qrUrl}
                className="qr-pop block"
                src={qrUrl}
                alt="Generated QR code"
                width={displaySize}
                height={displaySize}
                onLoad={onLoad}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center select-none">
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-stone-200 flex items-center justify-center mx-auto mb-3">
            <QRLogoSVG opacity={0.2} fill="#0A0A0A" holeFill="#FBFBF9" size={32}/>
          </div>
          <p className="text-sm text-stone-400 mb-1">Your QR code appears here</p>
          <p className="text-xs text-stone-300">Fill in the form to get started</p>
        </div>
      )}
    </div>
  );
}

/* ─── Status bar ─────────────────────────────────────────────────── */
function StatusBar({ content, size, ecc }) {
  return (
    <div className="px-5 py-2.5 border-t border-b border-stone-100 bg-stone-50 flex items-center gap-3 text-xs overflow-hidden">
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <div className="w-2 h-2 rounded-full" style={{ background: ACC }}/>
        <span className="text-stone-500" style={{ fontFamily: MONO }}>Ready</span>
      </div>
      <span className="text-stone-200">·</span>
      <span className="text-stone-400 flex-shrink-0" style={{ fontFamily: MONO }}>{size}px · ECC {ecc}</span>
      <span className="text-stone-200">·</span>
      <span className="text-stone-400 truncate">{content}</span>
    </div>
  );
}

/* ─── Action bar ─────────────────────────────────────────────────── */
function ActionBar({ disabled, onDownloadPng, onDownloadSvg, onCopyUrl, copied }) {
  return (
    <div className="p-4 flex gap-2 flex-wrap">
      <button
        type="button"
        onClick={onDownloadPng}
        disabled={disabled}
        className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 px-5 rounded-xl transition-all disabled:opacity-30 disabled:pointer-events-none hover:-translate-y-0.5 active:translate-y-0"
        style={{ background: ACC, color: '#0A0A0A', fontFamily: SANS }}>
        <i className="ti ti-download" style={{ fontSize: 15 }} aria-hidden="true"/>
        Download PNG
      </button>

      <button
        type="button"
        onClick={onDownloadSvg}
        disabled={disabled}
        className="flex items-center gap-1.5 text-sm font-medium py-2.5 px-4 rounded-xl border border-stone-200 text-stone-600 hover:border-stone-900 hover:text-stone-900 transition-all disabled:opacity-30 disabled:pointer-events-none"
        style={{ fontFamily: SANS }}>
        <i className="ti ti-vector" style={{ fontSize: 15 }} aria-hidden="true"/>
        SVG
      </button>

      <button
        type="button"
        onClick={onCopyUrl}
        disabled={disabled}
        title="Copy image URL"
        aria-label="Copy image URL"
        className="flex items-center justify-center p-2.5 rounded-xl border border-stone-200 text-stone-500 hover:border-stone-900 hover:text-stone-900 transition-all disabled:opacity-30 disabled:pointer-events-none">
        <i
          className={`ti ${copied ? 'ti-check' : 'ti-link'}`}
          style={{ fontSize: 16, color: copied ? ACC : undefined }}
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

/* ─── Tips card ──────────────────────────────────────────────────── */
function TipsCard() {
  return (
    <div className="rounded-2xl p-4" style={{ background: ACC_L, border: '1px solid rgba(0,200,150,.22)' }}>
      <p
        className="text-[10px] font-medium uppercase tracking-[0.1em] mb-2"
        style={{ color: ACC_D, fontFamily: MONO }}>
        Tips
      </p>
      <ul className="text-xs leading-[1.85] list-disc pl-4 space-y-0" style={{ color: '#065F46' }}>
        <li>Keep URLs short — use a link shortener if needed</li>
        <li>Use High or Max ECC when adding a logo overlay</li>
        <li>Always test by scanning before you print</li>
      </ul>
    </div>
  );
}

/* ─── Logo SVG ───────────────────────────────────────────────────── */
function QRLogoSVG({ size = 24, fill = ACC, holeFill = '#0A0A0A', opacity = 1 }) {
  return (
    <svg viewBox="0 0 10 10" width={size} height={size} fill="none" opacity={opacity}>
      <rect width="4" height="4" fill={fill}/><rect x="1" y="1" width="2" height="2" fill={holeFill}/>
      <rect x="6" width="4" height="4" fill={fill}/><rect x="7" y="1" width="2" height="2" fill={holeFill}/>
      <rect y="6" width="4" height="4" fill={fill}/><rect x="1" y="7" width="2" height="2" fill={holeFill}/>
      <rect x="6" y="6" width="2" height="2" fill={fill}/>
      <rect x="8" y="6" width="2" height="2" fill={fill}/>
      <rect x="6" y="8" width="2" height="2" fill={fill}/>
      <rect x="8" y="8" width="2" height="2" fill={fill}/>
    </svg>
  );
}

/* ══════════════════════════════════════════════════════════════════
   Main QRGenerator component
══════════════════════════════════════════════════════════════════ */
export default function QRGenerator() {
  const [type,     setType]     = useState('URL');
  const [fields,   setFields]   = useState(emptyFields);
  const [fg,       setFg]       = useState('#000000');
  const [bg,       setBg]       = useState('#FFFFFF');
  const [ecc,      setEcc]      = useState('M');
  const [size,     setSize]     = useState(300);
  const [content,  setContent]  = useState('');
  const [scanning, setScanning] = useState(false);
  const [loaded,   setLoaded]   = useState(false);
  const [preset,   setPreset]   = useState(0);
  const [copied,   setCopied]   = useState(false);
  const scanTimer = useRef(null);

  /* ── Inject global styles once ────────────────────────────────── */
  useEffect(() => {
    const STYLE_ID = '__qr-generator-styles__';
    if (!document.getElementById(STYLE_ID)) {
      const el = document.createElement('style');
      el.id = STYLE_ID;
      el.textContent = INJECTED_CSS;
      document.head.appendChild(el);
    }
  }, []);

  /* ── Trigger scan animation ───────────────────────────────────── */
  const triggerScan = useCallback(() => {
    setScanning(false);
    clearTimeout(scanTimer.current);
    setTimeout(() => {
      setScanning(true);
      scanTimer.current = setTimeout(() => setScanning(false), 700);
    }, 20);
  }, []);

  /* ── Debounce: rebuild QR data when form changes ──────────────── */
  useEffect(() => {
    const t = setTimeout(() => {
      const data = buildQRData(type, fields);
      setContent(data);
      if (data) { setLoaded(false); triggerScan(); }
    }, 380);
    return () => clearTimeout(t);
  }, [type, fields, triggerScan]);

  /* ── Re-render QR when style options change ───────────────────── */
  useEffect(() => {
    if (content) { setLoaded(false); triggerScan(); }
  }, [fg, bg, ecc, size]);   // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Derived values ────────────────────────────────────────────── */
  const qrImageUrl = buildQRImageUrl(content, { fg, bg, ecc, size });
  const hasContent = !!content;
  const TypeForm   = FORM_MAP[type];

  /* ── Handlers ──────────────────────────────────────────────────── */
  const handleTypeChange = useCallback((newType) => {
    setType(newType);
    setFields(emptyFields());
    setContent('');
  }, []);

  const handlePreset = useCallback((index) => {
    setPreset(index);
    setFg(PRESETS[index].fg);
    setBg(PRESETS[index].bg);
  }, []);

  const handleDownload = useCallback(async (format) => {
    const url = buildQRImageUrl(content, { fg, bg, ecc, size, format });
    if (!url) return;
    try {
      const res  = await fetch(url);
      const blob = await res.blob();
      const a    = Object.assign(document.createElement('a'), {
        href:     URL.createObjectURL(blob),
        download: `qr-code.${format}`,
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(url, '_blank');
    }
  }, [content, fg, bg, ecc, size]);

  const handleCopyUrl = useCallback(async () => {
    if (!qrImageUrl) return;
    try { await navigator.clipboard.writeText(qrImageUrl); } catch {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }, [qrImageUrl]);

  /* ── Render ────────────────────────────────────────────────────── */
  return (
    <div
      className="min-h-screen p-5 md:p-7"
      style={{ background: '#FBFBF9', fontFamily: SANS }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <header className="max-w-5xl mx-auto mb-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-stone-900 flex items-center justify-center flex-shrink-0">
          <QRLogoSVG size={24} fill={ACC} holeFill="#0A0A0A"/>
        </div>
        <div>
          <h1
            className="text-[17px] font-medium text-stone-900 leading-none"
            style={{ fontFamily: MONO }}>
            QR Generator
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">Create · Customise · Download</p>
        </div>
      </header>

      {/* ── Layout ─────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-4 items-start">

        {/* ── Left column: controls ─────────────────────────── */}
        <div>
          <TypeSelector value={type} onChange={handleTypeChange}/>

          {/* Content form */}
          <SectionCard className="mb-3">
            <div className="flex justify-between items-center mb-4">
              <FieldLabel>{type} content</FieldLabel>
              {content && (
                <span
                  className={`text-[10px] font-medium ${content.length > 400 ? 'text-red-500' : 'text-stone-400'}`}
                  style={{ fontFamily: MONO }}>
                  {content.length} chars
                </span>
              )}
            </div>
            <TypeForm fields={fields} onChange={setFields}/>
          </SectionCard>

          <Customizer
            fg={fg}           bg={bg}
            ecc={ecc}         size={size}
            preset={preset}
            onFgChange={v  => { setFg(v);    setPreset(-1); }}
            onBgChange={v  => { setBg(v);    setPreset(-1); }}
            onEccChange={setEcc}
            onSizeChange={setSize}
            onPresetChange={handlePreset}
          />
        </div>

        {/* ── Right column: preview ─────────────────────────── */}
        <div className="lg:sticky lg:top-6">
          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden mb-3">

            <QRPreview
              qrUrl={qrImageUrl}
              bg={bg}
              size={size}
              scanning={scanning}
              onLoad={() => setLoaded(true)}
            />

            {hasContent && (
              <StatusBar content={content} size={size} ecc={ecc}/>
            )}

            <ActionBar
              disabled={!hasContent}
              onDownloadPng={() => handleDownload('png')}
              onDownloadSvg={() => handleDownload('svg')}
              onCopyUrl={handleCopyUrl}
              copied={copied}
            />
          </div>

          <TipsCard/>
        </div>
      </main>
    </div>
  );
}
