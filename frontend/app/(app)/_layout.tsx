import { Redirect, Slot, useRouter, usePathname } from "expo-router";
import { useAuth, useUser } from "@clerk/expo";
import { useEffect, useState, useRef } from "react";

export default function AppLayout() {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  const { user } = useUser();
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const pathname = usePathname();
  const syncAttempted = useRef(false);

  useEffect(() => {
    async function syncAndCheckProfile() {
      if (!isLoaded || !isSignedIn || !user || syncAttempted.current) {
        if (isLoaded && !isSignedIn) setCheckingProfile(false);
        return;
      }

      console.log("[AppLayout] Syncing profile with backend...");
      syncAttempted.current = true;

      try {
        const token = await getToken();
        
        const syncResponse = await fetch("http://localhost:5118/api/users/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            clerkId: user.id,
            email: user.primaryEmailAddress?.emailAddress,
            firstName: user.firstName,
            lastName: user.lastName,
          }),
        });

        if (syncResponse.ok) {
          const dbUser = await syncResponse.json();
          console.log("[AppLayout] DB Sync successful.");
          
          // Check for ANY missing required information
          if (!dbUser.phone || !dbUser.firstName || !dbUser.lastName) {
            console.log("[AppLayout] User needs onboarding (missing phone or names).");
            setNeedsOnboarding(true);
          }
        } else {
          console.error("[AppLayout] Sync failed:", await syncResponse.text());
        }
      } catch (error) {
        console.warn("[AppLayout] Sync network error:", error);
      } finally {
        setCheckingProfile(false);
      }
    }

    syncAndCheckProfile();
  }, [isLoaded, isSignedIn, user]);

  if (!isLoaded || (isSignedIn && checkingProfile)) {
    return null; 
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  // Redirect to onboarding if profile is incomplete
  if (needsOnboarding && pathname !== "/complete-profile") {
    return <Redirect href="/complete-profile" />;
  }

  return <Slot />;
}
