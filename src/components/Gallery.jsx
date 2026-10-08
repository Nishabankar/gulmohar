import React, { useRef } from 'react';

export default function Gallery({ onOpenLightbox }) {
  const scrollRef = useRef(null);

  const galleryItems = [
    {
      id: 1,
      title: 'Gulmohar City Plot Site View 1',
      src: '/assets/images/plot-image-1.jpeg',
      type: 'image',
      tag: 'Plot Image'
    },
    {
      id: 2,
      title: 'Plot Walkthrough Video 1',
      src: '/assets/images/plot-video-1.mp4',
      type: 'video',
      tag: 'Plot Video'
    },
    {
      id: 3,
      title: 'Township Overview Video 2',
      src: '/assets/images/plot-video-2.mp4',
      type: 'video',
      tag: 'Plot Video'
    },
    {
      id: 4,
      title: 'Site Development Video 4',
      src: '/assets/images/plot-video-4.mp4',
      type: 'video',
      tag: 'Plot Video'
    },
  ];

  const handleScrollRight = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 20) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: clientWidth * 0.75, behavior: 'smooth' });
      }
    }
  };

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -scrollRef.current.clientWidth * 0.75, behavior: 'smooth' });
    }
  };

  return (
    <section id="gallery" class="py-6 sm:py-6 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden flex flex-col justify-center sm:min-h-[calc(100vh-80px)]">
      <div style={{ maxWidth: '1280px' }} class="w-full mx-auto px-3 sm:px-6 lg:px-8 relative z-10 my-auto">
        
        {/* Mobile App-Card Wrapper Container */}
        <div class="bg-[#FFF7F8] sm:bg-transparent rounded-3xl sm:rounded-none border border-rose-200/90 sm:border-0 shadow-md sm:shadow-none p-3.5 sm:p-0">

        {/* Header with Title Centered and View More Shifted Up to Top Right */}
        <div class="relative mb-3 sm:mb-4">
          <div class="text-center max-w-3xl mx-auto">
            <span class="inline-flex items-center space-x-1.5 text-[#B30E2E] font-bold text-[10px] sm:text-xs uppercase tracking-widest bg-[#FFF0F2] px-2.5 py-0.5 rounded-full border border-[#FCD6DC]">
              <i class="fa-solid fa-photo-film text-[9px]"></i>
              <span>PROJECT GALLERY</span>
            </span>
            <h2 class="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-gray-900 mt-1 leading-tight">
              Explore <span class="text-[#B30E2E]">Gulmohar City Plots & Site Videos</span>
            </h2>
            <div class="w-14 h-1 bg-[#B30E2E] rounded-full mx-auto mt-1"></div>
          </div>

          {/* View More & Scroll Control Buttons (Centered on Mobile, Top Right on Desktop) */}
          <div class="flex items-center justify-center sm:justify-end gap-2 mt-2.5 sm:mt-0 sm:absolute sm:right-0 sm:bottom-0">
            <button
              onClick={handleScrollLeft}
              title="Previous"
              class="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white hover:bg-gray-100 border border-gray-200 text-gray-700 flex items-center justify-center shadow-sm hover:shadow transition cursor-pointer"
            >
              <i class="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <button
              onClick={handleScrollRight}
              class="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#B30E2E] hover:bg-[#8A0B2E] text-white text-xs font-bold shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <span>View More</span>
              <i class="fa-solid fa-arrow-right text-xs"></i>
            </button>
          </div>
        </div>

        {/* 1 Single Horizontal Row containing 4 cards per row on desktop */}
        <div 
          ref={scrollRef}
          class="flex overflow-x-auto gap-4 sm:gap-5 pb-3 pt-1 scroll-smooth snap-x snap-mandatory"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {galleryItems.map((item) => (
            <div 
              key={item.id} 
              onClick={() => onOpenLightbox(item.src, item.title, item.type)}
              class="w-[85%] sm:w-[calc(50%-10px)] lg:w-[calc(25%-12px)] flex-shrink-0 snap-start group relative rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-black cursor-pointer h-60 sm:h-[clamp(260px,calc(100vh-240px),520px)] lg:h-[clamp(285px,calc(100vh-250px),540px)] hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Media Element */}
              {item.type === 'video' ? (
                <div class="w-full h-full relative">
                  <video 
                    src={item.src} 
                    muted 
                    loop 
                    playsInline
                    preload="metadata"
                    class="w-full h-full object-cover opacity-85 group-hover:scale-105 transition duration-500 block" 
                  />
                  {/* Play Button Overlay for Videos */}
                  <div class="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <div class="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-[#B30E2E]/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-[#B30E2E] transition-all duration-300 border-2 border-white/40">
                      <i class="fa-solid fa-play text-sm sm:text-base ml-0.5"></i>
                    </div>
                  </div>
                </div>
              ) : (
                <img 
                  src={item.src} 
                  alt={item.title} 
                  class="w-full h-full object-cover group-hover:scale-105 transition duration-500 block" 
                />
              )}

              {/* Tag Badge */}
              <div class="absolute top-3 left-3 z-10">
                <span class={`text-[10px] font-bold uppercase tracking-wider text-white px-2.5 py-1 rounded-full border border-white/20 shadow ${
                  item.type === 'video' ? 'bg-[#B30E2E]/90 backdrop-blur-md' : 'bg-black/60 backdrop-blur-md'
                }`}>
                  <i class={`fa-solid ${item.type === 'video' ? 'fa-circle-play mr-1' : 'fa-image mr-1'}`}></i>
                  {item.tag}
                </span>
              </div>

              {/* Hover Overlay Info */}
              <div class="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 text-white z-20">
                <h4 class="font-serif font-bold text-xs sm:text-sm leading-snug group-hover:text-amber-200 transition line-clamp-2">
                  {item.title}
                </h4>
                <span class="text-[11px] text-amber-300 font-medium flex items-center gap-1.5 mt-1">
                  <i class={`fa-solid ${item.type === 'video' ? 'fa-circle-play text-[10px]' : 'fa-magnifying-glass-plus text-[10px]'}`}></i>
                  <span>{item.type === 'video' ? 'Click to Play Video' : 'Click to View Photo'}</span>
                </span>
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
