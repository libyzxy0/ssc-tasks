import { SocialConnections } from '@/components/social-connections';
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
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import React, { useState } from 'react';
import { Pressable, type TextInput, View } from 'react-native';
import { auth } from '@/FirebaseConfig'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { db } from '@/FirebaseConfig'
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from 'expo-router'

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [firstname, setFirstname] = useState<string | null>(null);
  const [lastname, setLastname] = useState<string | null>(null);
  const [position, setPosition] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    try {
    setLoading(true);
    const user = await createUserWithEmailAndPassword(auth, email, password);
    if (user) {
      console.log(user.user.uid);
      await setDoc(doc(db, "users", user.user.uid), {
        uid: user.user.uid,
        signup_method: 'email',
        firstname,
        lastname,
        email,
        role: 'member',
        position,
        photo_url: null
      });
    }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Create Member Account</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Please fill up required fields below to create your member account.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="flex-1 flex-row justify-between">
              <View className="gap-1.5 w-[48%]">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  placeholder="Hanna"
                  autoComplete="given-name"
                  autoCapitalize="words"
                  returnKeyType="next"
                  submitBehavior="submit"
                  onChangeText={setFirstname}
                  value={firstname}
                />
              </View>
              <View className="gap-1.5 w-[48%]">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  placeholder="Ayeza"
                  autoComplete="family-name"
                  autoCapitalize="words"
                  returnKeyType="next"
                  onChangeText={setLastname}
                  value={lastname}
                />
              </View>
            </View>
            <View className="gap-1.5">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                placeholder="SSC President"
                autoCapitalize="words"
                returnKeyType="next"
                onChangeText={setPosition}
                value={position}
              />
            </View>
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="hanna@gmail.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                returnKeyType="next"
                onChangeText={setEmail}
                value={email}
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
              </View>
              <Input
                id="password"
                autoComplete="new-password"
                secureTextEntry
                onChangeText={setPassword}
                value={password}
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="confirm_password">Confirm Password</Label>
              </View>
              <Input
                id="confirm_password"
                secureTextEntry
              />
            </View>
            <Button disabled={loading} className="w-full" onPress={onSubmit}>
              <Text>Create Account</Text>
            </Button>
          </View>
          <Text className="text-center text-sm">
            Have an member account?{' '}
            <Pressable
              onPress={() => {
                router.push('/signin')
              }}>
              <Text className="text-sm underline underline-offset-4">Sign in</Text>
            </Pressable>
          </Text>
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground px-4 text-sm">or</Text>
            <Separator className="flex-1" />
          </View>
          <SocialConnections />
        </CardContent>
      </Card>
    </View>
  );
}
