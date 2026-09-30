import React from 'react';

export default function MasterPlan({ onOpenLightbox }) {
  const masterPlanImg = '/assets/images/gulmohar-city-masterplan.png';

  const specs = [
    { label: 'Village Location', value: 'Malthan, Tal. Shirur' },
    { label: 'Standard Plot Area', value: '1000 Sq.Ft.', highlight: true },
    { label: 'Internal Road Widths', value: '25 Ft & 18 Ft Roads', green: true },
    { label: 'Plot Ownership', value: 'Individual 7/12 Extract Option' },
    { label: 'Price', value: '₹ 2.99 Lakh Onwards', highlight: true },
  ];

  return (
    <section id="layout" class="sm:min-h-[calc(100vh-80px)] flex flex-col justify-center py-4 sm:py-5 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      <div style={{ maxWidth: '1300px' }} class="w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 my-auto">
        
        {/* Section Header */}
        <div class="text-center max-w-3xl mx-auto mb-4 sm:mb-5">
          <span class="inline-flex items-center space-x-1.5 text-[#B30E2E] font-bold text-xs uppercase tracking-widest bg-[#FFF0F2] px-3 py-0.5 rounded-full border border-[#FCD6DC]">
            <i class="fa-solid fa-map text-[10px]"></i>
            <span>PROJECT LAYOUT & MASTER PLAN</span>
          </span>
          <h2 class="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-gray-900 mt-1.5 leading-tight sm:whitespace-nowrap">
            Thoughtfully Designed <span class="text-[#B30E2E]">Master Plan</span>
          </h2>
          <div class="w-14 h-1 bg-[#B30E2E] rounded-full mx-auto mt-1.5"></div>
        </div>

        {/* 2-Column Balanced Dashboard Layout */}
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-5 items-center flex-1">
          
          {/* Left Column: Specifications Dashboard */}
          <div class="lg:col-span-6 space-y-2.5 sm:space-y-3">
            
            {/* Specification Card */}
            <div class="bg-white rounded-2xl border border-gray-200 shadow-md overflow-hidden">
              <div class="bg-gradient-to-r from-[#B30E2E] to-[#8A0B22] px-4 py-2.5 sm:py-3 text-white flex justify-between items-center">
                <h3 class="font-serif font-bold text-xs sm:text-sm tracking-wide flex items-center gap-2">
                  <i class="fa-solid fa-list-check text-amber-300 text-xs sm:text-sm"></i>
                  <span>Layout Specifications</span>
                </h3>
                <span class="text-[10px] bg-white/20 text-white font-semibold px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                  Key Details
                </span>
              </div>

              <div class="p-3 sm:p-3.5 divide-y divide-gray-100 space-y-2.5">
                {specs.map((item, idx) => (
                  <div key={idx} class="pt-2 sm:pt-2.5 first:pt-0 flex justify-between items-center">
                    <span class="text-gray-600 font-medium text-xs sm:text-sm">{item.label}</span>
                    <span className={`font-bold text-xs sm:text-sm text-right ${item.highlight ? 'text-[#B30E2E]' : item.green ? 'text-[#0D5235]' : 'text-gray-900'}`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-2.5">
                <div class="w-8 h-8 rounded-xl bg-emerald-50 text-[#0D5235] flex items-center justify-center flex-shrink-0 text-xs sm:text-sm">
                  <i class="fa-solid fa-road"></i>
                </div>
                <div>
                  <h5 class="font-bold text-gray-900 text-xs sm:text-[13px]">Wide Roads</h5>
                  <span class="text-[10px] text-gray-500 font-semibold">25 & 18 Ft</span>
                </div>
              </div>

              <div class="bg-white p-2.5 sm:p-3 rounded-2xl border border-gray-100 shadow-sm flex items-center space-x-2.5">
                <div class="w-8 h-8 rounded-xl bg-emerald-50 text-[#0D5235] flex items-center justify-center flex-shrink-0 text-xs sm:text-sm">
                  <i class="fa-solid fa-compass"></i>
                </div>
                <div>
                  <h5 class="font-bold text-gray-900 text-xs sm:text-[13px]">Vastu Compliant</h5>
                  <span class="text-[10px] text-gray-500 font-semibold">100% Planned</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Architectural Master Plan Showcase */}
          <div class="lg:col-span-6 flex flex-col justify-center">
            <div 
              onClick={() => onOpenLightbox(masterPlanImg, 'Gulmohar City Master Plan')}
              class="cursor-pointer group relative bg-white rounded-2xl p-2 sm:p-2.5 border border-gray-200 shadow-lg hover:shadow-xl transition duration-300 w-full overflow-hidden"
            >
              {/* Image Frame */}
              <div class="overflow-hidden rounded-xl bg-slate-50 w-full">
                <img 
                  src={masterPlanImg} 
                  alt="Gulmohar City Master Plan Layout" 
                  class="w-full h-[270px] sm:h-[310px] object-fill block transform group-hover:scale-[1.01] transition duration-500 bg-white" 
                />
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
