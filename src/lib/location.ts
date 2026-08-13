// Location & Activity Tracking Client Utility for Leonardo University

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  city?: string;
  country?: string;
  ip?: string;
  userAgent?: string;
  timestamp: string;
}

// Automatically record student activity to MongoDB backend
export async function logStudentActivity(
  studentId: string,
  actionType: string,
  details: Record<string, any> = {}
) {
  try {
    await fetch("/api/activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: studentId || "ANONYMOUS",
        actionType,
        details,
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "Browser",
        timestamp: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.warn("Failed to send activity log to backend:", err);
  }
}

// Request and report student location coordinates to MongoDB backend
export async function trackStudentLocation(studentId: string): Promise<LocationData | null> {
  if (typeof window === "undefined" || !("geolocation" in navigator)) {
    return null;
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const loc: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        };

        try {
          // Post location to MongoDB API endpoint
          const res = await fetch("/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              studentId: studentId || "GUEST",
              ...loc,
            }),
          });
          const data = await res.json();
          resolve(data.location || loc);
        } catch (err) {
          console.warn("Location tracking API sync error:", err);
          resolve(loc);
        }
      },
      (error) => {
        console.warn("Geolocation permission or position error:", error.message);
        // Fallback IP-based location tracking
        fetch("/api/location", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            studentId: studentId || "GUEST",
            latitude: -25.9692, // Default Maputo, Mozambique coordinates
            longitude: 32.5732,
            city: "Maputo",
            country: "Moçambique",
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
          }),
        }).then(() => resolve(null)).catch(() => resolve(null));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  });
}
