// src/components/LoadingScreen.jsx
import "../styles/LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="loading-overlay">
      <div className="loading-logo">TC</div>
      <div className="loading-text">Conectando con Firebase...</div>
      <div className="loading-bar-bg">
        <div className="loading-bar" />
      </div>
    </div>
  );
}
