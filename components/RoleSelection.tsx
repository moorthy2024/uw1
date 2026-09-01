"use client";
import Image from "next/image";
import { ChevronRight } from "lucide-react";
const qbeLogo = "/assets/qbe-logo.png";

interface RoleSelectionProps {
  onSelectRole: () => void;
}

export function RoleSelection({ onSelectRole }: RoleSelectionProps) {
  return (
    <div className="h-screen relative overflow-hidden flex flex-col select-none" style={{ backgroundColor: "#FFFFFF" }}>

      {/* ── Dot grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, #C5D5E8 1px, transparent 1px)",
          backgroundSize: "24px 24px",
          opacity: 0.45,
        }}
      />

      {/* ── Soft radial glow — top-right ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -120, right: -120,
          width: 600, height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(0,118,188,0.07) 0%, transparent 70%)",
        }}
      />

      {/* ── Thin flowing data lines ── */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
        style={{ opacity: 0.055 }}
      >
        {/* Long sweeping horizontal lines */}
        <path d="M-20,220 C200,195 420,255 680,215 C880,185 1100,240 1460,205" fill="none" stroke="#0076BC" strokeWidth="1.2" />
        <path d="M-20,310 C180,290 400,340 650,305 C850,278 1050,328 1460,295" fill="none" stroke="#0076BC" strokeWidth="0.8" />
        <path d="M-20,480 C260,455 500,510 760,475 C960,448 1160,498 1460,465" fill="none" stroke="#00205B" strokeWidth="1" />
        {/* Vertical accent lines */}
        <path d="M340,-10 C330,180 355,360 340,560" fill="none" stroke="#0076BC" strokeWidth="0.8" />
        <path d="M1080,-10 C1065,150 1090,320 1075,520" fill="none" stroke="#0076BC" strokeWidth="0.7" />
        {/* Junction dots */}
        <circle cx="340" cy="215" r="2.5" fill="#0076BC" />
        <circle cx="680" cy="215" r="2" fill="#0076BC" />
        <circle cx="1080" cy="305" r="2" fill="#0076BC" />
        <circle cx="760" cy="475" r="2.5" fill="#00205B" />
      </svg>

      {/* ── Bottom wave stack ── */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: 300 }}>
        <svg viewBox="0 0 1440 300" preserveAspectRatio="none" className="w-full h-full">
          <path
            d="M0,160 C120,130 260,180 420,150 C580,120 700,165 880,140 C1040,118 1180,158 1320,135 C1380,124 1420,142 1440,138 L1440,300 L0,300 Z"
            fill="#EBF5FB"
          />
          <path
            d="M0,190 C150,165 300,205 500,178 C680,154 820,198 1020,170 C1160,150 1300,185 1440,165 L1440,300 L0,300 Z"
            fill="#C8DFF2"
          />
          <path
            d="M0,218 C180,198 360,228 580,206 C760,188 940,222 1120,200 C1260,184 1380,210 1440,200 L1440,300 L0,300 Z"
            fill="#0076BC"
            opacity="0.45"
          />
          <path
            d="M0,242 C200,226 400,252 640,232 C820,216 1020,246 1220,226 C1340,215 1410,236 1440,228 L1440,300 L0,300 Z"
            fill="#0076BC"
            opacity="0.75"
          />
          <path
            d="M0,265 C240,252 460,272 720,258 C920,247 1120,268 1340,256 C1400,252 1430,262 1440,258 L1440,300 L0,300 Z"
            fill="#00205B"
          />
        </svg>
      </div>

      {/* ── Header — logo flush left ── */}
      <div className="relative z-10 flex items-center px-10 pt-7 flex-shrink-0" style={{ paddingBottom: 25 }}>
        <div className="flex items-center gap-3">
          <Image src={qbeLogo} alt="QBE" width={32} height={32} className="w-8 h-8" />
          <div className="w-px h-5 bg-gray-200" />
          <span className="text-[12px] font-semibold uppercase tracking-[0.14em]" style={{ color: "#94A3B8" }}>
            QBE Underwriting HUB
          </span>
        </div>
      </div>

      {/* ── Centre content ── */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center px-10"
        style={{ paddingBottom: 220 }}
      >
        <div className="w-full max-w-[900px] flex items-start gap-16">

          {/* Left — brand copy */}
          <div className="flex-1 min-w-0">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.28em] mb-4"
              style={{ color: "#0096C7" }}
            >
              Welcome to
            </p>
            <h1
              className="font-extrabold leading-[1.06] mb-5"
              style={{ fontSize: "clamp(2.6rem, 4vw, 3.4rem)", color: "#00205B", letterSpacing: "-1.5px" }}
            >
              QBE Underwriting<br /><span style={{ fontSize: "clamp(0.7rem, 1.1vw, 0.9rem)", fontWeight: 500, letterSpacing: "-0.2px", color: "#0076BC" }}>Human Expertise &bull; Unified Intelligence &bull; Better Decisions (HUB)</span>
            </h1>
            <div className="w-8 h-[2.5px] rounded-full mb-5" style={{ backgroundColor: "#0076BC" }} />
            <p className="text-[15px] font-medium mb-3" style={{ color: "#3D5A80" }}>
              NAO Commercial Property – Commercial Property Lines
            </p>
            <p className="text-[13.5px] leading-[1.7] max-w-[300px]" style={{ color: "#6B81A0" }}>
              AI-powered underwriting intelligence, built around underwriters.
            </p>
          </div>

          {/* Right — login card */}
          <div className="flex-shrink-0" style={{ width: 388 }}>
            <div
              className="bg-white rounded-2xl"
              style={{
                padding: "36px 36px 32px",
                boxShadow: "0 4px 6px rgba(0,32,91,0.04), 0 20px 60px rgba(0,32,91,0.10)",
                border: "1px solid rgba(0, 118, 188, 0.12)",
              }}
            >
              {/* Card logo row */}
              <div className="flex items-center gap-2 mb-8">
                <Image src={qbeLogo} alt="QBE" width={24} height={24} className="w-6 h-6" />
                <span
                  className="text-[10px] font-bold uppercase tracking-[0.18em]"
                  style={{ color: "#B0BEC5" }}
                >
                  QBE North America
                </span>
              </div>

              {/* Heading */}
              <h2
                className="font-bold mb-1"
                style={{ fontSize: 22, color: "#0D1B2E", letterSpacing: "-0.4px" }}
              >
                Let&apos;s get started
              </h2>
              <p className="text-[13px] mb-7" style={{ color: "#6B7280" }}>
                Sign in to continue to your workspace
              </p>

              {/* Sign-in button */}
              <button
                onClick={onSelectRole}
                className="w-full flex items-center gap-3 rounded-xl transition-all duration-150 group text-left"
                style={{
                  padding: "13px 15px",
                  border: "1.5px solid #E2EAF4",
                  backgroundColor: "#F8FBFF",
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = "#0076BC";
                  el.style.backgroundColor = "#F2F8FE";
                  el.style.boxShadow = "0 4px 20px rgba(0,118,188,0.13)";
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.borderColor = "#E2EAF4";
                  el.style.backgroundColor = "#F8FBFF";
                  el.style.boxShadow = "none";
                }}
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #E8F3FB, #D0E8F7)" }}
                >
                  <svg
                    width="17" height="17" viewBox="0 0 24 24"
                    fill="none" stroke="#0076BC" strokeWidth="1.8" strokeLinecap="round"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4.5 20c0-3.8 3.4-6.5 7.5-6.5s7.5 2.7 7.5 6.5" />
                  </svg>
                </div>

                {/* Name / role */}
                <div className="flex-1 min-w-0">
                  <div className="text-[13.5px] font-semibold" style={{ color: "#0D1B2E" }}>
                    Sign in as Mike Farrell
                  </div>
                  <div className="text-[11.5px]" style={{ color: "#6B7280" }}>
                    Underwriter · Commercial Property
                  </div>
                </div>

                <ChevronRight
                  className="w-4 h-4 flex-shrink-0 transition-colors duration-150"
                  style={{ color: "#C0CEDC" }}
                />
              </button>

            </div>
          </div>
        </div>
      </div>

    </div>
  );
}


