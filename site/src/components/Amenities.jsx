import React from 'react';

export default function Amenities() {
  const amenitiesList = [
    { title: 'Landscaped Green Areas', icon: 'fa-spa', img: '/assets/images/amenity-garden.jpg' },
    { title: 'Wide Internal Roads', icon: 'fa-road', img: '/assets/images/amenity-road.jpg' },
    { title: 'Street Lighting', icon: 'fa-lightbulb', img: '/assets/images/amenity-lighting.jpg' },
    { title: 'Open Spaces', icon: 'fa-trees', img: '/assets/images/amenity-open.jpg' },
    { title: 'Gated Community', icon: 'fa-torii-gate', img: '/assets/images/amenity-gated.jpg' },
  ];

  return (
    <section id="amenities" class="py-6 sm:py-16 md:py-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Mobile App-Card Wrapper Container */}
        <div class="bg-white sm:bg-transparent rounded-3xl sm:rounded-none border border-slate-200/90 sm:border-0 shadow-md sm:shadow-none p-3.5 sm:p-0">

        <div class="text-center max-w-3xl mx-auto mb-6 sm:mb-14">
          <span class="text-[#B30E2E] font-bold text-xs uppercase tracking-widest block mb-1">AMENITIES</span>
          <h2 class="text-xl sm:text-3xl lg:text-4xl font-serif font-bold text-gray-900 leading-tight">
            Thoughtful Amenities for a Better Lifestyle
          </h2>
          <div class="w-16 h-1 bg-[#B30E2E] rounded-full mx-auto mt-2 sm:mt-3"></div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
          {amenitiesList.map((item, idx) => (
            <div key={idx} class="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition group">
              <div class="p-3.5 sm:p-4 text-center bg-[#FFF5F6] min-h-[90px] sm:min-h-[100px] flex flex-col items-center justify-center">
                <i class={`fa-solid ${item.icon} text-[#B30E2E] text-xl sm:text-2xl mb-1 group-hover:scale-110 transition`}></i>
                <h4 class="font-bold text-gray-900 text-xs sm:text-sm">{item.title}</h4>
              </div>
              <div class="h-36 sm:h-40 overflow-hidden">
                <img src={item.img} alt={item.title} class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
            </div>
          ))}
        </div>

        </div>

        {/* Mobile Section Divider */}
        <div class="block sm:hidden w-3/4 mx-auto h-[1.5px] bg-gradient-to-r from-transparent via-[#B30E2E]/40 to-transparent mt-6 mb-1"></div>

      </div>
    </section>
  );
}
