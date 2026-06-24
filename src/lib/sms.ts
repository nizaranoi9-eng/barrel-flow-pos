import twilio from 'twilio';

// Twilio configuration
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;

// Check if Twilio is configured
export function isTwilioConfigured(): boolean {
  return !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);
}

// Send SMS using Twilio
export async function sendSMS(to: string, message: string): Promise<{ success: boolean; error?: string }> {
  // If Twilio is not configured, return demo mode
  if (!isTwilioConfigured()) {
    console.log('[SMS DEMO MODE] Twilio not configured. Would send SMS to:', to);
    console.log('[SMS DEMO MODE] Message:', message);
    return { success: true }; // Return success for demo mode
  }

  try {
    const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    
    // Format phone number (ensure it has country code)
    let formattedPhone = to.replace(/[\s-]/g, '');
    if (!formattedPhone.startsWith('+')) {
      // Default to India country code if not specified
      formattedPhone = '+91' + formattedPhone;
    }

    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE_NUMBER,
      to: formattedPhone,
    });

    if (result.status === 'failed' || result.status === 'undelivered') {
      console.error('Twilio SMS failed:', result.errorMessage);
      return { success: false, error: result.errorMessage || 'Failed to send SMS' };
    }

    console.log('SMS sent successfully, SID:', result.sid);
    return { success: true };
  } catch (error) {
    console.error('Twilio error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to send SMS' 
    };
  }
}

// Send OTP via SMS
export async function sendOTP(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const message = `Your RetailFlow POS verification code is: ${otp}. Valid for 5 minutes. Do not share this code.`;
  return sendSMS(phone, message);
}
