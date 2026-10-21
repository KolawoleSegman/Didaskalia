/** The Didaskalia mark: an open book with a lamp flame above it (“Thy word is a lamp unto my feet”). */
export default function Logo({ size = 32, tile = true }: { size?: number; tile?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" role="img" aria-label="Didaskalia" className="shrink-0">
      {tile && (
        <>
          <defs>
            <linearGradient id="dl-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#2b2417" />
              <stop offset="1" stopColor="#14110d" />
            </linearGradient>
          </defs>
          <rect width="64" height="64" rx="15" fill="url(#dl-bg)" />
          <rect x="1.5" y="1.5" width="61" height="61" rx="13.5" fill="none" stroke="#c6a15a" strokeOpacity="0.45" strokeWidth="1.5" />
        </>
      )}
      <path d="M32 9c4.6 5 7.2 8.6 7.2 12.4a7.2 7.2 0 0 1-14.4 0C24.8 17.6 27.4 14 32 9Z" fill="#e6c27a" />
      <path d="M32 17.5c1.9 2.2 3 3.7 3 5.3a3 3 0 0 1-6 0c0-1.6 1.1-3.1 3-5.3Z" fill="#14110d" fillOpacity="0.55" />
      <path d="M31 33.5c-5.4-3.6-12.6-4.4-20-3.3v19.6c7.4-1.1 14.6-.3 20 3.3V33.5Z" fill="#c6a15a" />
      <path d="M33 33.5c5.4-3.6 12.6-4.4 20-3.3v19.6c-7.4-1.1-14.6-.3-20 3.3V33.5Z" fill="#e6c27a" />
      <path d="M32 34v18.6" stroke="#14110d" strokeOpacity="0.5" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
