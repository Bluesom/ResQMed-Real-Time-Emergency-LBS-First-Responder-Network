import { useCallback, useEffect, useRef, useState } from "react";
import * as Location from "expo-location";

import type { Coordinates } from "../utils/haversine";
import type { LocationTrackingStatus } from "../types/emergency";

export type AdaptiveTrackingProfile = "battery_saver" | "balanced" | "high_accuracy";

export type UseLocationTrackingOptions = {
  /**
   * Profil adaptif menentukan accuracy dan distanceInterval.
   * Default: balanced, cocok untuk pemetaan darurat tanpa boros baterai.
   */
  profile?: AdaptiveTrackingProfile;
  /** Dipanggil setiap kali lokasi valid diterima. */
  onLocationChange?: (coordinates: Coordinates) => void;
};

export type UseLocationTrackingResult = {
  status: LocationTrackingStatus;
  errorMessage: string | null;
  currentLocation: Coordinates | null;
  isTracking: boolean;
  requestPermissionAndStart: () => Promise<void>;
  stopTracking: () => void;
};

const TRACKING_CONFIG: Record<
  AdaptiveTrackingProfile,
  {
    accuracy: Location.LocationAccuracy;
    distanceInterval: number;
  }
> = {
  battery_saver: {
    accuracy: Location.Accuracy.Low,
    distanceInterval: 50,
  },
  balanced: {
    accuracy: Location.Accuracy.Balanced,
    distanceInterval: 15,
  },
  high_accuracy: {
    accuracy: Location.Accuracy.High,
    distanceInterval: 5,
  },
};

export function useLocationTracking(
  options: UseLocationTrackingOptions = {},
): UseLocationTrackingResult {
  const { profile = "balanced", onLocationChange } = options;

  const [status, setStatus] = useState<LocationTrackingStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    null,
  );

  const subscriptionRef = useRef<Location.LocationSubscription | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const onLocationChangeRef = useRef(onLocationChange);

  /**
   * Ref mencegah callback baru menyebabkan subscription lokasi
   * dibuat ulang setiap render.
   */
  useEffect(() => {
    onLocationChangeRef.current = onLocationChange;
  }, [onLocationChange]);

  const stopTracking = useCallback((): void => {
    subscriptionRef.current?.remove();
    subscriptionRef.current = null;
    setStatus("idle");
  }, []);

  const requestPermissionAndStart = useCallback(async (): Promise<void> => {
    try {
      setErrorMessage(null);
      setStatus("requesting_permission");

      const permission = await Location.requestForegroundPermissionsAsync();

      if (!isMountedRef.current) {
        return;
      }

      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setStatus("denied");
        setErrorMessage(
          "Izin lokasi ditolak. Aktifkan izin lokasi untuk menampilkan rumah sakit dan ambulans terdekat.",
        );
        return;
      }

      const config = TRACKING_CONFIG[profile];

    const subscription = await Location.watchPositionAsync(
        {
            accuracy: config.accuracy,
            distanceInterval: config.distanceInterval,
            mayShowUserSettingsDialog: true,
        },
        (location: Location.LocationObject) => {
            if (!isMountedRef.current) {
            return;
            }

            const coordinates: Coordinates = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            };

            setCurrentLocation(coordinates);
            setStatus("tracking");
            onLocationChangeRef.current?.(coordinates);
        },
        (reason: string) => {
            if (!isMountedRef.current) {
            return;
            }

            setStatus("error");
            setErrorMessage(
            reason || "Gagal memperbarui lokasi perangkat.",
            );
        },
    );

      if (!isMountedRef.current) {
        subscription.remove();
        return;
      }

      subscriptionRef.current = subscription;
    } catch (error) {
      if (!isMountedRef.current) {
        return;
      }

      setStatus("error");
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Terjadi kesalahan saat mengaktifkan pelacakan lokasi.",
      );
    }
  }, [profile]);

  /**
   * Cleanup wajib: menghentikan watcher ketika screen unmount
   * agar tidak terjadi memory leak dan update lokasi liar.
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, []);

  return {
    status,
    errorMessage,
    currentLocation,
    isTracking: status === "tracking",
    requestPermissionAndStart,
    stopTracking,
  };
}