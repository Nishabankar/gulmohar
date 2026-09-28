import React from 'react';

export default function MidBanner() {
  return (
    <section class="py-10 bg-gradient-to-r from-[#FFF5F6] via-[#EBF5F0] to-[#FFF5F6] border-y border-[#FCD6DC]">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex flex-col md:flex-row items-center justify-between gap-6">
          
          <div class="text-center md:text-left">
            <h3 class="text-2xl sm:text-3xl font-serif font-bold text-[#8A0B22]">
              Nature Today <span class="block md:inline font-normal italic text-gray-700">A Brighter Tomorrow</span>
            </h3>
          </div>

          <div class="flex items-center space-x-6 sm:space-x-12">
            
            <div class="text-center">
              <div class="w-12 h-12 rounded-full bg-white text-[#B30E2E] mx-auto flex items-center justify-center shadow-md mb-2">
                <i class="fa-solid fa-leaf text-xl"></i>
              </div>
              <span class="text-xs font-semibold text-gray-800">Live Green</span>
            </div>

            <div class="text-center">
              <div class="w-12 h-12 rounded-full bg-white text-[#B30E2E] mx-auto flex items-center justify-center shadow-md mb-2">
                <i class="fa-solid fa-people-roof text-xl"></i>
              </div>
              <span class="text-xs font-semibold text-gray-800">Grow Together</span>
            </div>

            <div class="text-center">
              <div class="w-12 h-12 rounded-full bg-white text-[#B30E2E] mx-auto flex items-center justify-center shadow-md mb-2">
                <i class="fa-solid fa-house-flag text-xl"></i>
              </div>
              <span class="text-xs font-semibold text-gray-800">Build Your Future</span>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
