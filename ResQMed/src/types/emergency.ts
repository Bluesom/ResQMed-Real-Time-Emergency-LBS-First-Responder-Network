import type { Coordinates } from "../utils/haversine";

export type EmergencyFacility = {
  id: string;
  name: string;
  type: "hospital" | "ambulance";
  address: string;
  phone: string;
  latitude: number;
  longitude: number;
};

export type EmergencyFacilityWithDistance = EmergencyFacility &
  Coordinates & {
    distanceMeters: number;
  };

export type LocationTrackingStatus =
  | "idle"
  | "requesting_permission"
  | "denied"
  | "tracking"
  | "error";