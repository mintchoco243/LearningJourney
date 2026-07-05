import React from "react";

// 1. Quá tệ: Mếu nhiều, lông mày buồn
export const IconTerrible = ({ size = 24, color = "currentColor", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Sad eyebrows */}
    <line x1="7" y1="10" x2="10" y2="8"></line>
    <line x1="17" y1="10" x2="14" y2="8"></line>
    {/* Eyes */}
    <line x1="9" y1="11" x2="9.01" y2="11"></line>
    <line x1="15" y1="11" x2="15.01" y2="11"></line>
    {/* Deep Frown */}
    <path d="M7 16 C 7 11 17 11 17 16"></path>
  </svg>
);

// 2. Không hài lòng: Mếu nhẹ
export const IconBad = ({ size = 24, color = "currentColor", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Slight Frown */}
    <path d="M8 15 Q 12 13 16 15"></path>
    {/* Eyes */}
    <line x1="9" y1="9" x2="9.01" y2="9"></line>
    <line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>
);

// 3. Bình thường: Nét ngang
export const IconNeutral = ({ size = 24, color = "currentColor", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Flat mouth */}
    <line x1="8" y1="15" x2="16" y2="15"></line>
    {/* Eyes */}
    <line x1="9" y1="9" x2="9.01" y2="9"></line>
    <line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>
);

// 4. Hài lòng: Mỉm cười nhẹ
export const IconGood = ({ size = 24, color = "currentColor", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Slight smile */}
    <path d="M8 14 Q 12 16 16 14"></path>
    {/* Eyes */}
    <line x1="9" y1="9" x2="9.01" y2="9"></line>
    <line x1="15" y1="9" x2="15.01" y2="9"></line>
  </svg>
);

// 5. Tuyệt vời: Cười to (miệng mở rông) và mắt cong vui vẻ
export const IconExcellent = ({ size = 24, color = "currentColor", ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {/* Big D-shaped smile (laughing) */}
    <path d="M7 14 C 7 19 17 19 17 14 Z" fill={color}></path>
    {/* Happy curved eyes ^^ */}
    <path d="M7 10 Q 9 7 10 10"></path>
    <path d="M14 10 Q 16 7 17 10"></path>
  </svg>
);
