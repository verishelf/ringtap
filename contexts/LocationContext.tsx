import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const STORAGE_KEY = 'ringtap_location_enabled';

type LocationContextValue = {
  locationEnabled: boolean;
  setLocationEnabled: (enabled: boolean) => void;
};

export const LocationContext = createContext<LocationContextValue | null>(null);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [locationEnabled, setLocationEnabledState] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw !== null) setLocationEnabledState(raw === 'true');
    });
  }, []);

  const setLocationEnabled = useCallback((enabled: boolean) => {
    setLocationEnabledState(enabled);
    AsyncStorage.setItem(STORAGE_KEY, String(enabled));
  }, []);

  return (
    <LocationContext.Provider value={{ locationEnabled, setLocationEnabled }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  return ctx ?? { locationEnabled: true, setLocationEnabled: () => {} };
}
