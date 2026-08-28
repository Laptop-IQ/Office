import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';



const ACC = '#00C896';
const ACC_DARK = '#00E0A8';

const SANS = '"DM Sans", system-ui, sans-serif';
const MONO = '"DM Mono", monospace';

const COLORS = {
  app: '#080A0A',
  panel: '#101313',
  panel2: '#141818',
  input: '#0C1010',
  border: '#222929',
  borderHover: '#343C3C',
  text: '#F2F5F4',
  muted: '#899492',
  dim: '#596260',
};

const QR_TYPES = [
  {
    id: 'URL',
    icon: 'ti-link',
    description: 'Website or landing page',
  },
  {
    id: 'Text',
    icon: 'ti-text-size',
    description: 'Plain text content',
  },
  {
    id: 'Email',
    icon: 'ti-mail',
    description: 'Email with subject',
  },
  {
    id: 'Phone',
    icon: 'ti-phone',
    description: 'Phone number',
  },
  {
    id: 'WiFi',
    icon: 'ti-wifi',
    description: 'WiFi network',
  },
];

const PRESETS = [
  {
    name: 'Classic',
    fg: '#000000',
    bg: '#FFFFFF',
  },
  {
    name: 'Night',
    fg: '#FFFFFF',
    bg: '#101116',
  },
  {
    name: 'Mint',
    fg: '#065F46',
    bg: '#ECFDF5',
  },
  {
    name: 'Ocean',
    fg: '#1E3A8A',
    bg: '#EFF6FF',
  },
  {
    name: 'Amber',
    fg: '#78350F',
    bg: '#FFFBEB',
  },
  {
    name: 'Rose',
    fg: '#9F1239',
    bg: '#FFF1F2',
  },
  {
    name: 'Violet',
    fg: '#4C1D95',
    bg: '#F5F3FF',
  },
  {
    name: 'Slate',
    fg: '#0F172A',
    bg: '#F8FAFC',
  },
];

const ECC_LEVELS = {
  L: {
    label: 'Low',
    short: 'L',
    hint: '7%',
  },
  M: {
    label: 'Medium',
    short: 'M',
    hint: '15%',
  },
  Q: {
    label: 'High',
    short: 'Q',
    hint: '25%',
  },
  H: {
    label: 'Maximum',
    short: 'H',
    hint: '30%',
  },
};

const MAX_CHARS = 1200;

/* ═══════════════════════════════════════════════════════════════════
   DARK THEME CSS
═══════════════════════════════════════════════════════════════════ */

