import React, { useEffect } from 'react';

export default function PolicyModal({ isOpen, type, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isPrivacy = type === 'privacy';

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      
      {/* Background Click to Dismiss */}
      <div class="absolute inset-0" onClick={onClose}></div>

      {/* Modal Container */}
      <div class="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[85vh] border border-gray-100">
        
        {/* Modal Header */}
        <div class="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-[#40020D] to-[#660417] text-white">
          <div class="flex items-center space-x-2.5">
            <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm">
              <i class={`fa-solid ${isPrivacy ? 'fa-user-shield' : 'fa-triangle-exclamation'}`}></i>
            </div>
            <h3 class="text-base sm:text-lg font-serif font-bold tracking-wide">
              {isPrivacy ? 'Privacy Policy' : 'Disclaimer & Terms'}
            </h3>
          </div>
          <button 
            onClick={onClose}
            class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <i class="fa-solid fa-xmark text-base"></i>
          </button>
        </div>

        {/* Modal Scrollable Body Content */}
        <div class="p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-gray-700 leading-relaxed">
          
          {isPrivacy ? (
            <>
              <div class="bg-[#FFF0F2] p-3 rounded-2xl border border-[#FCD6DC] text-[#B30E2E] font-semibold text-xs">
                <i class="fa-solid fa-shield-halved mr-1.5"></i>
                Gulmohar City is committed to respecting and protecting your privacy.
              </div>

              <div>
                <h4 class="font-bold text-gray-900 text-sm mb-1">1. Information We Collect</h4>
                <p>
                  When you submit an enquiry form or request a site visit on our website, we collect your Name, Mobile Number, Email Address (optional), Number of Guntha, and Preferred Visit Date.
                </p>
              </div>

              <div>
                <h4 class="font-bold text-gray-900 text-sm mb-1">2. How We Use Your Information</h4>
                <p>
                  The information provided is strictly used by our authorized sales helpline team (+91 7447 212121) to contact you regarding plot availability, pricing details (starting @ ₹ 2.99 Lakh), site inspection arrangements, and brochure sharing.
                </p>
              </div>

              <div>
                <h4 class="font-bold text-gray-900 text-sm mb-1">3. Data Protection & Confidentiality</h4>
                <p>
                  We guarantee that your personal contact details are kept strictly confidential. We do not sell, rent, trade, or share customer data with third-party marketing agencies.
                </p>
              </div>

              <div>
                <h4 class="font-bold text-gray-900 text-sm mb-1">4. Direct Contact & Updates</h4>
                <p>
                  By submitting your mobile number, you authorize Gulmohar City sales representatives to call or send WhatsApp updates regarding site visits, special pre-launch offers, and layout updates.
                </p>
              </div>
            </>
          ) : (
            <>
              <div class="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-900 font-semibold text-xs">
                <i class="fa-solid fa-circle-info mr-1.5"></i>
                Important Notice regarding Project Specifications & Offerings.
              </div>

              <div>
                <h4 class="font-bold text-gray-900 text-sm mb-1">1. Project Information & Representation</h4>
                <p>
                  All project details, plot layouts, master plans, dimensions (1000 Sq.Ft standard), amenities, and pricing (₹ 2.99 Lakh onwards) presented on this website are conceptual and indicative of the Gulmohar City residential plot project in Malthan, Shikrapur.
                </p>
              </div>

              <div>
                <h4 class="font-bold text-gray-900 text-sm mb-1">2. Visuals & Computer Generated Graphics</h4>
                <p>
                  Images, 3D views, artistic renderings, and gallery photos shown are for illustrative representation only and may differ from final actual site developments.
                </p>
              </div>

              <div>
                <h4 class="font-bold text-gray-900 text-sm mb-1">3. Price & Layout Updates</h4>
                <p>
                  Pre-launch offer pricing and plot availability are subject to change without prior notice. Final terms, plot boundaries, and agreement details will be governed solely by the registered sale agreement.
                </p>
              </div>

              <div>
                <h4 class="font-bold text-gray-900 text-sm mb-1">4. Official Communication</h4>
                <p>
                  For verified layout maps, official site visits, and booking confirmation, please contact our authorized helpline at +91 7447 212121 or visit our site address at Malthan Village, Shikrapur – Malthan Road, Tal. Shirur, Dist. Pune.
                </p>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div class="px-6 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button 
            onClick={onClose}
            class="px-5 py-2 rounded-xl bg-[#B30E2E] hover:bg-[#8A0B22] text-white font-bold text-xs transition cursor-pointer shadow-sm"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
