// src/components/LoadingScreen.jsx
export default function LoadingScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#0F1117",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      zIndex: 9999,
    }}>
      <div style={{
        width: 48, height: 48,
        borderRadius: 12,
        background: "#00C49A",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Inter, sans-serif",
        fontWeight: 700, fontSize: 18, color: "#002820",
        marginBottom: 20,
      }}>
        TC
      </div>
      <div style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 13, color: "#555C72",
        marginBottom: 18,
      }}>
        Conectando con Firebase...
      </div>
      <div style={{
        width: 140, height: 2,
        background: "rgba(255,255,255,0.06)",
        borderRadius: 2, overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          background: "#00C49A",
          borderRadius: 2,
          animation: "loadbar 1.4s ease infinite",
        }} />
      </div>
      <style>{`
        @keyframes loadbar {
          0%   { width: 0%;   }
          60%  { width: 80%;  }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
}
