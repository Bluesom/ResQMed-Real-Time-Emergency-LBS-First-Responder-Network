import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Button,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { EmergencyMap } from "../components/EmergencyMap";
import { useLocationTracking } from "../hooks/useLocationTracking";
import {
  findNearestLocation,
  formatDistance,
  haversineDistanceMeters,
} from "../utils/haversine";
import type {
  EmergencyFacility,
  EmergencyFacilityWithDistance,
} from "../types/emergency";

const HOSPITALS: readonly EmergencyFacility[] = [
  {
    id: "rs-1",
    name: "RSUD Saiful Anwar",
    type: "hospital",
    address: "Jl. Jaksa Agung Suprapto, Malang",
    phone: "0341-362561",
    latitude: -7.9425,
    longitude: 112.6342,
  },
  {
    id: "rs-2",
    name: "RS Universitas Brawijaya",
    type: "hospital",
    address: "Jl. Pogung, Malang",
    phone: "0341-567811",
    latitude: -7.9297,
    longitude: 112.6324,
  },
];

const AMBULANCES: readonly EmergencyFacility[] = [
  {
    id: "amb-1",
    name: "Ambulans PMI Malang 01",
    type: "ambulance",
    address: "Posko PMI Malang",
    phone: "0341-362561",
    latitude: -7.9547,
    longitude: 112.6273,
  },
  {
    id: "amb-2",
    name: "Ambulans 118 Malang",
    type: "ambulance",
    address: "Pusat Panggilan Darurat",
    phone: "118",
    latitude: -7.9752,
    longitude: 112.6383,
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const [selectedFacility, setSelectedFacility] =
    useState<EmergencyFacilityWithDistance | null>(null);

  const {
    status,
    errorMessage,
    currentLocation,
    isTracking,
    requestPermissionAndStart,
    stopTracking,
  } = useLocationTracking({
    profile: "balanced",
  });

  /**
   * useMemo mencegah perhitungan Haversine dijalankan ulang
   * pada setiap render kecuali lokasi atau data fasilitas berubah.
   */
  const facilitiesWithDistance = useMemo<EmergencyFacilityWithDistance[]>(
    () => {
      if (!currentLocation) {
        return [];
      }

      const allFacilities = [...HOSPITALS, ...AMBULANCES];

      return allFacilities
        .map((facility) => ({
          ...facility,
          distanceMeters: haversineDistanceMeters(currentLocation, facility),
        }))
        .sort(
          (firstFacility, secondFacility) =>
            firstFacility.distanceMeters - secondFacility.distanceMeters,
        );
    },
    [currentLocation],
  );

  const nearestFacility = useMemo(() => {
    if (!currentLocation) {
      return null;
    }

    return findNearestLocation(currentLocation, [
      ...HOSPITALS,
      ...AMBULANCES,
    ]);
  }, [currentLocation]);

  const handleFacilityPress = useCallback(
    (facility: EmergencyFacilityWithDistance) => {
      setSelectedFacility(facility);
    },
    [],
  );

  const handleStartTracking = useCallback(() => {
    void requestPermissionAndStart();
  }, [requestPermissionAndStart]);

  const handleStopTracking = useCallback(() => {
    stopTracking();
  }, [stopTracking]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>ResQMed</Text>
        <Text style={styles.subtitle}>
          Smart Health & Emergency Response System
        </Text>
      </View>

      <View style={styles.statusContainer}>
        {status === "idle" ? (
          <Button title="Aktifkan Lokasi Darurat" onPress={handleStartTracking} />
        ) : null}

        {status === "requesting_permission" ? (
          <View style={styles.row}>
            <ActivityIndicator size="small" />
            <Text style={styles.statusText}>Meminta izin lokasi...</Text>
          </View>
        ) : null}

        {status === "denied" || status === "error" ? (
          <Text style={styles.errorText}>{errorMessage}</Text>
        ) : null}

        {isTracking ? (
          <View style={styles.row}>
            <Text style={styles.statusText}>Pelacakan lokasi aktif</Text>
            <Button title="Hentikan" onPress={handleStopTracking} />
          </View>
        ) : null}

        {nearestFacility ? (
          <Text style={styles.nearestText}>
            Terdekat: {nearestFacility.name} —{" "}
            {Math.round(nearestFacility.distanceMeters)} m
          </Text>
        ) : null}
      </View>

      <View style={styles.mapContainer}>
        <EmergencyMap
          userLocation={currentLocation}
          facilities={facilitiesWithDistance}
          onFacilityPress={handleFacilityPress}
        />
      </View>

      {selectedFacility ? (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selectedFacility.name}</Text>
          <Text style={styles.detailText}>
            {formatDistance(selectedFacility.distanceMeters)} •{" "}
            {selectedFacility.type === "ambulance" ? "Ambulans" : "Rumah Sakit"}
          </Text>
          <Button
            title="Buka Detail Darurat"
            onPress={() =>
              router.push({
                pathname: "/emergency-detail",
                params: {
                  facilityId: selectedFacility.id,
                },
              })
            }
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748b",
  },
  statusContainer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusText: {
    fontSize: 14,
    color: "#334155",
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
  },
  nearestText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0f766e",
  },
  mapContainer: {
    flex: 1,
    overflow: "hidden",
  },
  detailCard: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    gap: 8,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0f172a",
  },
  detailText: {
    fontSize: 14,
    color: "#475569",
  },
});