const INJECTED_CSS = `
  :root {
    --qr-accent: ${ACC};
    --qr-accent-bright: ${ACC_DARK};
  }

  * {
    box-sizing: border-box;
  }

  html {
    background: #080A0A;
  }

  body {
    margin: 0;
    background: #080A0A;
  }

  .qr-app {
    min-height: 100vh;
    color: ${COLORS.text};
    background:
      radial-gradient(
        circle at 50% -15%,
        rgba(0, 200, 150, .12),
        transparent 34rem
      ),
      radial-gradient(
        circle at 100% 50%,
        rgba(0, 200, 150, .035),
        transparent 28rem
      ),
      #080A0A;
  }

  .qr-grid-bg {
    background-image:
      linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px);
    background-size: 24px 24px;
  }

  .qr-panel {
    background:
      linear-gradient(
        145deg,
        rgba(255,255,255,.035),
        rgba(255,255,255,.012)
      ),
      #101313;
    border: 1px solid #222929;
  }

  .qr-panel-shadow {
    box-shadow:
      0 1px 2px rgba(0,0,0,.25),
      0 18px 55px rgba(0,0,0,.20);
  }

  .qr-glass {
    background: rgba(16,19,19,.72);
    backdrop-filter: blur(18px);
    -webkit-backdrop-filter: blur(18px);
  }

  .qr-input {
    width: 100%;
    border: 1px solid #242B2B;
    background: #0C1010;
    color: #F2F5F4;
    border-radius: 13px;
    outline: none;
    transition:
      border .2s ease,
      box-shadow .2s ease,
      background .2s ease;
  }

  .qr-input:hover {
    border-color: #343C3C;
  }

  .qr-input:focus {
    background: #0E1313;
    border-color: ${ACC};
    box-shadow:
      0 0 0 4px rgba(0,200,150,.085),
      0 0 25px rgba(0,200,150,.035);
  }

  .qr-input::placeholder {
    color: #555F5D;
  }

  .qr-zone {
    min-height: 430px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
    transition:
      background .45s ease,
      box-shadow .35s ease;
  }

  .qr-zone-empty {
    background:
      linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px),
      #0D1010;
    background-size: 22px 22px;
  }

  .qr-zone-live {
    background:
      radial-gradient(
        circle at center,
        rgba(0,200,150,.045),
        transparent 21rem
      ),
      #0C0F0F;
  }

  .qr-zone-live::before {
    content: '';
    position: absolute;
    width: 330px;
    height: 330px;
    border-radius: 50%;
    background: rgba(0,200,150,.055);
    filter: blur(70px);
    pointer-events: none;
  }

  .qr-frame {
    position: relative;
    padding: 15px;
    border-radius: 20px;
    background: var(--qr-preview-bg, #fff);
    box-shadow:
      0 0 0 1px rgba(255,255,255,.10),
      0 28px 90px rgba(0,0,0,.60),
      0 8px 25px rgba(0,0,0,.35);
  }

  .qr-frame::before,
  .qr-frame::after {
    content: '';
    position: absolute;
    width: 23px;
    height: 23px;
    border-color: ${ACC};
    pointer-events: none;
  }

  .qr-frame::before {
    top: -7px;
    left: -7px;
    border-top: 2px solid;
    border-left: 2px solid;
    border-radius: 5px 0 0 0;
  }

  .qr-frame::after {
    right: -7px;
    bottom: -7px;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-radius: 0 0 5px 0;
  }

  .qr-frame-inner::before,
  .qr-frame-inner::after {
    content: '';
    position: absolute;
    width: 23px;
    height: 23px;
    border-color: ${ACC};
    pointer-events: none;
  }

  .qr-frame-inner::before {
    top: -7px;
    right: -7px;
    border-top: 2px solid;
    border-right: 2px solid;
    border-radius: 0 5px 0 0;
  }

  .qr-frame-inner::after {
    left: -7px;
    bottom: -7px;
    border-left: 2px solid;
    border-bottom: 2px solid;
    border-radius: 0 0 0 5px;
  }

  @keyframes qrPop {
    0% {
      opacity: 0;
      transform: scale(.88);
    }
    70% {
      opacity: 1;
      transform: scale(1.015);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .qr-pop {
    animation: qrPop .35s cubic-bezier(.16,1,.3,1);
  }

  @keyframes qrScan {
    0% {
      top: 0;
      opacity: 0;
    }
    12% {
      opacity: 1;
    }
    100% {
      top: 100%;
      opacity: 0;
    }
  }

  .qr-scan-line {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    height: 2px;
    background: linear-gradient(
      90deg,
      transparent,
      ${ACC},
      transparent
    );
    box-shadow:
      0 0 10px ${ACC},
      0 0 25px rgba(0,200,150,.45);
    animation: qrScan .7s ease-out forwards;
    pointer-events: none;
  }

  @keyframes qrStatusIn {
    from {
      opacity: 0;
      transform: translateY(5px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .qr-status-in {
    animation: qrStatusIn .25s ease-out;
  }

  .qr-range {
    -webkit-appearance: none;
    appearance: none;
    height: 5px;
    border-radius: 99px;
    outline: none;
    cursor: pointer;
  }

  .qr-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    border: 3px solid #101313;
    background: ${ACC};
    box-shadow:
      0 0 0 1px rgba(0,200,150,.3),
      0 2px 8px rgba(0,0,0,.4);
    cursor: pointer;
  }

  .qr-range::-moz-range-thumb {
    width: 14px;
    height: 14px;
    border-radius: 50%;
    border: 3px solid #101313;
    background: ${ACC};
    box-shadow: 0 0 0 1px rgba(0,200,150,.3);
    cursor: pointer;
  }

  input[type="color"] {
    width: 38px;
    height: 38px;
    padding: 3px;
    border: 1px solid #293030;
    border-radius: 10px;
    background: #0C1010;
    cursor: pointer;
  }

  input[type="color"]::-webkit-color-swatch-wrapper {
    padding: 0;
  }

  input[type="color"]::-webkit-color-swatch {
    border: 0;
    border-radius: 6px;
  }

  .qr-scroll::-webkit-scrollbar {
    width: 5px;
  }

  .qr-scroll::-webkit-scrollbar-track {
    background: transparent;
  }

  .qr-scroll::-webkit-scrollbar-thumb {
    background: #303737;
    border-radius: 99px;
  }

  ::selection {
    color: #03110D;
    background: ${ACC};
  }

  @media (max-width: 1023px) {
    .qr-zone {
      min-height: 360px;
    }
  }

  @media (max-width: 640px) {
    .qr-zone {
      min-height: 310px;
    }

    .qr-frame {
      padding: 11px;
      border-radius: 15px;
    }
  }
`;

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */

function emptyFields() {
  return {
    url: '',
    text: '',
    email: '',
    subject: '',
    body: '',
    phone: '',
    ssid: '',
    password: '',
    security: 'WPA',
  };
}

function buildQRData(type, fields) {
  switch (type) {
    case 'URL':
      return (fields.url || '').trim();

    case 'Text':
      return (fields.text || '').trim();

    case 'Phone':
      return fields.phone?.trim()
        ? `tel:${fields.phone.trim()}`
        : '';

    case 'Email': {
      const email = fields.email?.trim();

      if (!email) return '';

      const query = [];

      if (fields.subject?.trim()) {
        query.push(
          `subject=${encodeURIComponent(fields.subject.trim())}`
        );
      }

      if (fields.body?.trim()) {
        query.push(
          `body=${encodeURIComponent(fields.body.trim())}`
        );
      }

      return `mailto:${email}${
        query.length ? `?${query.join('&')}` : ''
      }`;
    }

    case 'WiFi': {
      const ssid = fields.ssid?.trim();

      if (!ssid) return '';

      return [
        'WIFI:',
        `T:${fields.security || 'WPA'};`,
        `S:${ssid};`,
        `P:${fields.password || ''};;`,
      ].join('');
    }

    default:
      return '';
  }
}

