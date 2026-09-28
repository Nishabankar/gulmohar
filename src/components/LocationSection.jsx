import React from 'react';

export default function LocationSection({ onOpenLightbox }) {
  const connectivity = [
    { title: 'Pune City', time: '45 Mins', icon: 'fa-building-user' },
    { title: 'Shikrapur', time: '10 Mins', icon: 'fa-bus' },
    { title: 'Ranjangaon MIDC', time: '10 Mins', icon: 'fa-industry' },
    { title: 'Chakan MIDC', time: '20 Mins', icon: 'fa-building-flag' },
    { title: 'Pune International Airport', time: '35 Mins', icon: 'fa-plane' },
    { title: 'Malthan Gaon', time: '5 Mins', icon: 'fa-location-dot' },
    { title: 'Shirur City', time: '15 Mins', icon: 'fa-city' },
    { title: 'Rajgurunagar', time: '25 Mins', icon: 'fa-route' },
  ];

  return (
    <section id="location" class="min-h-[calc(100vh-80px)] flex flex-col justify-center py-4 sm:py-5 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      <div style={{ maxWidth: '1300px' }} class="w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 my-auto">
        
        {/* Section Header Title */}
        <div class="text-center max-w-3xl mx-auto mb-4 sm:mb-5">
          <span class="inline-flex items-center space-x-1.5 text-[#B30E2E] font-bold text-[10px] sm:text-xs uppercase tracking-widest bg-[#FFF0F2] px-2.5 py-0.5 rounded-full border border-[#FCD6DC]">
            <i class="fa-solid fa-location-dot text-[9px]"></i>
            <span>STRATEGIC LOCATION & CONNECTIVITY</span>
          </span>
          <h2 class="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-gray-900 mt-1 leading-tight sm:whitespace-nowrap">
            Prime Location with <span class="text-[#B30E2E]">Seamless Connectivity</span>
          </h2>
          <div class="w-12 h-1 bg-[#B30E2E] rounded-full mx-auto mt-1"></div>
        </div>

        {/* 2-Column Balanced Layout */}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 lg:gap-5 items-stretch">
          
          {/* Left Column: Route Map Showcase with Google Maps CTA inside Card */}
          <div class="lg:col-span-6 flex flex-col justify-center">
            <div class="group relative bg-white rounded-2xl border border-gray-200 shadow-lg hover:shadow-xl transition duration-300 overflow-hidden pb-2.5">
              
              {/* Clickable Image Container (Opens Lightbox Zoom) */}
              <div 
                onClick={() => onOpenLightbox('/assets/images/gulmohar-city-map.png', 'Gulmohar City Location & Route Map')}
                class="overflow-hidden rounded-t-2xl bg-slate-50 w-full cursor-pointer h-[250px] sm:h-[270px] flex items-center justify-center"
              >
                <img 
                  src="/assets/images/gulmohar-city-map.png" 
                  alt="Gulmohar City Location Route Map" 
                  class="w-full h-full object-fill block transform group-hover:scale-[1.01] transition duration-500" 
                />
              </div>

              {/* Bottom Google Maps Button Strip INSIDE the Card - Centered */}
              <div class="pt-2 flex items-center justify-center px-3">
                <a 
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noreferrer" 
                  class="inline-flex items-center justify-center space-x-1.5 bg-gradient-to-r from-[#0D5235] via-[#0A432B] to-[#073220] hover:from-[#093A25] hover:to-[#041D13] text-white font-bold text-xs px-3.5 py-1 rounded-full shadow-md hover:shadow-lg transition cursor-pointer border border-emerald-700/50 group/btn"
                >
                  <i class="fa-solid fa-map-location-dot text-amber-300 text-xs"></i>
                  <span>View on Google Maps</span>
                  <i class="fa-solid fa-arrow-up-right-from-square text-[10px] text-amber-300 group-hover/btn:translate-x-0.5 transition"></i>
                </a>
              </div>

            </div>
          </div>

          {/* Right Column: Key Travel Times Dashboard */}
          <div class="lg:col-span-6 flex flex-col justify-stretch">

            {/* Key Connectivity Travel Times Grid (2 Columns) */}
            <div class="bg-[#FFF5F6] p-3 sm:p-3.5 rounded-2xl border border-[#FCD6DC] space-y-2 shadow-md h-full flex flex-col justify-between">
              <div class="flex justify-between items-center border-b border-[#FCD6DC] pb-1.5">
                <h4 class="font-serif font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                  <i class="fa-solid fa-clock text-[#B30E2E] text-xs sm:text-sm"></i>
                  <span>Key Travel Connectivity Times</span>
                </h4>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 items-center">
                {connectivity.map((item, idx) => (
                  <div key={idx} class="bg-white p-2 sm:p-2.5 rounded-xl border border-pink-100 shadow-sm flex items-center justify-between hover:border-[#B30E2E] transition">
                    <div class="flex items-center space-x-2 min-w-0 pr-1">
                      <div class="w-7 h-7 rounded-lg bg-[#FFF0F2] text-[#B30E2E] flex items-center justify-center flex-shrink-0 text-xs">
                        <i class={`fa-solid ${item.icon}`}></i>
                      </div>
                      <span class="font-semibold text-xs sm:text-[13px] text-gray-800 truncate">{item.title}</span>
                    </div>
                    <span class="text-[#B30E2E] font-bold text-[10.5px] sm:text-xs whitespace-nowrap bg-[#FFF0F2] px-2 py-0.5 rounded-full border border-[#FCD6DC]">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
