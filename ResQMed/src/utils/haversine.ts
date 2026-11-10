export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type HaversineOptions = {
  /**
   * Radius bumi. Nilai default 6.371.008,8 meter mengikuti
   * mean Earth radius yang umum dipakai untuk Haversine.
   */
  earthRadiusMeters?: number;
};

const DEFAULT_EARTH_RADIUS_METERS = 6_371_008.8;

const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Menghitung jarak great-circle antara dua koordinat dalam meter
 * menggunakan formula Haversine.
 *
 * Formula:
 * a = sin²(Δφ / 2) + cos φ1 * cos φ2 * sin²(Δλ / 2)
 * c = 2 * atan2(√a, √(1 - a))
 * d = R * c
 */
export function haversineDistanceMeters(
  origin: Coordinates,
  destination: Coordinates,
  options: HaversineOptions = {},
): number {
  const earthRadius = options.earthRadiusMeters ?? DEFAULT_EARTH_RADIUS_METERS;

  const latitudeDifference = toRadians(
    destination.latitude - origin.latitude,
  );
  const longitudeDifference = toRadians(
    destination.longitude - origin.longitude,
  );

  const originLatitude = toRadians(origin.latitude);
  const destinationLatitude = toRadians(destination.latitude);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(originLatitude) *
      Math.cos(destinationLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const centralAngle = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * centralAngle;
}

export function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) {
    return "Jarak tidak tersedia";
  }

  if (meters < 1_000) {
    return `${Math.round(meters)} m`;
  }

  return `${(meters / 1_000).toFixed(1)} km`;
}

export function findNearestLocation<T extends Coordinates>(
  origin: Coordinates,
  targets: readonly T[],
): (T & { distanceMeters: number }) | null {
  if (targets.length === 0) {
    return null;
  }

  let nearest: (T & { distanceMeters: number }) | null = null;
  let shortestDistance = Number.POSITIVE_INFINITY;

  for (const target of targets) {
    const distanceMeters = haversineDistanceMeters(origin, target);

    if (distanceMeters < shortestDistance) {
      shortestDistance = distanceMeters;
      nearest = { ...target, distanceMeters };
    }
  }

  return nearest;
}