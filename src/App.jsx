import React, { useState, useEffect } from 'react';
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
import AdminLogin from './components/AdminLogin';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  const [lightbox, setLightbox] = useState({ isOpen: false, imageSrc: '', caption: '' });
  const [policyModal, setPolicyModal] = useState({ isOpen: false, type: 'privacy' });
  const [selectedPlotForEnquiry, setSelectedPlotForEnquiry] = useState(null);
  
  // Admin State Management
  const [showAdminLoginModal, setShowAdminLoginModal] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    return !!localStorage.getItem('adminToken');
  });
  const [currentView, setCurrentView] = useState(() => {
    const token = localStorage.getItem('adminToken');
    const savedView = localStorage.getItem('adminView');
    return token && savedView === 'dashboard' ? 'dashboard' : 'website';
  });

  useEffect(() => {
    // Check saved login token and view on render
    const token = localStorage.getItem('adminToken');
    const savedView = localStorage.getItem('adminView');
    if (token) {
      setIsAdminLoggedIn(true);
      if (savedView === 'dashboard') {
        setCurrentView('dashboard');
      }
    }
  }, []);

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

  const handleOpenDashboardView = () => {
    localStorage.setItem('adminView', 'dashboard');
    setCurrentView('dashboard');
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminLoggedIn(true);
    localStorage.setItem('adminView', 'dashboard');
    setShowAdminLoginModal(false);
    setCurrentView('dashboard');
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    localStorage.removeItem('adminView');
    setIsAdminLoggedIn(false);
    setCurrentView('website');
  };

  // If Admin Dashboard View is active
  if (currentView === 'dashboard' && isAdminLoggedIn) {
    return (
      <div class="h-screen h-[100dvh] max-h-screen bg-gray-50 overflow-hidden w-full max-w-full flex flex-col">
        <AdminDashboard onLogout={handleAdminLogout} />
      </div>
    );
  }

  return (
    <div class="h-screen h-[100dvh] max-h-screen bg-white text-gray-800 font-sans flex flex-col justify-between overflow-hidden w-full max-w-full">
      <Navbar 
        onOpenAdmin={() => setShowAdminLoginModal(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        onOpenDashboard={handleOpenDashboardView}
      />

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

        <Footer 
          onOpenPolicy={handleOpenPolicy} 
          onOpenAdmin={() => setShowAdminLoginModal(true)}
        />
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

      {/* Admin Login Modal */}
      {showAdminLoginModal && (
        <AdminLogin 
          onLoginSuccess={handleAdminLoginSuccess}
          onClose={() => setShowAdminLoginModal(false)}
        />
      )}

      {/* Floating WhatsApp Chat Button */}
      <WhatsAppButton />
    </div>
  );
}
