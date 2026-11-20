import React from 'react';
import { Headphones, Maximize, Volume2, Monitor, Clock } from 'lucide-react';

/**
 * MobileInfoScreen Component
 * 
 * Displayed exclusively to visitors on mobile and tablet devices.
 * Informs the visitor that this cinematic birthday experience is crafted
 * for laptop/PC screens with full visuals, audio and interactive animations.
 */
export default function MobileInfoScreen() {
  const instructions = [
    {
      id: 'buds',
      icon: <Headphones className="mobile-info-item-icon" size={26} />,
      title: 'Put on Your Buds',
      desc: 'For the best music and experience.'
    },
    {
      id: 'fullscreen',
      icon: <Maximize className="mobile-info-item-icon" size={26} />,
      title: 'Open in Full Screen Mode',
      desc: 'Press F11 (or Fn + F11) on your laptop.'
    },
    {
      id: 'volume',
      icon: <Volume2 className="mobile-info-item-icon" size={26} />,
      title: "Don't Turn Off Volume",
      desc: 'Keep the volume on for the complete experience.'
    },
    {
      id: 'patient',
      icon: <Clock className="mobile-info-item-icon" size={26} />,
      title: 'Be Patient',
      desc: 'Please be patient, because the experience includes music and sound effects throughout.'
    }
  ];

  return (
    <div className="mobile-info-screen-container" role="dialog" aria-modal="true" aria-label="Device Compatibility Notice">
      {/* Background with mountain nature cover.png preserving aspect ratio */}
      <div className="mobile-info-bg" style={{ backgroundImage: "url('/mobile-cover/mobile-cover.png')" }} />
      <div className="mobile-info-overlay" />

      {/* Main Content Modal Card */}
      <div className="mobile-info-content-card">
        {/* Subtle decorative top badge */}
        <div className="mobile-info-badge">
          <Monitor size={15} className="mobile-info-badge-icon" />
          <span>LAPTOP &amp; PC EXPERIENCE</span>
        </div>

        {/* Primary Heading */}
        <h1 className="mobile-info-title">
          Please Open This Website on a Laptop / PC
        </h1>

        {/* Supporting Message */}
        <p className="mobile-info-subtitle">
          "This experience is designed for a larger screen with the best visuals, animations and sound. ♡"
        </p>

        {/* Frosted Glass Instructions Card */}
        <div className="mobile-info-glass-panel">
          <div className="mobile-info-instructions-list">
            {instructions.map((item, idx) => (
              <div key={item.id} className="mobile-info-item">
                <div className="mobile-info-item-badge">
                  <div className="mobile-info-icon-glow">
                    {item.icon}
                  </div>
                  <span className="mobile-info-step-number">{idx + 1}</span>
                </div>
                <div className="mobile-info-item-text">
                  <h2 className="mobile-info-item-title">{item.title}</h2>
                  <p className="mobile-info-item-desc">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative footer flourish */}
        <div className="mobile-info-footer">
          <span className="mobile-footer-heart">♡</span>
          <span className="mobile-footer-text">See you on the big screen ✨</span>
          <span className="mobile-footer-heart">♡</span>
        </div>
      </div>
    </div>
  );
}
