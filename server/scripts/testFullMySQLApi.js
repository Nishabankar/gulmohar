const express = require('express');
const { query } = require('../config/db');

const app = express();
app.use(express.json());
app.use('/api/enquiries', require('../routes/enquiryRoutes'));
app.use('/api/admin', require('../routes/adminRoutes'));

const runTests = async () => {
  const server = app.listen(0, async () => {
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;
    console.log(`🧪 Running Complete API Verification Suite on port ${port}...`);

    try {
      // 1. Test Admin Login
      console.log('1️⃣ Testing Admin Login (admin / admin123)...');
      const loginRes = await fetch(`${baseUrl}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'admin', password: 'admin123' })
      });
      const loginData = await loginRes.json();
      if (!loginData.success || !loginData.token) throw new Error('Login failed: ' + JSON.stringify(loginData));
      const token = loginData.token;
      console.log('   ✅ Admin Login Successful! Token acquired.');

      const authHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      // 2. Test Admin Token Verify
      console.log('2️⃣ Testing Token Verification...');
      const verifyRes = await fetch(`${baseUrl}/api/admin/verify`, { headers: authHeaders });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) throw new Error('Token verification failed');
      console.log('   ✅ Token Verified for user:', verifyData.admin.username);

      // 3. Test Stats Summary
      console.log('3️⃣ Testing Metrics Stats Summary...');
      const statsRes = await fetch(`${baseUrl}/api/admin/stats`, { headers: authHeaders });
      const statsData = await statsRes.json();
      if (!statsData.success) throw new Error('Stats failed');
      console.log('   ✅ Stats fetched:', statsData.stats);

      // 4. Test Create Agent
      console.log('4️⃣ Testing Create Sales Agent...');
      const agentRes = await fetch(`${baseUrl}/api/admin/agents`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ name: 'Rohan Sharma', username: 'rohan', password: 'agentpassword123', phone: '9876543210' })
      });
      const agentData = await agentRes.json();
      if (!agentData.success) throw new Error('Create Agent failed: ' + JSON.stringify(agentData));
      const agentId = agentData.data.id;
      console.log('   ✅ Sales Agent Created with ID:', agentId);

      // 5. Test List Agents
      console.log('5️⃣ Testing List Agents...');
      const listAgentsRes = await fetch(`${baseUrl}/api/admin/agents`, { headers: authHeaders });
      const listAgentsData = await listAgentsRes.json();
      if (!listAgentsData.success || listAgentsData.count < 1) throw new Error('List Agents failed');
      console.log('   ✅ Agents count:', listAgentsData.count);

      // 6. Test Create Lead (Public Enquiry)
      console.log('6️⃣ Testing Public Lead Submission (Round-Robin Agent Auto-Assignment)...');
      const leadRes = await fetch(`${baseUrl}/api/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Priya',
          lastName: 'Patel',
          phone: '9822001122',
          email: 'priya@gmail.com',
          plotInfo: 'Plot 15, Sector B',
          plotsCount: '2 Guntha',
          notes: 'Interested in site visit on weekend'
        })
      });
      const leadData = await leadRes.json();
      if (!leadData.success) throw new Error('Lead creation failed: ' + JSON.stringify(leadData));
      const leadId = leadData.data.id;
      console.log('   ✅ Lead Created with ID:', leadId, '| Assigned Agent:', leadData.data.assignedAgentName);

      // 7. Test Get All Enquiries
      console.log('7️⃣ Testing Get All Enquiries...');
      const enquiriesRes = await fetch(`${baseUrl}/api/admin/enquiries`, { headers: authHeaders });
      const enquiriesData = await enquiriesRes.json();
      if (!enquiriesData.success || enquiriesData.count < 1) throw new Error('Get enquiries failed');
      console.log('   ✅ Total enquiries fetched:', enquiriesData.count);

      // 8. Test Patch Enquiry (Update Lead & Log History)
      console.log('8️⃣ Testing Patch Lead Status & Notes...');
      const patchRes = await fetch(`${baseUrl}/api/admin/enquiries/${leadId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'Site Visit Scheduled',
          visitDate: '2026-10-15',
          notes: 'Confirmed site visit for 15th Oct'
        })
      });
      const patchData = await patchRes.json();
      if (!patchData.success) throw new Error('Patch lead failed: ' + JSON.stringify(patchData));
      console.log('   ✅ Lead Status Updated to:', patchData.data.status, '| History logs count:', patchData.data.history.length);

      // 9. Test Column Preferences
      console.log('9️⃣ Testing Column Preferences Update...');
      const prefsRes = await fetch(`${baseUrl}/api/admin/column-preferences`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          columnPreferences: [
            { id: 'firstName', label: 'First Name', visible: true },
            { id: 'phone', label: 'Phone', visible: true }
          ]
        })
      });
      const prefsData = await prefsRes.json();
      if (!prefsData.success) throw new Error('Column Preferences update failed');
      console.log('   ✅ Column Preferences updated.');

      // 10. Clean Up Test Data
      console.log('🧹 Cleaning up test lead and test agent from MySQL...');
      await fetch(`${baseUrl}/api/admin/enquiries/${leadId}`, { method: 'DELETE', headers: authHeaders });
      await fetch(`${baseUrl}/api/admin/agents/${agentId}`, { method: 'DELETE', headers: authHeaders });
      console.log('   ✅ Test data cleaned up successfully.');

      console.log('🎉 ALL ENDPOINTS VERIFIED & WORKING 100%!');
    } catch (err) {
      console.error('❌ TEST SUITE FAILED:', err.message);
    } finally {
      server.close();
    }
  });
};

runTests();
