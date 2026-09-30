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
    <section id="amenities" class="py-16 md:py-24 bg-white">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div class="text-center max-w-3xl mx-auto mb-14">
          <span class="text-[#B30E2E] font-bold text-xs uppercase tracking-widest block mb-1">AMENITIES</span>
          <h2 class="text-3xl sm:text-4xl font-serif font-bold text-gray-900 leading-tight">
            Thoughtful Amenities for a Better Lifestyle
          </h2>
          <div class="w-16 h-1 bg-[#B30E2E] rounded-full mx-auto mt-3"></div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {amenitiesList.map((item, idx) => (
            <div key={idx} class="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-md hover:shadow-xl transition group">
              <div class="p-4 text-center bg-[#FFF5F6] min-h-[100px] flex flex-col items-center justify-center">
                <i class={`fa-solid ${item.icon} text-[#B30E2E] text-2xl mb-1 group-hover:scale-110 transition`}></i>
                <h4 class="font-bold text-gray-900 text-xs sm:text-sm">{item.title}</h4>
              </div>
              <div class="h-40 overflow-hidden">
                <img src={item.img} alt={item.title} class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
