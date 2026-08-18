import { router } from 'expo-router';
import { useEffect } from 'react';

export default function LoginScreen() {
  useEffect(() => {
    router.replace('/');
  }, []);

  return null;
}
