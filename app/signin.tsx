import { SignInForm } from '@/components/sign-in-form';
import { ScrollView, View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { Redirect } from 'expo-router';

export default function SignInScreen() {
  const { user, isAuthReady } = useAuth();

  if (!isAuthReady) return null;
  if (user?.role === 'admin') return <Redirect href="/(admin)" />;
  if (user?.role === 'member') return <Redirect href="/(member)" />;
  
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="sm:flex-1 items-center justify-center p-4 py-8 sm:py-4 sm:p-6 mt-36"
      keyboardDismissMode="interactive">
      <View className="w-full max-w-sm">
        <SignInForm />
      </View>
    </ScrollView>
  );
}
