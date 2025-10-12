export default function FloatingParticles() {
  const particles = Array.from({ length: 8 }); // 8 particles

  return (
    <div className="absolute right-0 top-0 w-24 h-full flex flex-col justify-around items-center z-10 pointer-events-none">
      {particles.map((_, idx) => (
        <div
          key={idx}
          className={`w-3 h-3 bg-blue-400 rounded-full animate-float${idx % 3}`}
        />
      ))}
    </div>
  );
}
