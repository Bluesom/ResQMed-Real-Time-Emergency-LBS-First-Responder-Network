import { memo, useCallback, useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, {
  Callout,
  Marker,
  type MapPressEvent,
  type Region,
} from "react-native-maps";

import { formatDistance } from "../utils/haversine";
import type {
  EmergencyFacilityWithDistance,
} from "../types/emergency";

export type EmergencyMapProps = {
  userLocation: {
    latitude: number;
    longitude: number;
  } | null;
  facilities: readonly EmergencyFacilityWithDistance[];
  onFacilityPress?: (facility: EmergencyFacilityWithDistance) => void;
  onMapPress?: (coordinates: {
    latitude: number;
    longitude: number;
  }) => void;
};

const DEFAULT_REGION: Region = {
  latitude: -7.9666,
  longitude: 112.6326,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const FacilityMarker = memo(function FacilityMarker({
  facility,
  onPress,
}: {
  facility: EmergencyFacilityWithDistance;
  onPress: (facility: EmergencyFacilityWithDistance) => void;
}) {
  const handlePress = useCallback(() => {
    onPress(facility);
  }, [facility, onPress]);

  const isAmbulance = facility.type === "ambulance";

  return (
    <Marker
      coordinate={{
        latitude: facility.latitude,
        longitude: facility.longitude,
      }}
      title={facility.name}
      description={`${formatDistance(facility.distanceMeters)} dari lokasi Anda`}
      pinColor={isAmbulance ? "#ef4444" : "#2563eb"}
      onPress={handlePress}
    >
      <Callout>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{facility.name}</Text>
          <Text style={styles.calloutText}>{facility.address}</Text>
          <Text style={styles.calloutDistance}>
            {formatDistance(facility.distanceMeters)}
          </Text>
        </View>
      </Callout>
    </Marker>
  );
});

function EmergencyMapBase({
  userLocation,
  facilities,
  onFacilityPress,
  onMapPress,
}: EmergencyMapProps) {
  const handleFacilityPress = useCallback(
    (facility: EmergencyFacilityWithDistance) => {
      onFacilityPress?.(facility);
    },
    [onFacilityPress],
  );

  const handleMapPress = useCallback(
    (event: MapPressEvent) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;

      onMapPress?.({
        latitude,
        longitude,
      });
    },
    [onMapPress],
  );

  /**
   * Region awal peta hanya dihitung ulang ketika lokasi pengguna berubah.
   * Ini menghindari re-render MapView yang tidak perlu.
   */
  const initialRegion = useMemo<Region>(() => {
    if (!userLocation) {
      return DEFAULT_REGION;
    }

    return {
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.03,
      longitudeDelta: 0.03,
    };
  }, [userLocation]);

  const facilityMarkers = useMemo(
    () =>
      facilities.map((facility) => (
        <FacilityMarker
          key={facility.id}
          facility={facility}
          onPress={handleFacilityPress}
        />
      )),
    [facilities, handleFacilityPress],
  );

  return (
    <MapView
      style={styles.map}
      initialRegion={initialRegion}
      showsUserLocation={Boolean(userLocation)}
      showsMyLocationButton
      onPress={handleMapPress}
      provider={undefined}
    >
      {userLocation ? (
        <Marker
          coordinate={userLocation}
          title="Posisi Anda"
          description="Lokasi pengguna/korban saat ini"
          pinColor="#16a34a"
        />
      ) : null}

      {facilityMarkers}
    </MapView>
  );
}

/**
 * React.memo mencegah EmergencyMap dirender ulang bila parent
 * melakukan state update yang tidak memengaruhi props peta.
 */
export const EmergencyMap = memo(EmergencyMapBase);

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
  },
  calloutContainer: {
    maxWidth: 240,
    padding: 8,
  },
  calloutTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
  },
  calloutText: {
    marginTop: 4,
    fontSize: 13,
    color: "#374151",
  },
  calloutDistance: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#dc2626",
  },
});