export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { email, language } = req.body;

    // Validate email
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    // Get Brevo credentials from environment variables
    const BREVO_API_KEY = process.env.BREVO_API_KEY;
    const BREVO_LIST_ID = process.env.BREVO_LIST_ID;

    if (!BREVO_API_KEY || !BREVO_LIST_ID) {
      console.error('Missing Brevo credentials in environment variables');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Call Brevo API
    const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': BREVO_API_KEY
      },
      body: JSON.stringify({
        email: email,
        listIds: [parseInt(BREVO_LIST_ID)],
        updateEnabled: true,
        attributes: {
          LANGUAGE: language || 'en',
          SIGNUP_SOURCE: 'European Guitar Hub Landing Page',
          SIGNUP_DATE: new Date().toISOString()
        }
      })
    });

    const data = await brevoResponse.json();

    // Handle Brevo response
    if (brevoResponse.ok || brevoResponse.status === 204) {
      return res.status(200).json({ 
        success: true, 
        message: 'Successfully subscribed!' 
      });
    } else if (brevoResponse.status === 400 && data.code === 'duplicate_parameter') {
      // Contact already exists - this is actually fine
      return res.status(200).json({ 
        success: true, 
        message: 'You\'re already subscribed!' 
      });
    } else {
      console.error('Brevo API error:', data);
      return res.status(400).json({ 
        error: 'Subscription failed. Please try again.' 
      });
    }

  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ 
      error: 'An error occurred. Please try again later.' 
    });
  }
}
