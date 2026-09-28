import React from 'react';

// Realistic 5-Petal Gulmohar Blossom SVG Component
const GulmoharFlower = ({ className }) => (
  <svg viewBox="0 0 100 100" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="gulPetal1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF3B30" />
        <stop offset="60%" stopColor="#D31038" />
        <stop offset="100%" stopColor="#800016" />
      </linearGradient>
      <linearGradient id="gulPetal2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF7A00" />
        <stop offset="50%" stopColor="#E74C3C" />
        <stop offset="100%" stopColor="#B30E2E" />
      </linearGradient>
      <linearGradient id="gulCenterPetal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFD700" />
        <stop offset="35%" stopColor="#FF3B30" />
        <stop offset="100%" stopColor="#900C3F" />
      </linearGradient>
    </defs>
    <g transform="translate(50,50)">
      {/* 5 Distinct Gulmohar Flower Petals */}
      <path d="M0,0 C-14,-22 -18,-42 0,-45 C18,-42 14,-22 0,0" fill="url(#gulCenterPetal)" />
      <path d="M0,0 C22,-14 42,-18 45,0 C42,18 22,14 0,0" fill="url(#gulPetal1)" />
      <path d="M0,0 C14,22 18,42 0,45 C-18,42 -14,22 0,0" fill="url(#gulPetal2)" />
      <path d="M0,0 C-22,14 -42,18 -45,0 C-42,-18 -22,-14 0,0" fill="url(#gulPetal1)" />
      <path d="M0,0 C-25,-16 -32,-32 -14,-38 C0,-32 -8,-16 0,0" fill="url(#gulPetal2)" />

      {/* Characteristic Filament Stamens */}
      <line x1="0" y1="0" x2="-8" y2="-18" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="-8" cy="-18" r="2" fill="#B30E2E" />
      <line x1="0" y1="0" x2="8" y2="-18" stroke="#FFD700" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="-18" r="2" fill="#B30E2E" />
      <line x1="0" y1="0" x2="0" y2="-22" stroke="#FFE033" strokeWidth="2" strokeLinecap="round" />
      <circle cx="0" cy="-22" r="2.5" fill="#FF3B30" />

      {/* Flower Center */}
      <circle cx="0" cy="0" r="4" fill="#FFD700" />
    </g>
  </svg>
);

// Organic Curved Gulmohar Flower Petal SVG Component
const GulmoharPetal = ({ className }) => (
  <svg viewBox="0 0 60 80" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="singleGulPetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FF4D4D" />
        <stop offset="55%" stopColor="#D31038" />
        <stop offset="100%" stopColor="#7A0016" />
      </linearGradient>
    </defs>
    <path 
      d="M30,5 C46,5 56,20 52,45 C48,65 35,75 30,78 C25,75 12,65 8,45 C4,20 14,5 30,5 Z" 
      fill="url(#singleGulPetal)" 
      opacity="0.95"
    />
    {/* Subtle Vein Details */}
    <path d="M30,75 C30,45 30,20 30,12" stroke="#FFB3B3" strokeWidth="1" strokeLinecap="round" opacity="0.6" />
    <path d="M30,45 C38,38 44,32 46,28" stroke="#FFB3B3" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
    <path d="M30,45 C22,38 16,32 14,28" stroke="#FFB3B3" strokeWidth="0.8" strokeLinecap="round" opacity="0.4" />
  </svg>
);

