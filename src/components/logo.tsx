import React from "react";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export default function Logo({ className = "", size = "md" }: LogoProps) {
  const sizes = {
    sm: {
      text: "text-xl",
      badge: "text-[9px] px-1 py-0.5 tracking-[0.2em] rounded"
    },
    md: {
      text: "text-2xl md:text-3xl",
      badge: "text-[10px] px-1.5 py-0.5 tracking-[0.25em] rounded"
    },
    lg: {
      text: "text-4xl md:text-5xl",
      badge: "text-xs px-2.5 py-1 tracking-[0.3em] rounded-md"
    }
  };

  return (
    <div className={`flex items-center gap-2 font-display select-none ${className}`}>
      <span className="font-black tracking-widest bg-gradient-to-r from-primary via-amber-200 to-primary bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(212,175,55,0.15)] leading-none">
        TROIA
      </span>
      <span className={`font-black uppercase text-foreground bg-accent border border-accent/20 leading-none shadow-[0_0_8px_rgba(185,28,28,0.3)] ${sizes[size].badge}`}>
        Lounge
      </span>
    </div>
  );
}
