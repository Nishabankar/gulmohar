import React, { useState } from 'react';
import Navbar from './components/Navbar';
import HeroBanner from './components/HeroBanner';
import About from './components/About';
import MasterPlan from './components/MasterPlan';
import LocationSection from './components/LocationSection';
import Gallery from './components/Gallery';
import FAQSection from './components/FAQSection';
import ContactForm from './components/ContactForm';
import PoweredBySlider from './components/PoweredBySlider';
import Footer from './components/Footer';
import LightboxModal from './components/LightboxModal';
import PolicyModal from './components/PolicyModal';
import WhatsAppButton from './components/WhatsAppButton';

export default function App() {
  const [lightbox, setLightbox] = useState({ isOpen: false, imageSrc: '', caption: '' });
  const [policyModal, setPolicyModal] = useState({ isOpen: false, type: 'privacy' });
  const [selectedPlotForEnquiry, setSelectedPlotForEnquiry] = useState(null);
  
  const handleOpenLightbox = (imageSrc, caption, type = 'image') => {
    setLightbox({ isOpen: true, mediaSrc: imageSrc, imageSrc, caption, type });
  };

  const handleCloseLightbox = () => {
    setLightbox({ ...lightbox, isOpen: false });
  };

  const handleOpenPolicy = (type) => {
    setPolicyModal({ isOpen: true, type });
  };

  const handleClosePolicy = () => {
    setPolicyModal({ ...policyModal, isOpen: false });
  };

  const handleSelectPlotForEnquiry = (number, area, price) => {
    setSelectedPlotForEnquiry({ number, area, price });
  };

  return (
    <div class="h-screen h-[100dvh] max-h-screen bg-white text-gray-800 font-sans flex flex-col justify-between overflow-hidden w-full max-w-full">
      <Navbar />

      <main class="flex-1 overflow-y-auto custom-scrollbar min-h-0 w-full">
        <HeroBanner />

        <About />

        <MasterPlan 
          onOpenLightbox={handleOpenLightbox} 
          onSelectPlotForEnquiry={handleSelectPlotForEnquiry}
        />

        <LocationSection onOpenLightbox={handleOpenLightbox} />

        <Gallery onOpenLightbox={handleOpenLightbox} />

        <FAQSection />

        <ContactForm selectedPlotForEnquiry={selectedPlotForEnquiry} />

        <PoweredBySlider />

        <Footer onOpenPolicy={handleOpenPolicy} />
      </main>

      {/* Lightbox Modal */}
      <LightboxModal 
        isOpen={lightbox.isOpen}
        mediaSrc={lightbox.mediaSrc || lightbox.imageSrc}
        imageSrc={lightbox.imageSrc}
        caption={lightbox.caption}
        type={lightbox.type}
        onClose={handleCloseLightbox}
      />

      {/* Privacy Policy / Disclaimer Modal */}
      <PolicyModal 
        isOpen={policyModal.isOpen}
        type={policyModal.type}
        onClose={handleClosePolicy}
      />

      {/* Floating WhatsApp Chat Button */}
      <WhatsAppButton />
    </div>
  );
}
