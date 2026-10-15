import React from 'react';
import { WHATSAPP_URL } from '../config';

export default function WhatsAppButton() {
  return (
    <a 
      href={WHATSAPP_URL("Hi, I am interested in Gulmohar City plots.")} 
      target="_blank" 
      rel="noreferrer"
      class="fixed bottom-5 right-5 z-40 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg hover:bg-green-600 hover:scale-110 transition duration-300"
    >
      <i class="fa-brands fa-whatsapp text-xl sm:text-2xl"></i>
    </a>
  );
}
