
import React, { useEffect, useState } from 'react';

const COLORS = ['#ff6035', '#10b981', '#3b82f6', '#fbbf24', '#ffffff'];

export const Confetti: React.FC = () => {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const particleCount = 60;
    const newParticles = [];

    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        left: Math.random() * 100 + 'vw',
        animationDuration: Math.random() * 3 + 2 + 's',
        animationDelay: Math.random() * 2 + 's',
        backgroundColor: COLORS[Math.floor(Math.random() * COLORS.length)],
        width: Math.random() * 10 + 5 + 'px',
        height: Math.random() * 5 + 5 + 'px',
      });
    }

    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          className="confetti-piece"
          style={{
            left: p.left,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
            backgroundColor: p.backgroundColor,
            width: p.width,
            height: p.height,
          }}
        />
      ))}
    </div>
  );
};
