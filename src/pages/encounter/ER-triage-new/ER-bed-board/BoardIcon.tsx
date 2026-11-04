import React from 'react';

type BoardIconProps = {
  name: string;
};

const BoardIcon = ({ name }: BoardIconProps) => {
  const paths: Record<string, React.ReactNode> = {
    bed: (
      <>
        <path d="M3 18v-9m18 9v-7M3 15h18M3 10h7V6H5a2 2 0 0 0-2 2m7 1h8a3 3 0 0 1 3 3" />
        <path d="M3 18v2m18-2v2" />
      </>
    ),
    check: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    pulse: <path d="M3 12h4l3-8 4 16 3-8h4" />,
    clock: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2" />
      </>
    ),
    lab: (
      <>
        <path d="M9 3h6m-5 0v7l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3M8 15h8" />
        <path d="M10 18h.01m4-1h.01" />
      </>
    ),
    scan: (
      <>
        <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10" />
        <rect x="7" y="7" width="10" height="10" rx="2" />
      </>
    ),
    search: (
      <>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 5 5" />
      </>
    ),
    refresh: (
      <>
        <path d="M20 7v5h-5M4 17v-5h5" />
        <path d="M6 6a8 8 0 0 1 13 3M5 15a8 8 0 0 0 13 3" />
      </>
    ),
    expand: <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />,
    alert: (
      <>
        <path d="m10 4-8 14a2 2 0 0 0 2 3h16a2 2 0 0 0 2-3L14 4a2 2 0 0 0-4 0Z" />
        <path d="M12 9v4m0 4h.01" />
      </>
    ),
    doctor: (
      <>
        <path d="M6 3v5a5 5 0 0 0 10 0V3M4 3h4m6 0h4m-7 10v3a5 5 0 0 0 10 0v-2" />
        <circle cx="21" cy="11" r="2" />
      </>
    ),
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    shield: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    )
  };

  return (
    <svg
      className="ebb-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] ?? paths.pulse}
    </svg>
  );
};

export default BoardIcon;
