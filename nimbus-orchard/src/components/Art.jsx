import { useId } from 'react'

const BODIES = {
  plum: { fill: '#7A3B69', shape: <circle cx="24" cy="31" r="15" /> },
  pear: {
    fill: '#AFC05E',
    shape: <path d="M24 14C19 14 18 20 19 24C13 28 11 34 13 40C16 48 32 48 35 40C37 34 35 28 29 24C30 20 29 14 24 14Z" />,
  },
  fig: {
    fill: '#5B3A5E',
    shape: <path d="M24 14C21 18 17 22 14 30C11 40 17 48 24 48C31 48 37 40 34 30C31 22 27 18 24 14Z" />,
  },
  currant: {
    fill: '#C23B4E',
    shape: (
      <>
        <circle cx="18" cy="27" r="7" />
        <circle cx="30" cy="29" r="7" />
        <circle cx="23" cy="39" r="7" />
      </>
    ),
  },
  grape: {
    fill: 'url(#GRAD)',
    shape: (
      <>
        <circle cx="18" cy="24" r="6.5" />
        <circle cx="30" cy="24" r="6.5" />
        <circle cx="24" cy="32" r="6.5" />
        <circle cx="16" cy="35" r="6" />
        <circle cx="32" cy="35" r="6" />
        <circle cx="24" cy="43" r="6" />
      </>
    ),
  },
  quince: {
    fill: '#E0B94A',
    shape: <path d="M24 16C33 15 40 22 39 32C38 42 31 47 24 47C15 47 9 41 10 31C11 22 16 16 24 16Z" />,
  },
}

export function Fruit({ kind, size = 44, label }) {
  const gradId = useId().replace(/:/g, '')
  const body = BODIES[kind]
  const fill = body.fill === 'url(#GRAD)' ? `url(#${gradId})` : body.fill
  return (
    <svg
      viewBox="0 0 48 52"
      width={size}
      height={(size * 52) / 48}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className="fruit-svg"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#B9D7E8" />
          <stop offset="0.5" stopColor="#D9B8DA" />
          <stop offset="1" stopColor="#9FD3C4" />
        </linearGradient>
      </defs>
      <path d="M24 3V17" stroke="#6B5537" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M24 9C29 3 36 5 39 7C34 12 28 12 24 9Z" fill="#5E8C4A" />
      <g fill={fill}>{body.shape}</g>
      <ellipse cx="18" cy="27" rx="3" ry="4.5" fill="#fff" opacity="0.32" />
    </svg>
  )
}

export function Cloud({ width = 220, className }) {
  return (
    <svg viewBox="0 0 220 110" width={width} className={className} aria-hidden="true">
      <g fill="var(--cloud)">
        <circle cx="62" cy="68" r="34" />
        <circle cx="108" cy="50" r="44" />
        <circle cx="158" cy="66" r="32" />
        <rect x="36" y="66" width="150" height="38" rx="19" />
      </g>
      <g fill="var(--cloud-shade)">
        <rect x="36" y="88" width="150" height="16" rx="8" />
      </g>
    </svg>
  )
}

export function Basket({ size = 120 }) {
  return (
    <svg viewBox="0 0 120 84" width={size} aria-hidden="true">
      <path d="M26 30C26 8 94 8 94 30" stroke="var(--wicker-dark)" strokeWidth="5" fill="none" strokeLinecap="round" />
      <path d="M8 30H112L100 78H20Z" fill="var(--wicker)" />
      <g stroke="var(--wicker-dark)" strokeWidth="2" opacity="0.55">
        <path d="M11 42H109" />
        <path d="M14 54H106" />
        <path d="M17 66H103" />
      </g>
      <rect x="4" y="26" width="112" height="8" rx="4" fill="var(--wicker-dark)" />
    </svg>
  )
}
