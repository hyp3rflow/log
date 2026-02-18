export default function AiGenBadge({ author }: { author: string }) {
  return (
    <span title={`AI Generated (${author})`} style={{ marginLeft: 6, display: "inline-flex", verticalAlign: "middle" }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* 4-point sparkle star */}
        <path
          d="M12 2L13.5 9.5L20 12L13.5 14.5L12 22L10.5 14.5L4 12L10.5 9.5L12 2Z"
          fill="url(#ai-grad)"
          opacity="0.85"
        />
        {/* small accent sparkle */}
        <path
          d="M19 2L19.5 4.5L22 5L19.5 5.5L19 8L18.5 5.5L16 5L18.5 4.5L19 2Z"
          fill="url(#ai-grad)"
          opacity="0.6"
        />
        <defs>
          <linearGradient id="ai-grad" x1="4" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
            <stop stopColor="#60A5FA" />
            <stop offset="1" stopColor="#A78BFA" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}
