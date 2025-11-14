import React, {
  createContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { UserProfile } from "../types/localstore.types";
import { useUser } from "../hooks/useUser";
import { calculateLevel } from "../utils/levels";
import { syncService } from "../server/services/sync";
import { useDailyTracking } from "../hooks/useDailyTracking";

type ProfileContextType = {
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  awardXP: (xpAmount: number) => Promise<number | undefined>;
  refreshProfile: () => Promise<void>;
};

export const ProfileContext = createContext<ProfileContextType | undefined>(
  undefined
);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useUser();
  const dailyTracking = useDailyTracking();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load profile once when user changes
  useEffect(() => {
    if (!user?.id) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        const data = await syncService.getLocalProfile(user.id);
        setProfile(data);
        setError(null);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [user?.id]);

  // Award XP with optimistic update
  const awardXP = useCallback(
    async (xpAmount: number): Promise<number | undefined> => {
      if (!user?.id || !profile) {
        throw new Error("No user or profile available");
      }

      const newXP = profile.experience_points + xpAmount;
      const newLevel = calculateLevel(newXP);
      const didLevelUp = newLevel > profile.level;

      // Optimistic update - update UI immediately
      const updatedProfile = {
        ...profile,
        experience_points: newXP,
        level: newLevel,
      };
      setProfile(updatedProfile);

      try {
        // Update database (local + queue for sync)
        await syncService.updateLocalProfile(user.id, {
          experience_points: newXP,
          level: newLevel,
        });

        return didLevelUp ? newLevel : undefined;
      } catch (err) {
        // Rollback on error
        console.error("Failed to award XP:", err);
        setProfile(profile); // Revert to previous state
        throw err;
      }
    },
    [user?.id, profile, dailyTracking]
  );

  // Refresh profile from local DB
  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;

    try {
      const data = await syncService.getLocalProfile(user.id);
      setProfile(data);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  }, [user?.id]);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        awardXP,
        refreshProfile,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
}
