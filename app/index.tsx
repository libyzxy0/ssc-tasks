import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function Index() {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) return null;

  if (!user) return <Redirect href="/signin" />;
  if (user.role === 'admin') return <Redirect href="/(admin)" />;
  if (user.role === 'member') return <Redirect href="/(member)" />;

  return null;
}