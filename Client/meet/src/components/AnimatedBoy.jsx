export default function AnimatedBoy() {
  return (
    <div className="absolute left-0 bottom-10 w-24 h-24 z-10">
      {/* Simple running boy SVG */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        className="w-full h-full animate-run"
      >
        <circle cx="32" cy="32" r="30" fill="#FFD700" />
        <rect x="28" y="20" width="8" height="20" fill="#FF6347" />
        <circle cx="32" cy="12" r="6" fill="#FFDEAD" />
        {/* Replace with detailed SVG if needed */}
      </svg>
    </div>
  );
}