export default function HeroBanner() {
  return (
    <section id="home" class="relative w-full sm:h-[calc(100vh-80px)] bg-white p-0 m-0 group flex flex-col justify-center overflow-hidden">
      
      {/* 1. Main Hero Image Container */}
      <a href="#contact" class="block w-full h-full cursor-pointer relative">
        <img 
          src="/assets/images/gulmohar-banner-image.png" 
          alt="Gulmohar City Premium Residential Plots Banner" 
          class="w-full h-auto sm:h-full object-cover sm:object-fill block border-0 transition-all duration-300"
        />

        {/* Subtle Dark Vignette Gradient Overlay */}
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>

        {/* 2. Falling Realistic Gulmohar Flowers & Petals Overlay */}
        <div class="absolute inset-0 pointer-events-none z-20 overflow-hidden">
          <GulmoharFlower className="absolute top-0 left-[8%] w-6 h-6 sm:w-9 sm:h-9 animate-petal-1 drop-shadow-md" />
          <GulmoharPetal className="absolute top-0 left-[22%] w-5 h-7 sm:w-7 sm:h-9 animate-petal-2 drop-shadow-md" />
          <GulmoharFlower className="absolute top-0 left-[38%] w-7 h-7 sm:w-10 sm:h-10 animate-petal-3 drop-shadow-md" />
          <GulmoharPetal className="absolute top-0 left-[52%] w-6 h-8 sm:w-8 sm:h-10 animate-petal-4 drop-shadow-md" />
          <GulmoharFlower className="absolute top-0 left-[68%] w-6 h-6 sm:w-8 sm:h-8 animate-petal-5 drop-shadow-md" />
          <GulmoharPetal className="absolute top-0 left-[82%] w-5 h-7 sm:w-7 sm:h-9 animate-petal-6 drop-shadow-md" />
          <GulmoharFlower className="absolute top-0 left-[92%] w-7 h-7 sm:w-9 sm:h-9 animate-petal-7 drop-shadow-md" />
          <GulmoharPetal className="absolute top-0 left-[44%] w-4 h-6 sm:w-6 sm:h-8 animate-petal-8 drop-shadow-md" />
        </div>

        {/* 3. Floating Continuous Pop Pre-Launch Offer Highlight Popup Badge */}
        <div class="absolute top-2 sm:top-5 md:top-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto whitespace-nowrap scale-[0.82] sm:scale-100 origin-top">
          <a 
            href="#contact"
            class="relative flex items-center gap-2.5 sm:gap-3.5 bg-white/95 backdrop-blur-md text-gray-900 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-2xl border-2 border-[#B30E2E] shadow-2xl animate-badge-pop transition-transform duration-300 hover:scale-105 group/badge cursor-pointer block"
          >
            {/* Pulsing Outer Ping Aura */}
            <span class="absolute -inset-1 rounded-2xl bg-[#B30E2E]/30 animate-ping opacity-75 pointer-events-none"></span>

            {/* Glowing Star Icon Circle */}
            <div class="relative flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 rounded-full bg-gradient-to-br from-[#B30E2E] via-[#D31038] to-[#8A0B22] text-amber-300 flex items-center justify-center font-extrabold shadow-md border-2 border-amber-300 animate-star-pulse">
              <i class="fa-solid fa-star text-amber-300 text-xs sm:text-base drop-shadow-sm"></i>
            </div>

            {/* Offer Details Text */}
            <div class="relative text-left">
              <div class="flex items-center gap-1 text-[10px] sm:text-xs font-black uppercase tracking-wider text-[#B30E2E]">
                <i class="fa-solid fa-fire text-[#B30E2E] text-[10px] sm:text-xs animate-bounce"></i>
                <span>Pre-Launch Offer</span>
                <i class="fa-solid fa-star text-[#B30E2E] text-[9px]"></i>
              </div>
              <div class="text-xs sm:text-base font-extrabold leading-tight text-gray-900 drop-shadow-sm">
                Plots @ <span class="text-[#B30E2E] font-black text-sm sm:text-lg">₹ 2.99 Lakh</span> Onwards
              </div>
              <div class="text-[9px] sm:text-[11px] text-[#0D5235] font-bold flex items-center gap-1">
                <span>⚡ Limited Period Offer</span>
                <span class="text-[#B30E2E] group-hover/badge:translate-x-0.5 transition font-bold">Book Now &rarr;</span>
              </div>
            </div>

            {/* Corner Decorative Star Sparkles */}
            <i class="fa-solid fa-sparkles absolute -top-2 -right-2 text-amber-500 text-xs sm:text-sm animate-pulse"></i>
            <i class="fa-solid fa-star absolute -bottom-1 -left-1 text-[#B30E2E] text-[10px] animate-spin-slow opacity-80"></i>
          </a>
        </div>

      </a>

    </section>
  );
}
