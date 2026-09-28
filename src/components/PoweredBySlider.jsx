import React from 'react';

export default function PoweredBySlider() {
  const developers = [
    { name: 'Vastudhan Developers', logo: '/assets/images/Vastudhan_Developers.png', tag: 'Promoter' },
    { name: 'Shivalay Developers', logo: '/assets/images/Shivalay_Developers.png', tag: 'Developer' },
    { name: 'RK Developers', logo: '/assets/images/RK_Developers.png', tag: 'Developer' },
    { name: 'House Deal', logo: '/assets/images/House-Deal.png', tag: 'Partner' },
  ];

  // Quadruple array to ensure continuous smooth infinite marquee scroll
  const marqueeLogos = [...developers, ...developers, ...developers, ...developers];

  return (
    <section class="sm:min-h-[calc(100vh-80px-180px)] flex flex-col justify-center py-10 sm:py-14 bg-gradient-to-b from-white via-slate-50 to-white border-t border-gray-100 overflow-hidden">
      <div style={{ maxWidth: '1300px' }} class="w-full mx-auto px-4 sm:px-6 lg:px-8 mb-4 sm:mb-6">
        
        {/* Section Header */}
        <div class="text-center max-w-2xl mx-auto">
          <span class="inline-flex items-center space-x-1.5 text-[#B30E2E] font-bold text-[10px] sm:text-xs uppercase tracking-widest bg-[#FFF0F2] px-2.5 py-0.5 rounded-full border border-[#FCD6DC]">
            <i class="fa-solid fa-building text-[9px]"></i>
            <span>PROMOTERS & DEVELOPERS</span>
          </span>
          <h3 class="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-gray-900 mt-1">
            Powered By
          </h3>
          <div class="w-12 h-1 bg-[#B30E2E] rounded-full mx-auto mt-1"></div>
        </div>

      </div>

      {/* Infinite Auto-Sliding Logo Marquee Wrapper */}
      <div class="relative w-full overflow-hidden py-3 bg-white/60 backdrop-blur-sm border-y border-gray-200/80 shadow-inner">
        
        {/* Gradient Blur Overlay Masks for Smooth Left/Right Fading */}
        <div class="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none"></div>
        <div class="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none"></div>

        {/* Marquee Track */}
        <div class="animate-marquee flex items-center gap-4 sm:gap-6">
          {marqueeLogos.map((item, idx) => (
            <div 
              key={idx}
              class="flex-shrink-0 w-40 sm:w-48 h-20 sm:h-24 bg-white/80 backdrop-blur-sm p-3.5 rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md hover:border-[#B30E2E] transition-all duration-300 group flex items-center justify-center cursor-pointer"
            >
              <img 
                src={item.logo} 
                alt={item.name} 
                class="max-h-full max-w-full object-contain filter group-hover:scale-105 transition duration-300"
              />
            </div>
          ))}
        </div>

      </div>

    </section>
  );
}
