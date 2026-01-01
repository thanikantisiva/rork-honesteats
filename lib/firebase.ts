import { initializeApp, getApps } from 'firebase/app';
import { getAuth, Auth, RecaptchaVerifier } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB0ZDkqIEvfg5ln892LI9cCZL0MScuqzUI",
  authDomain: "rork-honesteats.firebaseapp.com",
  projectId: "rork-honesteats",
  storageBucket: "rork-honesteats.firebasestorage.app",
  messagingSenderId: "1001473886162",
  appId: "1:1001473886162:android:837918a1e4516004d46a0b"
};

let auth: Auth;

if (getApps().length === 0) {
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
} else {
  auth = getAuth();
}

export { auth };
export { RecaptchaVerifier };