function buildQRImageUrl(
  data,
  {
    fg,
    bg,
    ecc,
    size,
    format = 'png',
  } = {}
) {
  if (!data?.trim()) return null;

  const params = new URLSearchParams({
    data: data.trim(),
    size: `${size}x${size}`,
    color: fg.replace('#', ''),
    bgcolor: bg.replace('#', ''),
    ecc,
    qzone: '1',
    format,
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isValidURL(value) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   ICON
═══════════════════════════════════════════════════════════════════ */

function Icon({
  name,
  size = 16,
  className = '',
}) {
  return (
    <i
      className={`ti ${name} ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   LOGO
═══════════════════════════════════════════════════════════════════ */

function QRLogo({
  size = 24,
  accent = ACC,
}) {
  return (
    <svg
      viewBox="0 0 10 10"
      width={size}
      height={size}
      fill="none"
      aria-hidden="true"
    >
      <rect width="4" height="4" rx=".4" fill={accent} />
      <rect
        x="1"
        y="1"
        width="2"
        height="2"
        fill="#090B0B"
      />

      <rect
        x="6"
        width="4"
        height="4"
        rx=".4"
        fill={accent}
      />
      <rect
        x="7"
        y="1"
        width="2"
        height="2"
        fill="#090B0B"
      />

      <rect
        y="6"
        width="4"
        height="4"
        rx=".4"
        fill={accent}
      />
      <rect
        x="1"
        y="7"
        width="2"
        height="2"
        fill="#090B0B"
      />

      <rect x="6" y="6" width="2" height="2" fill={accent} />
      <rect x="8" y="6" width="2" height="2" fill={accent} />
      <rect x="6" y="8" width="2" height="2" fill={accent} />
      <rect x="8" y="8" width="2" height="2" fill={accent} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   UI PRIMITIVES
═══════════════════════════════════════════════════════════════════ */

function Panel({
  children,
  className = '',
}) {
  return (
    <section
      className={`qr-panel rounded-2xl qr-panel-shadow ${className}`}
    >
      {children}
    </section>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  right,
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-4">
      <div>
        {eyebrow && (
          <div
            className="text-[9px] font-medium uppercase tracking-[.16em] text-[#596260] mb-1"
            style={{ fontFamily: MONO }}
          >
            {eyebrow}
          </div>
        )}

        <h2 className="text-[15px] font-semibold text-[#F2F5F4]">
          {title}
        </h2>

        {description && (
          <p className="text-xs text-[#687371] mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>

      {right}
    </div>
  );
}

function FieldLabel({
  children,
  required = false,
}) {
  return (
    <label
      className="block text-[10px] font-semibold uppercase tracking-[.12em] text-[#687371] mb-1.5"
      style={{ fontFamily: MONO }}
    >
      {children}

      {required && (
        <span
          className="ml-1"
          style={{ color: ACC }}
        >
          *
        </span>
      )}
    </label>
  );
}

function FormInput({
  as: Tag = 'input',
  className = '',
  ...props
}) {
  return (
    <Tag
      className={`qr-input px-3.5 py-2.5 text-sm ${className}`}
      {...props}
    />
  );
}

function FormField({
  label,
  required,
  children,
}) {
  return (
    <div className="mb-3.5">
      <FieldLabel required={required}>
        {label}
      </FieldLabel>

      {children}
    </div>
  );
}

function Divider() {
  return (
    <div className="h-px bg-[#202626] my-4" />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   TYPE SELECTOR
═══════════════════════════════════════════════════════════════════ */

function TypeSelector({
  value,
  onChange,
}) {
  return (
    <Panel className="p-3 mb-3">
      <div className="flex items-center justify-between px-1 mb-2.5">
        <div
          className="text-[10px] uppercase tracking-[.12em] text-[#687371] font-medium"
          style={{ fontFamily: MONO }}
        >
          QR type
        </div>

        <div
          className="text-[9px] text-[#3F4846]"
          style={{ fontFamily: MONO }}
        >
          SELECT FORMAT
        </div>
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {QR_TYPES.map((item) => {
          const active = value === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              title={item.description}
              className={[
                'relative flex flex-col items-center justify-center',
                'gap-1.5 min-h-[68px] rounded-xl border',
                'transition-all duration-200',
                active
                  ? 'bg-[#171C1C] text-white border-[#35403E] shadow-[inset_0_0_0_1px_rgba(0,200,150,.08)]'
                  : 'bg-[#0D1010] border-[#222929] text-[#697371] hover:border-[#343C3C] hover:text-[#D5DCDA]',
              ].join(' ')}
            >
              {active && (
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                  style={{
                    background: ACC,
                    boxShadow: `0 0 8px ${ACC}`,
                  }}
                />
              )}

              <Icon
                name={item.icon}
                size={17}
              />

              <span className="text-[10px] font-medium">
                {item.id}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   FORMS
═══════════════════════════════════════════════════════════════════ */

function URLForm({
  fields,
  onChange,
  invalid,
}) {
  return (
    <FormField label="Website URL" required>
      <FormInput
        type="url"
        autoFocus
        placeholder="https://yourwebsite.com"
        value={fields.url || ''}
        onChange={(e) =>
          onChange({
            ...fields,
            url: e.target.value,
          })
        }
      />

      {invalid ? (
        <p className="text-[11px] text-red-400 mt-1.5">
          Enter a valid http:// or https:// URL.
        </p>
      ) : (
        <p className="text-[10px] text-[#596260] mt-1.5">
          Short URLs create cleaner and easier-to-scan codes.
        </p>
      )}
    </FormField>
  );
}

function TextForm({
  fields,
  onChange,
}) {
  return (
    <FormField label="Text content" required>
      <FormInput
        as="textarea"
        rows={5}
        maxLength={MAX_CHARS}
        placeholder="Write anything you want to encode..."
        value={fields.text || ''}
        onChange={(e) =>
          onChange({
            ...fields,
            text: e.target.value,
          })
        }
        className="resize-none leading-relaxed"
      />

      <div className="flex justify-between mt-1.5">
        <span className="text-[10px] text-[#596260]">
          Plain text QR
        </span>

        <span
          className={[
            'text-[10px]',
            fields.text?.length > MAX_CHARS * .85
              ? 'text-amber-400'
              : 'text-[#596260]',
          ].join(' ')}
          style={{ fontFamily: MONO }}
        >
          {(fields.text || '').length}/{MAX_CHARS}
        </span>
      </div>
    </FormField>
  );
}

function PhoneForm({
  fields,
  onChange,
}) {
  return (
    <FormField label="Phone number" required>
      <FormInput
        type="tel"
        placeholder="+91 98765 43210"
        value={fields.phone || ''}
        onChange={(e) =>
          onChange({
            ...fields,
            phone: e.target.value,
          })
        }
      />

      <p className="text-[10px] text-[#596260] mt-1.5">
        Scanning opens the device phone dialer.
      </p>
    </FormField>
  );
}

function EmailForm({
  fields,
  onChange,
  invalid,
}) {
  const update = (key) => (e) =>
    onChange({
      ...fields,
      [key]: e.target.value,
    });

  return (
    <>
      <FormField label="Email address" required>
        <FormInput
          type="email"
          placeholder="hello@example.com"
          value={fields.email || ''}
          onChange={update('email')}
        />

        {invalid && (
          <p className="text-[11px] text-red-400 mt-1.5">
            Please enter a valid email address.
          </p>
        )}
      </FormField>

      <FormField label="Subject">
        <FormInput
          type="text"
          placeholder="Optional subject"
          value={fields.subject || ''}
          onChange={update('subject')}
        />
      </FormField>

      <FormField label="Message">
        <FormInput
          as="textarea"
          rows={3}
          placeholder="Optional email message"
          value={fields.body || ''}
          onChange={update('body')}
          className="resize-none"
        />
      </FormField>
    </>
  );
}

function WiFiForm({
  fields,
  onChange,
}) {
  const update = (key) => (e) =>
    onChange({
      ...fields,
      [key]: e.target.value,
    });

  const security = fields.security || 'WPA';

  return (
    <>
      <FormField label="Network name (SSID)" required>
        <FormInput
          type="text"
          placeholder="My WiFi Network"
          value={fields.ssid || ''}
          onChange={update('ssid')}
        />
      </FormField>

      <FormField label="Password">
        <FormInput
          type="text"
          placeholder="WiFi password"
          value={fields.password || ''}
          onChange={update('password')}
        />
      </FormField>

      <FormField label="Security">
        <div className="flex gap-2">
          {['WPA', 'WEP', 'None'].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() =>
                onChange({
                  ...fields,
                  security: item,
                })
              }
              className={[
                'px-3 py-1.5 rounded-lg border',
                'text-[11px] font-medium transition-all',
                security === item
                  ? 'bg-[#171C1C] border-[#394441] text-white'
                  : 'bg-[#0C1010] border-[#242B2B] text-[#687371] hover:border-[#3A4240] hover:text-white',
              ].join(' ')}
              style={{ fontFamily: MONO }}
            >
              {item}
            </button>
          ))}
        </div>
      </FormField>
    </>
  );
}

const FORM_MAP = {
  URL: URLForm,
  Text: TextForm,
  Email: EmailForm,
  Phone: PhoneForm,
  WiFi: WiFiForm,
};

/* ═══════════════════════════════════════════════════════════════════
   CUSTOMIZER
═══════════════════════════════════════════════════════════════════ */

function Customizer({
  fg,
  bg,
  ecc,
  size,
  preset,
  onFgChange,
  onBgChange,
  onEccChange,
  onSizeChange,
  onPresetChange,
}) {
  return (
    <Panel className="p-4">
      <SectionTitle
        eyebrow="Appearance"
        title="Customize your QR"
        description="Fine-tune the visual system and scan reliability."
      />

      {/* Presets */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-medium text-[#B8C0BE]">
            Color theme
          </span>

          <span
            className="text-[9px] uppercase text-[#4B5552] tracking-wider"
            style={{ fontFamily: MONO }}
          >
            Presets
          </span>
        </div>

        <div className="grid grid-cols-8 gap-2">
          {PRESETS.map((item, index) => {
            const active = preset === index;

            return (
              <button
                key={item.name}
                type="button"
                title={item.name}
                aria-label={`Use ${item.name} theme`}
                onClick={() => onPresetChange(index)}
                className={[
                  'aspect-square rounded-xl relative transition-all',
                  'hover:scale-105',
                  active
                    ? 'ring-2 ring-[#00C896] ring-offset-2 ring-offset-[#101313]'
                    : 'ring-1 ring-white/5',
                ].join(' ')}
                style={{
                  background: `linear-gradient(135deg, ${item.fg} 50%, ${item.bg} 50%)`,
                }}
              >
                {active && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center"
                      style={{
                        background: ACC,
                        color: '#06140F',
                      }}
                    >
                      <Icon
                        name="ti-check"
                        size={10}
                      />
                    </span>
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Color controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          {
            label: 'QR color',
            value: fg,
            onChange: onFgChange,
          },
          {
            label: 'Background',
            value: bg,
            onChange: onBgChange,
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-[#222929] bg-[#0C1010] p-2.5"
          >
            <p className="text-[10px] text-[#687371] mb-2">
              {item.label}
            </p>

            <div className="flex items-center gap-2">
              <input
                type="color"
                value={item.value}
                onChange={(e) =>
                  item.onChange(e.target.value)
                }
              />

              <span
                className="text-[10px] text-[#899492]"
                style={{ fontFamily: MONO }}
              >
                {item.value.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>

      <Divider />

      {/* Size */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-xs font-medium text-[#B8C0BE]">
              Output resolution
            </p>

            <p className="text-[10px] text-[#596260] mt-0.5">
              Higher resolution is ideal for print.
            </p>
          </div>

          <span
            className="text-xs font-semibold"
            style={{
              color: ACC,
              fontFamily: MONO,
            }}
          >
            {size}px
          </span>
        </div>

        <input
          type="range"
          min="150"
          max="1000"
          step="50"
          value={size}
          onChange={(e) =>
            onSizeChange(Number(e.target.value))
          }
          className="qr-range w-full"
          style={{
            background: `linear-gradient(
              to right,
              ${ACC} 0%,
              ${ACC} ${((size - 150) / 850) * 100}%,
              #252C2C ${((size - 150) / 850) * 100}%,
              #252C2C 100%
            )`,
          }}
        />

        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-[#414A48]">
            150
          </span>

          <span className="text-[9px] text-[#414A48]">
            1000
          </span>
        </div>
      </div>

      {/* ECC */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <div>
            <p className="text-xs font-medium text-[#B8C0BE]">
              Error correction
            </p>

            <p className="text-[10px] text-[#596260] mt-0.5">
              Improves reliability when QR is damaged.
            </p>
          </div>

          <span
            className="text-[10px] text-[#687371]"
            style={{ fontFamily: MONO }}
          >
            {ECC_LEVELS[ecc].hint} recovery
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {Object.entries(ECC_LEVELS).map(
            ([key, item]) => (
              <button
                key={key}
                type="button"
                onClick={() => onEccChange(key)}
                className={[
                  'py-2 rounded-xl border transition-all',
                  ecc === key
                    ? 'border-[#3B4845] bg-[#171C1C] text-white shadow-[inset_0_0_20px_rgba(0,200,150,.025)]'
                    : 'border-[#222929] bg-[#0C1010] text-[#687371] hover:border-[#39413F] hover:text-[#D5DCDA]',
                ].join(' ')}
              >
                <div className="text-xs font-semibold">
                  {item.short}
                </div>

                <div className="text-[9px] opacity-60 mt-0.5">
                  {item.label}
                </div>
              </button>
            )
          )}
        </div>
      </div>
    </Panel>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PREVIEW
═══════════════════════════════════════════════════════════════════ */

function QRPreview({
  qrUrl,
  bg,
  size,
  scanning,
}) {
  const hasQR = Boolean(qrUrl);

  const displaySize = Math.min(size, 300);

  return (
    <div
      className={[
        'qr-zone',
        hasQR
          ? 'qr-zone-live'
          : 'qr-zone-empty',
      ].join(' ')}
    >
      {hasQR ? (
        <div className="relative z-10">
          <div
            className="qr-frame"
            style={{
              '--qr-preview-bg': bg,
            }}
          >
            <div className="qr-frame-inner relative">
              {scanning && (
                <div className="qr-scan-line" />
              )}

              <img
                key={qrUrl}
                src={qrUrl}
                alt="Generated QR code"
                width={displaySize}
                height={displaySize}
                className="qr-pop block rounded-sm"
              />
            </div>
          </div>

          <div className="flex justify-center mt-5">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
              style={{
                background: 'rgba(0,200,150,.055)',
                borderColor: 'rgba(0,200,150,.16)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: ACC,
                  boxShadow: `0 0 8px ${ACC}`,
                }}
              />

              <span
                className="text-[9px] text-[#75B7A5]"
                style={{ fontFamily: MONO }}
              >
                LIVE PREVIEW
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 text-center px-6">
          <div className="relative mx-auto w-24 h-24 rounded-[22px] bg-[#111616] border border-[#252D2D] shadow-lg flex items-center justify-center mb-5">
            <div className="absolute inset-3 border border-dashed border-[#303838] rounded-xl" />

            <QRLogo
              size={40}
              accent="#46504E"
            />

            <span
              className="absolute -right-2 -top-2 w-7 h-7 rounded-full bg-[#141919] border border-[#303838] flex items-center justify-center"
              style={{ color: ACC }}
            >
              <Icon
                name="ti-sparkles"
                size={13}
              />
            </span>
          </div>

          <p className="text-sm font-semibold text-[#C8CFCD]">
            Your QR appears here
          </p>

          <p className="text-xs text-[#596260] mt-1.5 max-w-[260px] mx-auto leading-relaxed">
            Select a format and enter your content to generate
            a live QR code.
          </p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   STATUS
═══════════════════════════════════════════════════════════════════ */

function StatusBar({
  content,
  size,
  ecc,
}) {
  const previewContent =
    content.length > 90
      ? `${content.slice(0, 90)}…`
      : content;

  return (
    <div className="qr-status-in px-4 py-3 border-t border-[#202626] bg-[#0D1010]">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: ACC,
              boxShadow: `0 0 0 3px rgba(0,200,150,.08)`,
            }}
          />

          <span
            className="text-[10px] font-medium text-[#78827F]"
            style={{ fontFamily: MONO }}
          >
            READY
          </span>
        </div>

        <span className="text-[#343C3A]">
          /
        </span>

        <span
          className="text-[10px] text-[#596260] flex-shrink-0"
          style={{ fontFamily: MONO }}
        >
          {size}px · ECC {ecc}
        </span>

        <span className="text-[#343C3A]">
          /
        </span>

        <span
          className="text-[10px] text-[#596260] truncate"
          title={content}
        >
          {previewContent}
        </span>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ACTIONS
═══════════════════════════════════════════════════════════════════ */

function ActionBar({
  disabled,
  onDownloadPng,
  onDownloadSvg,
  onCopyUrl,
  copied,
  downloading,
}) {
  return (
    <div className="p-3.5">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={disabled || downloading}
          onClick={onDownloadPng}
          className={[
            'flex-1 flex items-center justify-center gap-2',
            'py-2.5 px-4 rounded-xl text-xs font-semibold',
            'transition-all duration-200',
            'disabled:opacity-30 disabled:pointer-events-none',
            'hover:-translate-y-0.5 active:translate-y-0',
          ].join(' ')}
          style={{
            background: ACC,
            color: '#04120E',
            boxShadow: `0 8px 30px rgba(0,200,150,.14)`,
          }}
        >
          <Icon
            name={
              downloading
                ? 'ti-loader-2'
                : 'ti-download'
            }
            size={15}
          />

          {downloading
            ? 'Preparing...'
            : 'Download PNG'}
        </button>

        <button
          type="button"
          disabled={disabled || downloading}
          onClick={onDownloadSvg}
          className={[
            'flex items-center justify-center gap-1.5',
            'py-2.5 px-4 rounded-xl text-xs font-medium',
            'border border-[#293030]',
            'bg-[#0D1010]',
            'text-[#9BA4A1]',
            'transition-all',
            'hover:border-[#414A48] hover:text-white',
            'disabled:opacity-30 disabled:pointer-events-none',
          ].join(' ')}
        >
          <Icon
            name="ti-vector"
            size={15}
          />

          SVG
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={onCopyUrl}
          title="Copy image URL"
          aria-label="Copy image URL"
          className={[
            'w-10 flex items-center justify-center',
            'rounded-xl border border-[#293030]',
            'bg-[#0D1010]',
            'text-[#78827F]',
            'transition-all',
            'disabled:opacity-30 disabled:pointer-events-none',
            'hover:border-[#414A48] hover:text-white',
          ].join(' ')}
        >
          <Icon
            name={copied ? 'ti-check' : 'ti-copy'}
            size={16}
          />
        </button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   QUALITY CARD
═══════════════════════════════════════════════════════════════════ */

function QualityCard({
  ecc,
}) {
  return (
    <div
      className="rounded-2xl p-4 border"
      style={{
        background:
          'linear-gradient(145deg, rgba(0,200,150,.07), rgba(0,200,150,.025))',
        borderColor: 'rgba(0,200,150,.15)',
      }}
    >
      <div className="flex gap-3">
        <div
          className="w-8 h-8 flex-shrink-0 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(0,200,150,.10)',
            color: ACC,
          }}
        >
          <Icon
            name="ti-sparkles"
            size={15}
          />
        </div>

        <div>
          <p
            className="text-[10px] font-semibold uppercase tracking-[.12em]"
            style={{
              color: ACC,
              fontFamily: MONO,
            }}
          >
            Pro quality
          </p>

          <p className="text-xs text-[#78958D] mt-1 leading-relaxed">
            ECC <strong className="text-[#B2CFC7]">{ecc}</strong>{' '}
            is active. Use High or Maximum for printed QR
            codes and logo overlays.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════ */

export default function QRGenerator() {
  const [type, setType] = useState('URL');

  const [fields, setFields] =
    useState(emptyFields);

  const [fg, setFg] =
    useState('#000000');

  const [bg, setBg] =
    useState('#FFFFFF');

  const [ecc, setEcc] =
    useState('M');

  const [size, setSize] =
    useState(500);

  const [content, setContent] =
    useState('');

  const [scanning, setScanning] =
    useState(false);

  const [preset, setPreset] =
    useState(0);

  const [copied, setCopied] =
    useState(false);

  const [downloading, setDownloading] =
    useState(false);

  const scanTimer =
    useRef(null);

  /* ─────────────────────────────────────────────────────────────── */

  useEffect(() => {
    const STYLE_ID =
      '__premium-dark-qr-generator__';

    if (!document.getElementById(STYLE_ID)) {
      const style =
        document.createElement('style');

      style.id = STYLE_ID;
      style.textContent =
        INJECTED_CSS;

      document.head.appendChild(style);
    }

    return () => {
      clearTimeout(scanTimer.current);
    };
  }, []);

  /* ─────────────────────────────────────────────────────────────── */

  const triggerScan = useCallback(() => {
    setScanning(false);

    clearTimeout(scanTimer.current);

    scanTimer.current =
      setTimeout(() => {
        setScanning(true);

        scanTimer.current =
          setTimeout(() => {
            setScanning(false);
          }, 750);
      }, 30);
  }, []);

  /* ─────────────────────────────────────────────────────────────── */

  const invalid = useMemo(() => {
    if (type === 'URL') {
      return (
        Boolean(fields.url) &&
        !isValidURL(fields.url)
      );
    }

    if (type === 'Email') {
      return (
        Boolean(fields.email) &&
        !isValidEmail(fields.email)
      );
    }

    return false;
  }, [type, fields]);

  /* ─────────────────────────────────────────────────────────────── */

  useEffect(() => {
    const timer =
      setTimeout(() => {
        const data =
          buildQRData(
            type,
            fields
          );

        setContent(data);

        if (data && !invalid) {
          triggerScan();
        }
      }, 300);

    return () =>
      clearTimeout(timer);
  }, [
    type,
    fields,
    invalid,
    triggerScan,
  ]);

  /* ─────────────────────────────────────────────────────────────── */

  useEffect(() => {
    if (content) {
      triggerScan();
    }
  }, [
    fg,
    bg,
    ecc,
    size,
    content,
    triggerScan,
  ]);

  /* ─────────────────────────────────────────────────────────────── */

  const qrImageUrl = useMemo(
    () =>
      invalid
        ? null
        : buildQRImageUrl(
            content,
            {
              fg,
              bg,
              ecc,
              size,
            }
          ),
    [
      content,
      fg,
      bg,
      ecc,
      size,
      invalid,
    ]
  );

  const hasContent =
    Boolean(content) && !invalid;

  const TypeForm =
    FORM_MAP[type];

  /* ─────────────────────────────────────────────────────────────── */

  const handleTypeChange =
    useCallback(
      (newType) => {
        setType(newType);
        setFields(emptyFields());
        setContent('');
        setPreset(0);
        setCopied(false);
      },
      []
    );

  const handlePreset =
    useCallback(
      (index) => {
        const selected =
          PRESETS[index];

        setPreset(index);
        setFg(selected.fg);
        setBg(selected.bg);
      },
      []
    );

  const handleDownload =
    useCallback(
      async (format) => {
        const url =
          buildQRImageUrl(
            content,
            {
              fg,
              bg,
              ecc,
              size,
              format,
            }
          );

        if (!url) return;

        setDownloading(true);

        try {
          const response =
            await fetch(url);

          if (!response.ok) {
            throw new Error(
              'Download failed'
            );
          }

          const blob =
            await response.blob();

          const objectUrl =
            URL.createObjectURL(blob);

          const anchor =
            document.createElement('a');

          anchor.href =
            objectUrl;

          anchor.download =
            `qr-${type.toLowerCase()}.${format}`;

          document.body.appendChild(
            anchor
          );

          anchor.click();

          anchor.remove();

          URL.revokeObjectURL(
            objectUrl
          );
        } catch {
          window.open(
            url,
            '_blank',
            'noopener,noreferrer'
          );
        } finally {
          setDownloading(false);
        }
      },
      [
        content,
        fg,
        bg,
        ecc,
        size,
        type,
      ]
    );

  const handleCopyUrl =
    useCallback(
      async () => {
        if (!qrImageUrl) return;

        try {
          await navigator.clipboard.writeText(
            qrImageUrl
          );

          setCopied(true);

          setTimeout(() => {
            setCopied(false);
          }, 2200);
        } catch {
          // Clipboard unavailable.
        }
      },
      [qrImageUrl]
    );

  /* ═══════════════════════════════════════════════════════════════
     RENDER
  ═══════════════════════════════════════════════════════════════ */

  return (
    <div
      className="qr-app px-4 py-4 sm:px-6 sm:py-6 lg:px-8"
      style={{
        fontFamily: SANS,
      }}
    >
      {/* ═══════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════ */}

      <header className="max-w-[1180px] mx-auto mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-[14px] flex items-center justify-center"
              style={{
                background:
                  'linear-gradient(145deg, #171C1C, #0D1010)',
                border:
                  '1px solid #2A3331',
                boxShadow:
                  '0 10px 30px rgba(0,0,0,.3)',
              }}
            >
              <QRLogo
                size={26}
                accent={ACC}
              />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1
                  className="text-[16px] font-semibold tracking-tight text-[#F2F5F4]"
                  style={{
                    fontFamily: MONO,
                  }}
                >
                  QR Studio
                </h1>

                <span
                  className="px-1.5 py-0.5 rounded-md text-[8px] font-medium uppercase tracking-wider"
                  style={{
                    color: '#03120D',
                    background: ACC,
                    fontFamily: MONO,
                    boxShadow:
                      '0 0 15px rgba(0,200,150,.12)',
                  }}
                >
                  Pro
                </span>
              </div>

              <p className="text-[11px] text-[#596260] mt-0.5">
                Create beautiful, production-ready QR codes.
              </p>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#101313] border border-[#222929]">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  background: ACC,
                  boxShadow:
                    `0 0 8px ${ACC}`,
                }}
              />

              <span
                className="text-[9px] text-[#697371] uppercase tracking-wider"
                style={{
                  fontFamily: MONO,
                }}
              >
                System online
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          WORKSPACE
      ═══════════════════════════════════════════════════════════ */}

      <main className="max-w-[1180px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-[390px_minmax(0,1fr)] gap-4 items-start">

          {/* LEFT */}
          <div className="min-w-0">
            <TypeSelector
              value={type}
              onChange={
                handleTypeChange
              }
            />

            <Panel className="p-4 mb-3">
              <SectionTitle
                eyebrow="01 / Content"
                title={`Create ${type} QR`}
                description={
                  QR_TYPES.find(
                    (item) =>
                      item.id === type
                  )?.description
                }
                right={
                  hasContent ? (
                    <span
                      className="text-[9px] text-[#596260]"
                      style={{
                        fontFamily: MONO,
                      }}
                    >
                      {content.length} chars
                    </span>
                  ) : null
                }
              />

              <TypeForm
                fields={fields}
                onChange={setFields}
                invalid={invalid}
              />

              {hasContent && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-[#0C1110] border border-[#1D2825]">
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{
                      background:
                        'rgba(0,200,150,.09)',
                      color: ACC,
                    }}
                  >
                    <Icon
                      name="ti-check"
                      size={12}
                    />
                  </div>

                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-[#A8B1AE]">
                      Content ready
                    </p>

                    <p
                      className="text-[9px] text-[#596260] truncate"
                      style={{
                        fontFamily: MONO,
                      }}
                    >
                      {content}
                    </p>
                  </div>
                </div>
              )}
            </Panel>

            <Customizer
              fg={fg}
              bg={bg}
              ecc={ecc}
              size={size}
              preset={preset}
              onFgChange={(value) => {
                setFg(value);
                setPreset(-1);
              }}
              onBgChange={(value) => {
                setBg(value);
                setPreset(-1);
              }}
              onEccChange={setEcc}
              onSizeChange={setSize}
              onPresetChange={
                handlePreset
              }
            />
          </div>

          {/* RIGHT */}
          <div className="min-w-0 lg:sticky lg:top-5">
            <Panel className="overflow-hidden mb-3">
              {/* Preview Header */}
              <div className="px-4 py-3.5 border-b border-[#202626] flex items-center justify-between bg-[#101313]">
                <div>
                  <div
                    className="text-[9px] uppercase tracking-[.15em] text-[#596260]"
                    style={{
                      fontFamily: MONO,
                    }}
                  >
                    02 / Preview
                  </div>

                  <p className="text-xs font-medium text-[#C8CFCD] mt-0.5">
                    Live QR canvas
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className="px-2 py-1 rounded-lg bg-[#181D1D] border border-[#252C2C] text-[9px] text-[#79827F]"
                    style={{
                      fontFamily: MONO,
                    }}
                  >
                    {type}
                  </span>

                  <span
                    className="px-2 py-1 rounded-lg text-[9px] font-medium"
                    style={{
                      background:
                        'rgba(0,200,150,.08)',
                      border:
                        '1px solid rgba(0,200,150,.12)',
                      color: '#6BBDA8',
                      fontFamily: MONO,
                    }}
                  >
                    {size}px
                  </span>
                </div>
              </div>

              <QRPreview
                qrUrl={qrImageUrl}
                bg={bg}
                size={size}
                scanning={scanning}
              />

              {hasContent && (
                <StatusBar
                  content={content}
                  size={size}
                  ecc={ecc}
                />
              )}

              <ActionBar
                disabled={!hasContent}
                downloading={downloading}
                onDownloadPng={() =>
                  handleDownload('png')
                }
                onDownloadSvg={() =>
                  handleDownload('svg')
                }
                onCopyUrl={
                  handleCopyUrl
                }
                copied={copied}
              />
            </Panel>

            <QualityCard
              ecc={ecc}
            />

            {/* Feature cards */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                {
                  icon: 'ti-bolt',
                  title: 'Instant',
                  text: 'Live preview',
                },
                {
                  icon: 'ti-shield-check',
                  title: 'Reliable',
                  text: `${ecc} correction`,
                },
                {
                  icon: 'ti-printer',
                  title: 'Print ready',
                  text: `${size}px output`,
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="bg-[#101313] border border-[#222929] rounded-xl p-3"
                >
                  <div className="text-[#596260]">
                    <Icon
                      name={item.icon}
                      size={14}
                    />
                  </div>

                  <p className="text-[10px] font-semibold text-[#AAB2AF] mt-2">
                    {item.title}
                  </p>

                  <p className="text-[9px] text-[#596260] mt-0.5">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-[1180px] mx-auto mt-6 pb-2">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[9px] text-[#424B49]">
          <span
            style={{
              fontFamily: MONO,
            }}
          >
            QR STUDIO · DARK EDITION
          </span>

          <span>
            Test your QR before publishing or printing.
          </span>
        </div>
      </footer>
    </div>
  );
}
