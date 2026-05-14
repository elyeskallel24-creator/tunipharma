import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";

type Phase = "entering" | "visible" | "exiting" | "done";

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>("entering");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("visible"), 200);
    const t2 = setTimeout(() => setPhase("exiting"), 1800);
    const t3 = setTimeout(() => setPhase("done"), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        opacity: phase === "exiting" ? 0 : 1,
        transform: phase === "exiting" ? "scale(1.04)" : "scale(1)",
        transition:
          phase === "exiting"
            ? "opacity 0.55s ease-in-out, transform 0.55s ease-in-out"
            : "none",
        pointerEvents: phase === "exiting" ? "none" : "all",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 400,
          height: 260,
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(0, 200, 150, 0.12) 0%, transparent 70%)",
          borderRadius: "50%",
          opacity: phase === "visible" ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      />
      <img
        src={logo}
        alt="TuniPharma"
        style={{
          height: "min(120px, 30vw)",
          width: "auto",
          objectFit: "contain",
          position: "relative",
          zIndex: 1,
          opacity: phase === "entering" ? 0 : 1,
          transform: phase === "entering" ? "scale(0.85)" : "scale(1)",
          transition:
            "opacity 0.5s cubic-bezier(0.23, 1, 0.32, 1), transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      />
      <p
        style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: "0.95rem",
          color: "rgba(10, 22, 40, 0.45)",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          position: "relative",
          zIndex: 1,
          margin: 0,
          opacity: phase === "visible" ? 1 : 0,
          transform: phase === "visible" ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.4s ease 0.1s, transform 0.4s ease 0.1s",
        }}
      >
        Votre pharmacie de confiance
      </p>
    </div>
  );
}
