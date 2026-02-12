import { useAuth } from '@/hooks/useAuth';
import { Redirect, Stack } from 'expo-router';

export default function MemberLayout() {
  const { user } = useAuth();

  if (!user || user.role !== 'member') {
    return <Redirect href="/signin" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}