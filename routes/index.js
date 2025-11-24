// Main routes for the landing page
const express = require('express');
const router = express.Router();
const leadHandler = require('../middleware/leadHandler');

// Home page route
router.get('/', (req, res) => {
  // Get the canonical URL (use the host from request or default to production URL)
  const protocol = req.protocol || 'https';
  const host = req.get('host') || 'www.finlaybrewerinternational.com';
  const canonicalUrl = `${protocol}://${host}${req.path}`;
  
  res.render('index', {
    title: 'Finlay Brewer International - Properties in Nice, France',
    canonicalUrl: canonicalUrl
  });
});

// Lead submission route
router.post('/submit-lead', async (req, res) => {
  try {
    // Validate required fields
    const leadData = req.body;
    
    // Check if it's a contact form or property inquiry
    const isPropertyInquiry = leadData.property !== undefined;
    
    if (isPropertyInquiry) {
      // Property inquiry validation
      if (!leadData.name || !leadData.email || !leadData.countryCode || !leadData.phone || !leadData.message) {
        return res.status(400).json({
          success: false,
          message: 'Please fill in all required fields.'
        });
      }
    } else {
      // Contact form validation
      if (!leadData.firstName || !leadData.lastName || !leadData.emailAddress || 
          !leadData.phoneNumber || !leadData.message) {
        return res.status(400).json({
          success: false,
          message: 'Please fill in all required fields.'
        });
      }
    }

    // Process the lead (save + send email)
    const result = await leadHandler.processLead(leadData);

    res.json({
      success: true,
      message: 'Thank you for your interest! We will be in touch soon.',
      leadId: result.leadId
    });
  } catch (error) {
    console.error('Lead submission error:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your submission. Please try again later.'
    });
  }
});

module.exports = router;

