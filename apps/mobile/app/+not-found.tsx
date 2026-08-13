import { useEffect } from 'react';
import { useRouter } from 'expo-router';

// Catch-all for unmatched routes (e.g. intents sent by RNTP notification taps)
export default function NotFound() {
    const router = useRouter();
    useEffect(() => {
        router.replace('/(tabs)/albums');
    }, []);
    return null;
}
