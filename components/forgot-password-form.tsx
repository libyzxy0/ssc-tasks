import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';
import { useState } from 'react';
import { getAuth, sendPasswordResetEmail } from "firebase/auth";

export function ForgotPasswordForm({ onNavigateToLogin }: { onNavigateToLogin?: () => void }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  function onSubmit() {
    const auth = getAuth();
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setStatus('success');
      })
      .catch((error) => {
        setStatus('error');
        setErrorMessage(error.message ?? 'Something went wrong. Please try again.');
      });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forgot password?</CardTitle>
        <CardDescription>Enter your email to reset your password</CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'success' ? (
          <View>
            <Text className="text-green-400">
              Password reset email sent! Check your inbox.
            </Text>
            <Text className="text-gray-400">
              If its not showing, kindly check your spam folder.
            </Text>
            <Button onPress={onNavigateToLogin}>
              <Text>Back to Login</Text>
            </Button>
          </View>
        ) : (
          <View>
            <Label>Email</Label>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="butthanna7@gmail.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {status === 'error' && (
              <Text style={{ color: 'red', marginTop: 8 }}>
                {errorMessage}
              </Text>
            )}
            <Button onPress={onSubmit} style={{ marginTop: 12 }}>
              <Text>Reset your password</Text>
            </Button>
          </View>
        )}
      </CardContent>
    </Card>
  );
}