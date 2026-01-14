import { useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';

export function useNetwork() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected && state.isInternetReachable !== false);
    });
    // fetch initial
    NetInfo.fetch().then(s => setIsConnected(s.isConnected && s.isInternetReachable !== false));
    return () => unsub();
  }, []);

  return { isConnected };
}