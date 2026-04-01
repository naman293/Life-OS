'use client';

import React from 'react';

export function RobotLogo({ size = 48, className = '' }: { size?: number, className?: string }) {
  return (
    <div 
      className={`robot-logo-container ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-block',
        position: 'relative',
        cursor: 'pointer'
      }}
    >
      <style>{`
        .robot-logo-container .robot-eye {
          transition: transform 0.1s cubic-bezier(0.4, 0, 0.2, 1);
          transform-origin: center;
        }
        /* Cute double blink on hover */
        .robot-logo-container:hover .robot-eye {
          animation: cuteBlink 1.2s infinite;
        }
        @keyframes cuteBlink {
          0%, 20%, 50%, 100% { transform: scaleY(1); }
          5%, 15% { transform: scaleY(0.1); }
        }
        /* Bobbing head on hover */
        .robot-logo-container:hover .robot-head-group {
          animation: gentleBob 1.5s ease-in-out infinite alternate;
          transform-origin: bottom center;
        }
        @keyframes gentleBob {
          0%   { transform: translateY(0px) rotate(0deg); }
          100% { transform: translateY(1.5px) rotate(1deg); }
        }
        /* Antenna glowing pulse */
        .robot-logo-container:hover .robot-antenna-tip {
          fill: #C2F0D3;
          stroke-width: 5;
        }
        .robot-antenna-tip {
          transition: all 0.2s ease;
        }
      `}</style>
      
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ overflow: 'visible' }}
      >
        <g className="robot-head-group">
          {/* Ears */}
          <rect x="14" y="44" width="16" height="30" rx="8" fill="#121210" />
          <rect x="70" y="44" width="16" height="30" rx="8" fill="#121210" />
          
          {/* Antenna Stem */}
          <path d="M50 32 L50 14" stroke="#121210" strokeWidth="6" strokeLinecap="round" />
          
          {/* Antenna Tip */}
          <circle cx="50" cy="11" r="6" fill="#A8D8B9" stroke="#121210" strokeWidth="4" className="robot-antenna-tip" />
          
          {/* Main Face */}
          <rect x="23" y="28" width="54" height="54" rx="18" fill="#EDE5D4" stroke="#121210" strokeWidth="6" />
          
          {/* Cute Eyes (Visible in center) */}
          <circle cx="38" cy="53" r="4.5" fill="#121210" className="robot-eye" style={{ transformOrigin: '38px 53px' }}/>
          <circle cx="62" cy="53" r="4.5" fill="#121210" className="robot-eye" style={{ transformOrigin: '62px 53px' }}/>
        </g>
      </svg>
    </div>
  );
}
