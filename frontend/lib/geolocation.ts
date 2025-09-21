export interface GeolocationResult {
  coords: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  timestamp: number;
}

export function getCurrentPosition(): Promise<GeolocationResult> {
  if (typeof window === 'undefined' || !('geolocation' in navigator)) {
    return Promise.reject(new Error('Geolocation is not available in this environment.'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          coords: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy
          },
          timestamp: position.timestamp
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  });
}
