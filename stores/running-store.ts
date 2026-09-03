import { create } from 'zustand';

export type RunStatus = 'idle' | 'active' | 'paused' | 'complete';

export interface Coordinate {
  latitude: number;
  longitude: number;
}

interface RunningState {
  status: RunStatus;
  startTime: number | null;
  elapsedSeconds: number;
  distanceKm: number;
  currentPaceMinPerKm: number;
  calories: number;
  steps: number;
  routeCoordinates: Coordinate[];
  
  // Actions
  setStatus: (status: RunStatus) => void;
  startRun: () => void;
  pauseRun: () => void;
  resumeRun: () => void;
  stopRun: () => void;
  tick: () => void;
  updateProgress: (distance: number, pace: number, cals: number, newSteps: number, coord?: Coordinate) => void;
  resetRun: () => void;
}

export const useRunningStore = create<RunningState>((set, get) => ({
  status: 'idle',
  startTime: null,
  elapsedSeconds: 0,
  distanceKm: 0,
  currentPaceMinPerKm: 0,
  calories: 0,
  steps: 0,
  routeCoordinates: [],

  setStatus: (status) => set({ status }),

  startRun: () => set({
    status: 'active',
    startTime: Date.now(),
    elapsedSeconds: 0,
    distanceKm: 0,
    currentPaceMinPerKm: 0,
    calories: 0,
    steps: 0,
    routeCoordinates: [],
  }),

  pauseRun: () => set({ status: 'paused' }),

  resumeRun: () => set({ status: 'active' }),

  stopRun: () => set({ status: 'complete' }),

  tick: () => {
    const { status, elapsedSeconds } = get();
    if (status === 'active') {
      set({ elapsedSeconds: elapsedSeconds + 1 });
    }
  },

  updateProgress: (distanceKm, currentPaceMinPerKm, calories, steps, coord) => set((state) => {
    if (state.status !== 'active') return state;
    
    const newCoords = coord 
      ? [...state.routeCoordinates, coord] 
      : state.routeCoordinates;
      
    return {
      distanceKm,
      currentPaceMinPerKm,
      calories,
      steps,
      routeCoordinates: newCoords
    };
  }),

  resetRun: () => set({
    status: 'idle',
    startTime: null,
    elapsedSeconds: 0,
    distanceKm: 0,
    currentPaceMinPerKm: 0,
    calories: 0,
    steps: 0,
    routeCoordinates: [],
  }),
}));
