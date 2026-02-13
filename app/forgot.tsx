import { ForgotPasswordForm } from '@/components/forgot-password-form';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router'

export default function ForgotPasswordScreen() {
  const router = useRouter();
  return (
    <ScrollView
      keyboardShouldPersistTaps="handled"
      contentContainerClassName="flex-1 items-center justify-center p-4 py-8 sm:py-4 sm:p-6"
      keyboardDismissMode="interactive">
      <View className="w-full max-w-sm">
        <ForgotPasswordForm onNavigateToLogin={() => router.replace('/signin')}/>
      </View>
    </ScrollView>
  );
}