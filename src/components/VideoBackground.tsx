export default function VideoBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Deep Obsidian Base */}
      <div className="absolute inset-0 bg-[#080c14]" />

      {/* Cyberpunk / Web3 Ambient Glowing Orbs */}
      <div className="absolute -top-[25%] -left-[10%] h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[140px]" />
      <div className="absolute top-[20%] -right-[15%] h-[650px] w-[650px] rounded-full bg-cyan-500/10 blur-[150px]" />
      <div className="absolute -bottom-[20%] left-[20%] h-[700px] w-[700px] rounded-full bg-teal-500/8 blur-[160px]" />

      {/* Futuristic Dot / Coordinate Grid */}
      <div
        className="absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            "radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Subtle Top Border Glow */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent" />
    </div>
  );
}
