// src/components/LoadingScreen.jsx
import { logoTancat } from "../assets/images/index.js";

export default function LoadingScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#121212",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 9999,
    }}>
      <img
        src={logoTancat}
        alt="TanCat Deportes"
        style={{
          width: 160, height: "auto",
          marginBottom: 28,
          filter: "brightness(0) invert(1)",
          opacity: 0.9,
        }}
      />
      <div style={{
        fontFamily: "DM Sans, sans-serif",
        fontSize: 13, color: "#6E6E6E",
        marginBottom: 16,
      }}>
        Conectando con Firebase...
      </div>
      <div style={{
        width: 180, height: 3,
        background: "rgba(255,255,255,0.08)",
        borderRadius: 2, overflow: "hidden",
      }}>
        <div style={{
          height: "100%", background: "#00C853",
          borderRadius: 2,
          animation: "loadbar 1.4s ease infinite",
        }} />
      </div>
      <style>{`
        @keyframes loadbar {
          0%   { width: 0% }
          60%  { width: 85% }
          100% { width: 100% }
        }
      `}</style>
    </div>
  );
}
