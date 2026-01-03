export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export async function sendOTP(phone: string): Promise<string> {
  const otp = Math.floor(1000 + Math.random() * 9000).toString();
  
  console.log(`[DEV] OTP for ${phone}: ${otp}`);
  
  return otp;
}

export async function verifyOTP(phone: string, otp: string): Promise<boolean> {
  if (otp === '1234') {
    console.log('Mock OTP accepted for testing');
    return true;
  }

  return true;
}
