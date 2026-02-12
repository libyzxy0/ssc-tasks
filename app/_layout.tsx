import '@/global.css';
import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { getAuth, signOut } from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from "expo-system-ui";
import { AuthProvider, type AuthUser } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/FirebaseConfig';
import { doc, getDoc } from "firebase/firestore";

SplashScreen.preventAutoHideAsync();

export { ErrorBoundary } from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  SystemUI.setBackgroundColorAsync(NAV_THEME[colorScheme]['colors']['background']);

  return (
    <ThemeProvider value={NAV_THEME[colorScheme]}>
      <AuthProvider>
        <RootLayoutNav />
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <PortalHost />
      </AuthProvider>
    </ThemeProvider>
  );
}

function RootLayoutNav() {
  const { user, setUser, setIsAuthReady } = useAuth();
  const [appLoaded, setAppLoaded] = useState(false);
  const splashHidden = useRef(false);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
        } else {
          const docSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (!docSnap.exists()) {
            await signOut(auth);
            setUser(null);
          } else {
            setUser(docSnap.data() as AuthUser);
          }
        }
      } catch (err) {
        console.error("Auth error:", err);
        setUser(null);
      } finally {
        if (!splashHidden.current) {
          splashHidden.current = true;
          setAppLoaded(true);
          setIsAuthReady(true); // 👈 mark auth as resolved
        }
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (appLoaded) SplashScreen.hideAsync();
  }, [appLoaded]);

  if (!appLoaded) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen name="(member)" />
      <Stack.Screen name="signin" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}