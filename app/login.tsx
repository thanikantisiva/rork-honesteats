import { useState, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Phone } from 'lucide-react-native';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { auth } from '@/lib/firebase';
import { PhoneAuthProvider, signInWithCredential } from 'firebase/auth';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [verificationId, setVerificationId] = useState<string>('');
  const router = useRouter();
  const { loginWithFirebase } = useAuth();
  const recaptchaVerifier = useRef<any>(null);

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }

    setIsLoading(true);
    try {
      const phoneNumber = `+91${phone}`;
      console.log('Sending OTP to:', phoneNumber);
      
      const phoneProvider = new PhoneAuthProvider(auth);
      const verificationIdResult = await phoneProvider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier.current
      );
      
      setVerificationId(verificationIdResult);
      setShowOtp(true);
      Alert.alert('OTP Sent', 'Please check your phone for the 6-digit OTP');
    } catch (error: any) {
      console.error('Failed to send OTP:', error);
      Alert.alert('Error', error.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      Alert.alert('Invalid OTP', 'Please enter a 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Step 1: Verifying OTP with Firebase...');
      const credential = PhoneAuthProvider.credential(verificationId, otp);
      const result = await signInWithCredential(auth, credential);
      console.log('Step 2: Firebase authentication successful');
      
      console.log('Step 3: Getting Firebase ID token...');
      const idToken = await result.user.getIdToken();
      console.log('Step 4: Firebase ID token obtained');
      
      console.log('Step 5: Calling backend login...');
      const success = await loginWithFirebase(`+91${phone}`, idToken);
      console.log('Step 6: Backend login result:', success);
      
      if (success) {
        console.log('Step 7: Login successful, navigating to home');
        router.replace('/(tabs)');
      } else {
        console.log('Step 7: Backend login returned false');
        Alert.alert('Login Failed', 'Failed to complete login. Please try again.');
      }
    } catch (error: any) {
      console.error('Verification failed at some step:', error);
      console.error('Error details:', JSON.stringify(error, null, 2));
      Alert.alert('Login Failed', error.message || 'Please try again');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={auth.app.options}
        attemptInvisibleVerification={Platform.OS === 'ios'}
      />
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Phone size={48} color="#EF4444" strokeWidth={2} />
          </View>
          <Text style={styles.title}>Welcome to NearBite</Text>
          <Text style={styles.subtitle}>Enter your phone number to continue</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.phoneInput}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.input}
                placeholder="9876543210"
                keyboardType="phone-pad"
                maxLength={10}
                value={phone}
                onChangeText={setPhone}
                editable={!showOtp}
              />
            </View>
          </View>

          {showOtp && (
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowOtp(false)}>
                <Text style={styles.changeNumber}>Change number</Text>
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={showOtp ? handleVerifyOtp : handleSendOtp}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Please wait...' : showOtp ? 'Verify & Continue' : 'Send OTP'}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    justifyContent: 'space-between',
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    gap: 16,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    gap: 24,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#374151',
  },
  phoneInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  countryCode: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#111827',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  otpInput: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    height: 56,
    fontSize: 18,
    fontWeight: '600' as const,
    letterSpacing: 8,
    textAlign: 'center',
    color: '#111827',
  },
  changeNumber: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '600' as const,
    textAlign: 'center',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  footer: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
  },
});
