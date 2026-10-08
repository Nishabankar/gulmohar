import React, { useState } from 'react';
import { CONTACT_PHONE, CONTACT_PHONE_DISPLAY } from '../config';

export default function Navbar({ onOpenAdmin, isAdminLoggedIn, onOpenDashboard }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header class="sticky top-0 z-50 bg-white shadow-sm border-b border-gray-100 flex-shrink-0">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-20">
        
        {/* LOGO */}
        <a href="#" class="flex items-center flex-shrink-0 py-0.5">
          <img 
            src="/assets/images/gulmohor-logo.png" 
            alt="Gulmohar City" 
            class="h-[74px] w-auto object-contain"
          />
        </a>

        {/* DESKTOP NAV + CTA RIGHT GROUP */}
        <div class="hidden lg:flex items-center space-x-8 xl:space-x-10">
          <nav class="flex items-center space-x-6 xl:space-x-8 font-medium text-sm text-gray-700">
            <a href="#home" class="text-[#B30E2E] font-semibold border-b-2 border-[#B30E2E] pb-1">Home</a>
            <a href="#about" class="hover:text-[#B30E2E] transition">About</a>
            <a href="#layout" class="hover:text-[#B30E2E] transition">Layout</a>
            <a href="#location" class="hover:text-[#B30E2E] transition">Location</a>
            <a href="#gallery" class="hover:text-[#B30E2E] transition">Gallery</a>
            <a href="#faq" class="hover:text-[#B30E2E] transition">FAQ</a>
            <a href="#contact" class="hover:text-[#B30E2E] transition">Contact</a>
          </nav>

          <div class="flex items-center space-x-3 flex-shrink-0">
            <a href={`tel:+${CONTACT_PHONE}`} class="inline-flex items-center space-x-2 border border-[#0D5235] text-[#0D5235] bg-[#EBF5F0] hover:bg-[#D6EBE1] font-medium text-xs sm:text-sm px-3.5 sm:px-4 py-2 rounded-full transition whitespace-nowrap">
              <i class="fa-solid fa-phone text-[#0D5235]"></i>
              <span class="whitespace-nowrap">{CONTACT_PHONE_DISPLAY}</span>
            </a>

            <a href="#contact" class="inline-flex items-center space-x-2 bg-[#B30E2E] hover:bg-[#8A0B22] text-white font-medium text-xs sm:text-sm px-4 sm:px-5 py-2 rounded-full shadow-md hover:shadow-lg transition transform hover:-translate-y-0.5 whitespace-nowrap">
              <span class="whitespace-nowrap">Enquire Now</span>
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </a>

            {/* Admin / Employee Icon Symbol ONLY */}
            {isAdminLoggedIn ? (
              <button 
                onClick={onOpenDashboard}
                class="w-9 h-9 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 flex items-center justify-center shadow-md hover:shadow-lg transition cursor-pointer transform hover:scale-105 active:scale-95"
                title="Dashboard"
              >
                <i class="fa-solid fa-user-gear text-sm"></i>
              </button>
            ) : (
              <button 
                onClick={onOpenAdmin}
                class="w-9 h-9 rounded-full bg-[#FFF0F2] hover:bg-[#FCD6DC] text-[#B30E2E] border border-[#FCD6DC] flex items-center justify-center shadow-sm hover:shadow transition cursor-pointer transform hover:scale-105 active:scale-95"
                title="Employee Login"
              >
                <i class="fa-solid fa-user-lock text-sm"></i>
              </button>
            )}
          </div>
        </div>

        {/* TABLET / MOBILE CTA & MENU BUTTON */}
        <div class="flex lg:hidden items-center space-x-3">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            class="text-gray-700 hover:text-[#B30E2E] focus:outline-none p-2"
          >
            <i class={`fa-solid ${mobileMenuOpen ? 'fa-xmark' : 'fa-bars'} text-2xl`}></i>
          </button>
        </div>

      </div>

      {/* MOBILE NAV MENU */}
      {mobileMenuOpen && (
        <div class="lg:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 shadow-lg">
          <a href="#home" onClick={() => setMobileMenuOpen(false)} class="block text-[#B30E2E] font-semibold py-1">Home</a>
          <a href="#about" onClick={() => setMobileMenuOpen(false)} class="block text-gray-700 hover:text-[#B30E2E] py-1">About</a>
          <a href="#layout" onClick={() => setMobileMenuOpen(false)} class="block text-gray-700 hover:text-[#B30E2E] py-1">Layout</a>
          <a href="#location" onClick={() => setMobileMenuOpen(false)} class="block text-gray-700 hover:text-[#B30E2E] py-1">Location</a>
          <a href="#gallery" onClick={() => setMobileMenuOpen(false)} class="block text-gray-700 hover:text-[#B30E2E] py-1">Gallery</a>
          <a href="#faq" onClick={() => setMobileMenuOpen(false)} class="block text-gray-700 hover:text-[#B30E2E] py-1">FAQ</a>
          {isAdminLoggedIn ? (
            <button 
              onClick={() => { setMobileMenuOpen(false); onOpenDashboard(); }}
              class="inline-flex items-center justify-center space-x-2 w-full bg-amber-500 text-slate-950 font-bold py-2 rounded-full text-xs shadow mt-1"
            >
              <i class="fa-solid fa-gauge-high"></i>
              <span>Dashboard</span>
            </button>
          ) : (
            <button 
              onClick={() => { setMobileMenuOpen(false); onOpenAdmin(); }}
              class="inline-flex items-center justify-center space-x-1.5 w-full bg-[#FFF0F2] text-[#B30E2E] font-semibold py-2 rounded-full text-xs border border-[#FCD6DC] mt-1"
            >
              <i class="fa-solid fa-user-shield"></i>
              <span>Employee Login</span>
            </button>
          )}
          <a href="#contact" onClick={() => setMobileMenuOpen(false)} class="inline-block w-full text-center bg-[#B30E2E] text-white font-medium py-2.5 rounded-full mt-2">
            Enquire Now <i class="fa-solid fa-arrow-right ml-1"></i>
          </a>
        </div>
      )}
    </header>
  );
}
