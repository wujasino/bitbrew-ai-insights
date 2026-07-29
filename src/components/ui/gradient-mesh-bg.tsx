import { memo } from "react";
import { cn } from "@/lib/utils";

export const GradientMeshBg = memo(function GradientMeshBg({
  children,
  className,
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <div id={id} className={cn("w-full relative", className)}>
      {/* ── blurred orbs ──────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden"
        aria-hidden="true"
      >
        {/* top-left purple orb */}
        <div
          className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full opacity-[0.18] dark:opacity-[0.28] blur-[120px]"
          style={{
            background: "radial-gradient(circle, #9F8CFF 0%, #7C5CFF 60%, transparent 100%)",
            animation: "orb1 18s ease-in-out infinite alternate",
          }}
        />
        {/* center-right azure orb */}
        <div
          className="absolute top-0 right-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.14] dark:opacity-[0.22] blur-[140px]"
          style={{
            background: "radial-gradient(circle, #4F8CFF 0%, #2F5CE0 60%, transparent 100%)",
            animation: "orb2 22s ease-in-out infinite alternate",
          }}
        />
        {/* bottom-center cyan accent */}
        <div
          className="absolute bottom-[-80px] left-[30%] w-[480px] h-[380px] rounded-full opacity-[0.10] dark:opacity-[0.20] blur-[120px]"
          style={{
            background: "radial-gradient(circle, #22D3EE 0%, #0EA5E9 60%, transparent 100%)",
            animation: "orb3 26s ease-in-out infinite alternate",
          }}
        />

        {/* subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <style>{`
        @keyframes orb1 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(60px, 40px) scale(1.12); }
        }
        @keyframes orb2 {
          from { transform: translate(0, 0) scale(1.05); }
          to   { transform: translate(-50px, 60px) scale(0.95); }
        }
        @keyframes orb3 {
          from { transform: translate(0, 0) scale(1); }
          to   { transform: translate(40px, -30px) scale(1.08); }
        }
      `}</style>

      {children}
    </div>
  );
});
