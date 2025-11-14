import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { dailyTrackingService } from "../server/services/dailyTracking";
import { useUser } from "../hooks/useUser";
import type { TodayData } from "../types/localstore.types";

export type DailyTrackingContextType = {
  // Today's data
  todayData: TodayData | null;
  loading: boolean;
  error: Error | null;

  // Actions for meals
  logMeal: (name: string, calories: number) => Promise<void>;

  // Actions for workouts
  logWorkout: (caloriesBurned: number) => Promise<void>;

  // Actions for stats
  addWater: (ml: number) => Promise<void>;
  addSleep: (minutes: number) => Promise<void>;

  // Refresh
  refreshTodayData: () => Promise<void>;
};

export const DailyTrackingContext = createContext<
  DailyTrackingContextType | undefined
>(undefined);

export function DailyTrackingProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const [todayData, setTodayData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load today's data when user changes
  const loadTodayData = useCallback(async () => {
    if (!user?.id) {
      setTodayData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await dailyTrackingService.getTodayData(user.id);
      setTodayData(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load today data:", err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTodayData();
  }, [loadTodayData]);

  const logMeal = useCallback(
    async (name: string, calories: number): Promise<void> => {
      if (!user?.id || !todayData) {
        throw new Error("No user or data available");
      }

      try {
        const newMeal = await dailyTrackingService.logMeal(
          user.id,
          name,
          calories
        );

        // Optimistic update
        setTodayData((prev) => {
          if (!prev) return prev;
          const newMeals = [...prev.meals, newMeal];
          const newCaloriesConsumed = prev.calories_consumed + calories;

          return {
            ...prev,
            meals: newMeals,
            calories_consumed: newCaloriesConsumed,
          };
        });
      } catch (err) {
        console.error("Failed to log meal:", err);
        // Reload to get accurate state
        await loadTodayData();
        throw err;
      }
    },
    [user?.id, todayData, loadTodayData]
  );

  const logWorkout = useCallback(
    async (caloriesBurned: number): Promise<void> => {
      if (!user?.id || !todayData) {
        throw new Error("No user or data available");
      }

      try {
        const newWorkout = await dailyTrackingService.logWorkout(
          user.id,
          caloriesBurned
        );

        // Optimistic update
        setTodayData((prev) => {
          if (!prev) return prev;
          const newWorkouts = [...prev.workouts, newWorkout];
          const newCaloriesBurned = prev.calories_burned + caloriesBurned;

          return {
            ...prev,
            workouts: newWorkouts,

            calories_burned: newCaloriesBurned,
          };
        });
      } catch (err) {
        console.error("Failed to log workout:", err);
        await loadTodayData();
        throw err;
      }
    },
    [user?.id, todayData, loadTodayData]
  );

  const addWater = useCallback(
    async (ml: number): Promise<void> => {
      if (!user?.id || !todayData) {
        throw new Error("No user or data available");
      }

      try {
        await dailyTrackingService.addWater(user.id, ml);

        // Optimistic update
        setTodayData((prev) => {
          if (!prev) return prev;
          const newWaterMl = prev.water_ml + ml;

          return {
            ...prev,
            water_ml: newWaterMl,
          };
        });
      } catch (err) {
        console.error("Failed to add water:", err);
        await loadTodayData();
        throw err;
      }
    },
    [user?.id, todayData, loadTodayData]
  );

  const addSleep = useCallback(
    async (minutes: number): Promise<void> => {
      if (!user?.id || !todayData) {
        throw new Error("No user or data available");
      }

      try {
        await dailyTrackingService.addSleep(user.id, minutes);

        // Optimistic update
        setTodayData((prev) => {
          if (!prev) return prev;

          return {
            ...prev,
            sleep_minutes: prev.sleep_minutes + minutes,
          };
        });
      } catch (err) {
        console.error("Failed to add sleep:", err);
        await loadTodayData();
        throw err;
      }
    },
    [user?.id, todayData, loadTodayData]
  );

  const refreshTodayData = useCallback(async () => {
    await loadTodayData();
  }, [loadTodayData]);

  return (
    <DailyTrackingContext.Provider
      value={{
        todayData,
        loading,
        error,
        logMeal,
        logWorkout,
        addWater,
        addSleep,
        refreshTodayData,
      }}
    >
      {children}
    </DailyTrackingContext.Provider>
  );
}
