import { useAuth } from '@/hooks/useAuth';
import { Redirect, Stack } from 'expo-router';
import { getAuth } from 'firebase/auth'

export default function AdminLayout() {
  const { user } = useAuth();
  const auth = getAuth();

  if (!user || user.role !== 'admin') {
    return <Redirect href="/signin" />;
  }

  if (auth.currentUser) {
    if (!auth.currentUser.emailVerified) {
      return <Redirect href="/verify-email" />;
    }
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}