import React from 'react';

export default function LightboxModal({ isOpen, mediaSrc, imageSrc, caption, type, onClose }) {
  if (!isOpen) return null;

  const src = mediaSrc || imageSrc;
  const isVideo = type === 'video' || (typeof src === 'string' && src.toLowerCase().endsWith('.mp4'));

  return (
    <div class="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <button 
        onClick={onClose} 
        class="absolute top-4 right-4 sm:top-6 sm:right-6 text-white hover:text-[#B30E2E] focus:outline-none z-50 cursor-pointer bg-white/10 hover:bg-white/20 w-11 h-11 rounded-full flex items-center justify-center transition border border-white/20"
      >
        <i class="fa-solid fa-xmark text-xl"></i>
      </button>
      <div class="max-w-4xl max-h-[85vh] text-center w-full relative my-auto">
        {isVideo ? (
          <div class="relative w-full max-h-[75vh] flex justify-center">
            <video 
              src={src} 
              controls 
              autoPlay 
              class="max-h-[75vh] mx-auto rounded-2xl shadow-2xl object-contain max-w-full border border-white/10"
            />
          </div>
        ) : (
          <img 
            src={src} 
            alt={caption || 'Preview'} 
            class="max-h-[75vh] mx-auto rounded-2xl shadow-2xl object-contain border border-white/10" 
          />
        )}
        {caption && (
          <p class="text-white font-semibold mt-4 text-sm sm:text-base tracking-wide bg-black/60 inline-block px-5 py-2 rounded-full border border-white/10 backdrop-blur-md">
            {caption}
          </p>
        )}
      </div>
    </div>
  );
}
