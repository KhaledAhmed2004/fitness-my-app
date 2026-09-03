import * as Location from 'expo-location';
import { useRunningStore } from '../stores/running-store';
import { RunningAPI } from '../services/running-api';

let locationSubscription: Location.LocationSubscription | null = null;
let timerInterval: ReturnType<typeof setInterval> | null = null;
let lastLocation: Location.LocationObjectCoords | null = null;

// Helper to calculate distance between two coordinates in km (Haversine formula)
function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export const RunningUseCases = {
  async requestPermissions(): Promise<boolean> {
    const { status: locStatus } = await Location.requestForegroundPermissionsAsync();
    
    return locStatus === 'granted';
  },

  async startRun() {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) {
      throw new Error("Location permission is required to track your run.");
    }

    const store = useRunningStore.getState();
    store.startRun();
    lastLocation = null;

    this.startTracking();
  },

  async startTracking() {
    const store = useRunningStore.getState();
    
    // 1. Start Timer
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      useRunningStore.getState().tick();
    }, 1000);

    // 2. Start GPS Tracking
    locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 2000,
        distanceInterval: 5,
      },
      (location) => {
        const state = useRunningStore.getState();
        if (state.status !== 'active') return;

        const { latitude, longitude, speed } = location.coords;
        
        // Calculate distance
        let newDist = state.distanceKm;
        if (lastLocation) {
          const dist = getDistanceFromLatLonInKm(
            lastLocation.latitude, lastLocation.longitude,
            latitude, longitude
          );
          newDist += dist;
        }
        lastLocation = location.coords;

        // Calculate pace (min/km). Speed is in m/s.
        // Pace = 1 / (speed in km/min) = (1000 / 60) / speed
        let currentPace = 0;
        if (speed && speed > 0.5) { // Only calculate if moving > 0.5 m/s
           currentPace = (1000 / speed) / 60; 
        }

        // Estimate calories (~1 kcal per kg per km, assuming 70kg user for now)
        const calories = Math.round(70 * newDist);

        store.updateProgress(newDist, currentPace, calories, state.steps, { latitude, longitude });
      }
    );
  },

  pauseRun() {
    useRunningStore.getState().pauseRun();
    this.stopTracking();
  },

  resumeRun() {
    useRunningStore.getState().resumeRun();
    this.startTracking();
  },

  stopTracking() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    if (locationSubscription) {
      locationSubscription.remove();
      locationSubscription = null;
    }
  },

  async finishRun(): Promise<string | null> {
    const state = useRunningStore.getState();
    if (state.status === 'idle') return null;

    this.stopTracking();
    state.stopRun();

    // Only save if meaningful distance was covered (> 0.01 km) or time passed (> 10 sec)
    if (state.distanceKm > 0.01 || state.elapsedSeconds > 10) {
      const avgPace = state.distanceKm > 0 ? (state.elapsedSeconds / 60) / state.distanceKm : 0;
      
      const runId = await RunningAPI.saveRun({
        date: state.startTime || Date.now(),
        distance_km: state.distanceKm,
        duration_sec: state.elapsedSeconds,
        pace_min_per_km: avgPace,
        calories: state.calories,
        steps: state.steps,
        route_json: JSON.stringify(state.routeCoordinates)
      });
      return runId;
    }
    
    return null;
  },
  
  discardRun() {
    this.stopTracking();
    useRunningStore.getState().resetRun();
  },

  async getHistory() {
    return RunningAPI.getRuns();
  }
};
