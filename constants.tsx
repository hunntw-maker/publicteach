
import React from 'react';

export const SUBJECTS = ['國文', '英文', '數學', '社會', '自然', '科技', '體育', '藝術', '綜合'];

export const StartIcon = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <defs>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fbbf24" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#goldGrad)" strokeWidth="2" strokeDasharray="8 4" className="animate-[spin_10s_linear_infinite]" />
    <path d="M40 30 L70 50 L40 70 Z" fill="url(#goldGrad)" />
  </svg>
);

export const StopIcon = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <defs>
      <linearGradient id="rustGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#7f1d1d" />
      </linearGradient>
    </defs>
    <rect x="25" y="25" width="50" height="50" rx="4" fill="url(#rustGrad)" />
    <path d="M20 20 L35 20 M80 80 L65 80" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
  </svg>
);

export const LogoIcon = () => (
  <svg viewBox="0 0 24 24" className="w-8 h-8 text-amber-500 fill-current">
    <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
  </svg>
);
