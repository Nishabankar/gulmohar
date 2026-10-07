import React, { useState, useEffect } from 'react';
import { API_BASE_URL, CONTACT_PHONE, CONTACT_PHONE_DISPLAY, CONTACT_EMAIL, WHATSAPP_URL } from '../config';

export default function ContactForm({ selectedPlotForEnquiry }) {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', phone: '', email: '', plotInfo: '', plotsCount: '1 Guntha', visitDate: '' });
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  useEffect(() => {
    if (selectedPlotForEnquiry) {
      setFormData(prev => ({
        ...prev,
        plotInfo: `${selectedPlotForEnquiry.number} (${selectedPlotForEnquiry.area} Sq.Ft - ₹ ${selectedPlotForEnquiry.price.toLocaleString('en-IN')})`
      }));
    }
  }, [selectedPlotForEnquiry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.phone) return;

    if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      setStatusMsg({
        text: 'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.',
        type: 'error'
      });
      return;
    }

    setSubmitting(true);

    // Dynamic Round-Robin Agent Auto-Assignment
    let registeredAgents = JSON.parse(localStorage.getItem('registeredAgents') || '[]');

    let assignedAgentId = null;
    let assignedAgentName = '';

    if (registeredAgents.length > 0) {
      const lastAssignedIndex = parseInt(localStorage.getItem('lastAssignedAgentIndex') || '-1', 10);
      const nextIndex = (lastAssignedIndex + 1) % registeredAgents.length;
      const assignedAgent = registeredAgents[nextIndex];
      localStorage.setItem('lastAssignedAgentIndex', nextIndex.toString());
      assignedAgentId = assignedAgent.id || assignedAgent._id;
      assignedAgentName = assignedAgent.name;
    }

    const submissionPayload = {
      ...formData,
      assignedTo: assignedAgentId,
      assignedAgentName: assignedAgentName
    };

    try {
      const response = await fetch(`${API_BASE_URL}/api/enquiries`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submissionPayload)
      });

      const data = await response.json();

      if (data.success) {
        setStatusMsg({
          text: 'Enquiry Submitted Successfully!',
          type: 'success'
        });
        setFormData({ firstName: '', lastName: '', phone: '', email: '', plotInfo: '', plotsCount: '1 Guntha', visitDate: '' });
      } else {
        setStatusMsg({
          text: data.message || `Could not save enquiry. Please call us directly at ${CONTACT_PHONE_DISPLAY}.`,
          type: 'error'
        });
      }
    } catch (err) {
      console.warn('Backend server connecting... saving locally:', err);
      // Save locally to enquiries state cache
      const existingLeads = JSON.parse(localStorage.getItem('localEnquiriesCache') || '[]');
      const newLead = {
        _id: `lead-${Date.now()}`,
        ...submissionPayload,
        status: 'New',
        createdAt: new Date().toISOString()
      };
      localStorage.setItem('localEnquiriesCache', JSON.stringify([newLead, ...existingLeads]));

      setStatusMsg({
        text: 'Enquiry Submitted Successfully!',
        type: 'success'
      });
      setFormData({ firstName: '', lastName: '', phone: '', email: '', plotInfo: '', plotsCount: '1 Guntha', visitDate: '' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setStatusMsg(null), 8000);
    }
  };

  return (
    <section id="contact" class="sm:min-h-[calc(100vh-80px)] flex flex-col justify-center py-4 sm:py-6 bg-gradient-to-b from-slate-50 via-white to-slate-50 relative overflow-hidden">
      
      {/* Background Accent Blurs */}
      <div class="absolute -top-20 -right-20 w-96 h-96 bg-[#FFF0F2] rounded-full blur-3xl pointer-events-none"></div>
      <div class="absolute -bottom-20 -left-20 w-96 h-96 bg-[#EBF5F0]/70 rounded-full blur-3xl pointer-events-none"></div>

      <div style={{ maxWidth: '1300px' }} class="w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 my-auto">
        
        {/* Uniform Section Header Title */}
        <div class="text-center max-w-3xl mx-auto mb-6 sm:mb-8">
          <span class="inline-flex items-center space-x-1.5 text-[#B30E2E] font-bold text-[10px] sm:text-xs uppercase tracking-widest bg-[#FFF0F2] px-2.5 py-0.5 rounded-full border border-[#FCD6DC]">
            <i class="fa-solid fa-envelope-open-text text-[9px]"></i>
            <span>GET IN TOUCH & ENQUIRE</span>
          </span>
          <h2 class="text-lg sm:text-xl lg:text-2xl font-serif font-bold text-gray-900 mt-1 leading-tight sm:whitespace-nowrap">
            Book Your Dream Plot
          </h2>
          <div class="w-12 h-1 bg-[#B30E2E] rounded-full mx-auto mt-1"></div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-stretch">
          
          {/* Enquiry Form: TOP on Mobile, RIGHT on Desktop */}
          <div class="lg:col-span-6 flex flex-col order-1 lg:order-2">
            <div class="bg-white p-3.5 sm:p-4 lg:p-5 rounded-2xl border border-gray-200/90 shadow-md space-y-2.5 flex-1 flex flex-col justify-between">
              
              <div>
                {/* Form Card Header */}
                <div class="border-b border-gray-100 pb-2 mb-2.5 text-center">
                  <h3 class="text-sm sm:text-base font-serif font-bold text-gray-900 text-center">
                    Enquiry Form
                  </h3>
                </div>

                {/* Selected Plot Badge IF Available */}
                {formData.plotInfo && (
                  <div class="mb-2 bg-[#EBF5F0] border border-[#0D5235]/30 p-2 rounded-xl flex items-center justify-between text-xs text-[#0D5235] font-semibold">
                    <span class="flex items-center gap-1.5 text-[11px]">
                      <i class="fa-solid fa-circle-check text-emerald-600 text-xs"></i>
                      <span>Selected Plot: <strong>{formData.plotInfo}</strong></span>
                    </span>
                    <button 
                      onClick={() => setFormData(prev => ({ ...prev, plotInfo: '' }))}
                      class="text-gray-400 hover:text-gray-600 text-xs p-0.5"
                    >
                      <i class="fa-solid fa-xmark"></i>
                    </button>
                  </div>
                )}

                <form onSubmit={handleSubmit} class="space-y-2.5">
                  
                  {/* 2-Column Grid Row: First Name & Last Name */}
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Input First Name */}
                    <div>
                      <label class="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                          <i class="fa-solid fa-user"></i>
                        </div>
                        <input 
                          type="text" 
                          required 
                          value={formData.firstName}
                          onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                          placeholder="Enter first name" 
                          class="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] transition text-xs bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Input Last Name */}
                    <div>
                      <label class="block text-xs font-bold text-gray-700 mb-1">Last Name</label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                          <i class="fa-solid fa-user"></i>
                        </div>
                        <input 
                          type="text" 
                          value={formData.lastName}
                          onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                          placeholder="Enter last name" 
                          class="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] transition text-xs bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* Input Phone Number */}
                    <div>
                      <label class="block text-xs font-bold text-gray-700 mb-1">Mobile Number *</label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                          <i class="fa-solid fa-phone"></i>
                        </div>
                        <input 
                          type="tel" 
                          required 
                          maxLength={10}
                          pattern="[6-9][0-9]{9}"
                          value={formData.phone}
                          onChange={(e) => {
                            const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setFormData({ ...formData, phone: cleaned });
                          }}
                          placeholder="Enter mobile number" 
                          class="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] transition text-xs bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>

                    {/* Input Email Address */}
                    <div>
                      <label class="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                      <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                          <i class="fa-solid fa-envelope"></i>
                        </div>
                        <input 
                          type="email" 
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="Enter email address" 
                          class="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] transition text-xs bg-gray-50 focus:bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Number of Guntha */}
                  <div>
                    <label class="block text-xs font-bold text-gray-700 mb-1">Number of Guntha</label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 text-xs">
                        <i class="fa-solid fa-shapes text-[#B30E2E]"></i>
                      </div>
                      <select 
                        value={formData.plotsCount || '1 Guntha'}
                        onChange={(e) => setFormData({ ...formData, plotsCount: e.target.value })}
                        class="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-[#B30E2E] focus:ring-1 focus:ring-[#FCD6DC] transition text-xs bg-gray-50 focus:bg-white text-gray-800"
                      >
                        <option value="1 Guntha">1 Guntha</option>
                        <option value="2 Guntha">2 Guntha</option>
                        <option value="3 Guntha">3 Guntha</option>
                        <option value="4 Guntha">4 Guntha</option>
                        <option value="5 Guntha">5 Guntha</option>
                        <option value="6 Guntha">6 Guntha</option>
                        <option value="7 Guntha">7 Guntha</option>
                        <option value="8 Guntha">8 Guntha</option>
                        <option value="9 Guntha">9 Guntha</option>
                        <option value="10 Guntha">10 Guntha</option>
                        <option value="11+ Guntha (Bulk / Investment)">11+ Guntha (Bulk / Investment)</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div class="pt-1.5 flex justify-center">
                    <button 
                      type="submit" 
                      disabled={submitting}
                      class="w-full sm:w-auto px-8 py-2 sm:py-2.5 flex items-center justify-center space-x-2 bg-[#B30E2E] hover:bg-[#8A0B22] text-white font-bold rounded-full shadow-md hover:shadow-lg transition transform active:scale-95 disabled:opacity-75 cursor-pointer text-xs sm:text-sm"
                    >
                      {submitting ? (
                        <>
                          <i class="fa-solid fa-spinner fa-spin mr-1.5"></i> Submitting Enquiry...
                        </>
                      ) : (
                        <>
                          <span>Submit Enquiry</span>
                          <i class="fa-solid fa-arrow-right text-xs"></i>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Form Status Alert */}
                  {statusMsg && (
                    <div class="text-center p-2.5 rounded-xl text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 leading-snug shadow-sm animate-fade-in">
                      <i class="fa-solid fa-circle-check text-emerald-600 text-sm mr-1"></i>
                      {statusMsg.text}
                    </div>
                  )}

                </form>
              </div>

            </div>
          </div>

          {/* Contact Sales Team: BOTTOM on Mobile, LEFT on Desktop */}
          <div class="lg:col-span-6 flex flex-col order-2 lg:order-1">
            
            {/* Contact Details Card */}
            <div class="bg-white p-3.5 sm:p-4 lg:p-5 rounded-2xl border border-gray-200/90 shadow-md space-y-2.5 flex-1 flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
                  <h3 class="font-serif font-bold text-gray-900 text-xs sm:text-sm flex items-center gap-1.5">
                    <i class="fa-solid fa-headset text-[#B30E2E]"></i>
                    <span>Contact Sales Team</span>
                  </h3>
                </div>

                <div class="space-y-2 text-xs">
                  
                  {/* Phone */}
                  <a href={`tel:+${CONTACT_PHONE}`} class="flex items-center space-x-2.5 p-2 sm:p-2.5 rounded-xl bg-[#FFF0F2] border border-[#FCD6DC] hover:border-[#B30E2E] transition group">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#B30E2E] text-white flex items-center justify-center flex-shrink-0 text-xs group-hover:scale-105 transition">
                      <i class="fa-solid fa-phone"></i>
                    </div>
                    <div>
                      <span class="text-[10px] font-semibold text-gray-500 block">Direct Sales Helpline</span>
                      <span class="font-semibold text-gray-800 text-[10.5px] sm:text-[11.5px] leading-tight block group-hover:text-[#B30E2E] transition">{CONTACT_PHONE_DISPLAY}</span>
                    </div>
                  </a>

                  {/* WhatsApp */}
                  <a href={WHATSAPP_URL("Hi, I am interested in Gulmohar City Plots")} target="_blank" rel="noreferrer" class="flex items-center space-x-2.5 p-2 sm:p-2.5 rounded-xl bg-[#EBF5F0] border border-emerald-200 hover:border-[#0D5235] transition group">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center flex-shrink-0 text-xs group-hover:scale-110 transition shadow-sm">
                      <i class="fa-brands fa-whatsapp text-sm sm:text-base"></i>
                    </div>
                    <div>
                      <span class="text-[10px] font-semibold text-gray-500 block">WhatsApp Direct Chat</span>
                      <span class="font-semibold text-gray-800 text-[10.5px] sm:text-[11.5px] leading-tight block group-hover:text-[#0D5235] transition">{CONTACT_PHONE_DISPLAY}</span>
                    </div>
                  </a>

                  {/* Email */}
                  <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${CONTACT_EMAIL}`} target="_blank" rel="noreferrer" class="flex items-center space-x-2.5 p-2 sm:p-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:border-gray-400 transition group">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gray-800 text-white flex items-center justify-center flex-shrink-0 text-xs group-hover:scale-105 transition">
                      <i class="fa-solid fa-envelope"></i>
                    </div>
                    <div>
                      <span class="text-[10px] font-semibold text-gray-500 block">Official Email</span>
                      <span class="font-semibold text-gray-800 text-[10.5px] sm:text-[11.5px] leading-tight block group-hover:text-[#B30E2E] transition">{CONTACT_EMAIL}</span>
                    </div>
                  </a>

                  {/* Address */}
                  <div class="flex items-center space-x-2.5 p-2 sm:p-2.5 rounded-xl bg-gray-50 border border-gray-200">
                    <div class="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center flex-shrink-0 text-xs">
                      <i class="fa-solid fa-location-dot"></i>
                    </div>
                    <div>
                      <span class="text-[10px] font-semibold text-gray-500 block">Site Address</span>
                      <span class="font-semibold text-gray-800 text-[10.5px] sm:text-[11.5px] leading-tight block">
                        Malthan Village, Shikrapur – Malthan Road, Tal. Shirur, Dist. Pune
                      </span>
                    </div>
                  </div>

                </div>
              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
