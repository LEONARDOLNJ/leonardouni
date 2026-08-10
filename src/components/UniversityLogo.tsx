import React from "react";
import logoImg from "@/assets/images/university_logo_1786392188148.jpg";

interface LogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  className?: string;
}

export function UniversityLogo({ size = "md", showText = false, className = "" }: LogoProps) {
  const sizeClasses = {
    sm: "size-8",
    md: "size-11",
    lg: "size-14",
    xl: "size-20",
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div className={`relative overflow-hidden rounded-md border border-amber-500/30 shadow-sm bg-slate-900 ${sizeClasses[size]}`}>
        <img
          src={logoImg}
          alt="Leonardo University Crest"
          referrerPolicy="no-referrer"
          className="size-full object-cover"
        />
      </div>
      {showText && (
        <div>
          <p className="font-display text-base leading-tight font-bold text-primary tracking-tight">
            Leonardo University
          </p>
          <p className="text-[11px] text-muted-foreground font-medium">
            Gestão Financeira & Académica
          </p>
        </div>
      )}
    </div>
  );
}
