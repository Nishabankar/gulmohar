import React, { useState } from 'react';

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "What plot sizes and configurations are available at Gulmohar City?",
      answer: "Gulmohar City offers premium residential(agricultural plots) starting from 1 Guntha (1000 sq.ft.) onwards up to multiple Guntha bulk plot options at Shikrapur - Malthan Hiway Road, Pune. Each plot is individually demarcated with clear boundaries."
    },
    {
      question: "Is Gulmohar City a clear title and legally verified plot project?",
      answer: "Yes, Gulmohar City is 100% clear title property with individual 7/12 extract documentation, sanctioned well plans layout, and complete legal verification for hassle-free ownership and registration."
    },
    {
      question: "What infrastructure and township amenities are provided?",
      answer: "The project includes 25ft wide internal roads, 24/7 water supply pipeline connection, electricity infrastructure with street lights, 24/7 security surveillance, and roadside tree plantation."
    },
    {
      question: "How far is Gulmohar City from Shikrapur Chowk & Ranjangaon MIDC?",
      answer: "Gulmohar City is strategically located just 10 minutes from Shikrapur, 10 minutes from Ranjangaon MIDC hub, 35 minutes from Pune International Airport, and 45 minutes from Pune City."
    },
    {
      question: "Are bank loan facilities available for buying plots at Gulmohar City?",
      answer: "Yes, loan facilities are available through developer on EMI option will assists you on EMI option from developer."
    },
    {
      question: "How can I book a free site visit to Gulmohar City?",
      answer: "You can schedule a complimentary site visit by filling out the online Enquiry form on this website or by calling our sales team directly at +91 7447 212121. Free site visit assistance is available upon request."
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  // Structured Data Schema for FAQ (Google Rich Snippets)
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  };

  return (
    <section id="faq" class="py-4 sm:py-6 bg-slate-50 relative overflow-hidden flex flex-col justify-center sm:min-h-[calc(100vh-80px)]">
      {/* Inject FAQ Schema for Search Engine Rich Snippets */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div style={{ maxWidth: '1280px' }} class="w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 my-auto">
        
        {/* Section Header */}
        <div class="text-center max-w-3xl mx-auto mb-4 sm:mb-6">
          <span class="inline-flex items-center space-x-1.5 text-[#B30E2E] font-bold text-[10px] sm:text-xs uppercase tracking-widest bg-[#FFF0F2] px-2.5 py-0.5 rounded-full border border-[#FCD6DC]">
            <i class="fa-solid fa-circle-question text-[9px]"></i>
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </span>
          <h2 class="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-gray-900 mt-1 leading-tight">
            Got Questions? <span class="text-[#B30E2E]">We Have Answers</span>
          </h2>
          <div class="w-14 h-1 bg-[#B30E2E] rounded-full mx-auto mt-1"></div>
        </div>

        {/* FAQ Accordion List - 2 Columns (3 items per column) for perfect viewport fit */}
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-2.5 sm:gap-3.5 max-w-5xl mx-auto">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div 
                key={index} 
                class={`rounded-xl border transition-all duration-300 overflow-hidden bg-white ${
                  isOpen ? 'border-[#B30E2E] shadow-md' : 'border-gray-200 hover:border-gray-300 shadow-sm'
                }`}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  class="w-full p-3 sm:p-3.5 text-left flex items-center justify-between gap-3 focus:outline-none cursor-pointer"
                >
                  <span class="font-sans font-bold text-xs sm:text-sm text-gray-900 flex items-center gap-2.5">
                    <span class="w-6 h-6 rounded-full bg-[#FFF0F2] text-[#B30E2E] font-sans text-[11px] font-bold flex items-center justify-center flex-shrink-0">
                      Q{index + 1}
                    </span>
                    <span>{faq.question}</span>
                  </span>
                  <span class={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-transform duration-300 flex-shrink-0 ${
                    isOpen ? 'bg-[#B30E2E] text-white rotate-180' : 'bg-gray-100 text-gray-600'
                  }`}>
                    <i class="fa-solid fa-chevron-down"></i>
                  </span>
                </button>

                {isOpen && (
                  <div class="px-3 pb-3.5 sm:px-4 sm:pb-4 pt-0 text-xs text-gray-600 leading-relaxed border-t border-gray-100 mt-1">
                    <p class="pl-8 text-gray-700">{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
