import React from 'react';

export default function Footer({ onOpenPolicy, onOpenAdmin }) {
  return (
    <footer class="bg-[#40020D] text-white pt-6 sm:pt-8 border-t border-[#660417] relative overflow-hidden">
      
      {/* Background Accent Blur */}
      <div class="absolute -bottom-10 -right-10 w-96 h-96 bg-[#80081F]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div style={{ maxWidth: '1300px' }} class="w-full mx-auto px-4 sm:px-6 lg:px-8 pb-6 relative z-10">
        
        {/* Main Footer Content */}
        <div class="grid grid-cols-1 md:grid-cols-12 gap-5 lg:gap-6 items-center">
          
          {/* Column 1: Gulmohar Logo */}
          <div class="md:col-span-3 lg:col-span-2 flex flex-col items-center md:items-start text-center md:text-left flex-shrink-0">
            <a href="#home" class="block">
              <img 
                src="/assets/images/gulmohar-city-footer-logo.png" 
                alt="Gulmohar City" 
                class="h-16 sm:h-20 w-auto object-contain"
              />
            </a>
          </div>

          {/* Column 2: Site Address */}
          <div class="md:col-span-4 lg:col-span-5 flex items-start sm:items-center gap-2 sm:gap-2.5">
            <div class="w-7 sm:w-10 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
              <i class="fa-solid fa-location-dot text-amber-400 text-xl sm:text-2xl"></i>
            </div>
            <div>
              <span class="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-0.5">Site Address</span>
              <p class="text-[11px] lg:text-xs text-pink-100 font-medium leading-normal xl:whitespace-nowrap">
                Malthan Village, Shikrapur – Malthan Road, Tal. Shirur, Dist. Pune
              </p>
            </div>
          </div>

          {/* Column 3: Office Address with House Deal Logo */}
          <div class="md:col-span-5 lg:col-span-5 flex items-start sm:items-center gap-2 sm:gap-2.5">
            <div class="w-7 sm:w-10 flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0">
              <img 
                src="/assets/images/House-Deal-Footer.png?v=2" 
                alt="House Deal" 
                class="h-8 sm:h-11 w-auto object-contain max-w-full"
              />
            </div>
            <div>
              <span class="text-[10px] font-bold text-pink-300 uppercase tracking-wider block mb-0.5">Office Address</span>
              <p class="text-[11px] lg:text-xs text-pink-100 font-medium leading-normal xl:whitespace-nowrap">
                1107, RTC Silver, Upper Kharadi, Wagholi, Pune, 412207
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* Bottom Strip (White Background) */}
      <div class="bg-white border-t border-gray-200 text-gray-700 min-h-[48px] h-12 sm:h-14 flex items-center relative z-10">
        <div style={{ maxWidth: '1300px' }} class="w-full mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-[11px] sm:text-xs gap-2 text-center sm:text-left font-medium">
          
          {/* Copyright & Legal Links separated by pipes */}
          <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] sm:text-xs text-gray-600">
            <span>© 2026 Gulmohar City. All Rights Reserved.</span>
            <span class="text-gray-300">|</span>
            <button 
              onClick={() => onOpenPolicy && onOpenPolicy('privacy')}
              class="text-[#B30E2E] hover:text-[#8A0B22] font-semibold hover:underline transition cursor-pointer"
            >
              Privacy Policy
            </button>
            <span class="text-gray-300">|</span>
            <button 
              onClick={() => onOpenPolicy && onOpenPolicy('disclaimer')}
              class="text-[#B30E2E] hover:text-[#8A0B22] font-semibold hover:underline transition cursor-pointer"
            >
              Disclaimer
            </button>
          </div>

        </div>
      </div>
    </footer>
  );
}
