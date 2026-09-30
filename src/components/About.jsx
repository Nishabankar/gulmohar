import React from 'react';
import { CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from '../config';

export default function About() {
  const whyChooseUs = [
    {
      title: 'Direct Main Road Touch',
      desc: 'Prime & convenient location directly touching Shikrapur – Malthan Road.',
      icon: 'fa-road',
      tag: 'Road Touch'
    },
    {
      title: '24 Hours Water & Electricity',
      desc: 'Abundant pure water supply facility & continuous 24/7 power supply lines.',
      icon: 'fa-bolt',
      tag: '24/7 Utilities'
    },
    {
      title: 'High Future Growth & ROI',
      desc: 'Excellent returns on investment due to rapid regional growth & MIDC proximity.',
      icon: 'fa-chart-line',
      tag: 'High ROI'
    },
    {
      title: 'Lush Green & Peaceful Living',
      desc: 'Healthy, pollution-free lifestyle amidst serene natural green surroundings.',
      icon: 'fa-tree',
      tag: 'Nature'
    }
  ];

  return (
    <section id="about" class="sm:min-h-[calc(100vh-80px)] flex flex-col justify-center py-4 sm:py-5 bg-gradient-to-b from-white via-slate-50 to-white relative overflow-hidden">
      
      {/* Background Accent Blurs */}
      <div class="absolute -top-10 -left-10 w-72 h-72 bg-[#FCD6DC]/40 rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-10 -right-10 w-96 h-96 bg-[#EBF5F0]/50 rounded-full blur-3xl pointer-events-none"></div>

      <div style={{ maxWidth: '1300px' }} class="w-full mx-auto px-3 sm:px-6 lg:px-8 relative z-10 my-auto">
        
        {/* Mobile App-Card Wrapper Container */}
        <div class="bg-white sm:bg-transparent rounded-3xl sm:rounded-none border border-rose-100/90 sm:border-0 shadow-md sm:shadow-none p-3.5 sm:p-0">

        {/* Section Header */}
        <div class="text-center max-w-3xl mx-auto mb-4 sm:mb-5">
          <span class="inline-flex items-center space-x-1.5 text-[#B30E2E] font-bold text-xs uppercase tracking-widest bg-[#FFF0F2] px-3 py-0.5 rounded-full border border-[#FCD6DC]">
            <i class="fa-solid fa-leaf text-[10px]"></i>
            <span>ABOUT GULMOHAR CITY</span>
          </span>
          <h2 class="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-gray-900 mt-1.5 leading-tight sm:whitespace-nowrap">
            A Peaceful Place for a <span class="text-[#B30E2E]">Brighter Tomorrow</span>
          </h2>
          <div class="w-14 h-1 bg-[#B30E2E] rounded-full mx-auto mt-1.5"></div>
        </div>

        {/* 2-Column Perfectly Aligned Symmetrical Layout */}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch flex-1">
          
          {/* Left Column: Project Overview */}
          <div class="lg:col-span-5 flex flex-col">
            
            {/* Overview Box - Full Height Stretch */}
            <div class="bg-white p-3.5 sm:p-4 rounded-2xl border border-gray-200 shadow-md flex-1 flex flex-col justify-between space-y-2.5">
              <div class="space-y-3">
                <div class="flex justify-between items-center border-b border-gray-100 pb-2.5">
                  <span class="text-xs font-bold text-[#B30E2E] uppercase tracking-wider block">PROJECT OVERVIEW</span>
                  <span class="text-[10px] font-bold text-[#0D5235] bg-[#EBF5F0] px-2.5 py-0.5 rounded-full border border-emerald-200">
                    Road Touch
                  </span>
                </div>

                <p class="text-gray-700 leading-relaxed text-[10.5px] sm:text-[11.5px] font-normal">
                  <strong>Gulmohar City</strong> is a premier, thoughtfully planned residential plot township situated directly touching the Shikrapur – Malthan Main Road (Malthan Village, Taluka Shirur, Dist. Pune). Designed to offer a perfect balance of serene natural living and modern infrastructure, it presents an exceptional opportunity for families and smart investors to build their dream home or secure high-appreciation land assets near Pune’s rapidly growing industrial hubs.
                </p>
              </div>

              {/* Bottom Info Strip inside Left Card for Top/Bottom Alignment */}
              <div class="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
                <span class="text-gray-600 font-semibold text-[11.5px] flex items-center gap-1.5">
                  <i class="fa-solid fa-location-dot text-[#B30E2E] text-xs"></i>
                  <span>Malthan Village, Shirur</span>
                </span>
                <span class="text-[#0D5235] font-bold text-[10px] bg-[#EBF5F0] px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Prime Location
                </span>
              </div>
            </div>

          </div>

          {/* Right Column: Why Choose Gulmohar City? */}
          <div class="lg:col-span-7 flex flex-col justify-between space-y-2.5">
            
            <div class="flex justify-between items-center px-0.5">
              <h3 class="font-serif font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-1.5">
                <i class="fa-solid fa-circle-question text-[#B30E2E] text-xs"></i>
                <span>Why Choose Gulmohar City?</span>
              </h3>
            </div>

            {/* Symmetrical 2x2 Feature Cards Grid */}
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
              
              {whyChooseUs.map((card, idx) => (
                <div 
                  key={idx}
                  class="group relative bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#B30E2E] transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer"
                >
                  <div class="flex items-start space-x-3">
                    <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#FFF0F2] text-[#B30E2E] group-hover:bg-[#B30E2E] group-hover:text-white flex items-center justify-center text-xs sm:text-sm flex-shrink-0 shadow-sm transition-all duration-300">
                      <i class={`fa-solid ${card.icon}`}></i>
                    </div>

                    <div class="space-y-1 min-w-0 flex-grow">
                      <div class="flex items-center justify-between gap-1">
                        <h4 class="font-bold text-gray-900 text-xs sm:text-[13px] leading-tight group-hover:text-[#B30E2E] transition-colors">
                          {card.title}
                        </h4>
                        <span class="text-[8.5px] font-bold uppercase tracking-wider text-[#0D5235] bg-[#EBF5F0] px-1.5 py-0.5 rounded-full flex-shrink-0">
                          {card.tag}
                        </span>
                      </div>

                      <p class="text-[10.5px] sm:text-[11.5px] text-gray-600 leading-relaxed group-hover:text-gray-800 transition-colors">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

            </div>

            {/* Decorative Tagline */}
            <div class="text-right pt-0.5">
              <span class="font-serif italic text-[11px] sm:text-xs text-[#B30E2E] font-bold inline-flex items-center gap-1">
                Where Dreams Find Their Space 
                <i class="fa-solid fa-seedling text-[#0D5235] text-[10px] animate-bounce"></i>
              </span>
            </div>

          </div>

        </div>

        {/* Section Bottom Centered CTA Buttons */}
        <div class="pt-2 mt-2 flex flex-col sm:flex-row items-center justify-center gap-2 border-t border-gray-100">
          <a 
            href="#contact" 
            class="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#B30E2E] hover:bg-[#8A0B22] text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-full shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <span>Book Plot @ ₹ 2.99 Lakh</span>
            <i class="fa-solid fa-arrow-right text-[10px]"></i>
          </a>

          <a 
            href={`tel:+${CONTACT_PHONE}`} 
            class="w-full sm:w-auto inline-flex items-center justify-center space-x-2 border-2 border-[#0D5235] text-[#0D5235] bg-[#EBF5F0] hover:bg-[#0D5235] hover:text-white font-bold text-xs sm:text-sm px-4 py-1.5 rounded-full transition shadow-sm"
          >
            <i class="fa-solid fa-phone text-[10px]"></i>
            <span>{CONTACT_PHONE_DISPLAY}</span>
          </a>
        </div>

        </div>

        {/* Mobile Section Divider */}
        <div class="block sm:hidden w-3/4 mx-auto h-[1.5px] bg-gradient-to-r from-transparent via-[#B30E2E]/40 to-transparent mt-6 mb-1"></div>

      </div>
    </section>
  );
}
