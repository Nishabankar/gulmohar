import React from 'react';

export default function WhatsAppButton() {
  return (
    <a 
      href="https://wa.me/917447212121?text=Hi,%20I%20am%20interested%20in%20Gulmohar%20City%20plots." 
      target="_blank" 
      rel="noreferrer"
      class="fixed bottom-5 right-5 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition duration-300"
    >
      <i class="fa-brands fa-whatsapp text-xl sm:text-2xl"></i>
    </a>
  );
}
