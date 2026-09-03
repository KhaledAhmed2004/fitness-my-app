import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Polyline, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Vital } from '@/constants/vital-theme';
import type { Coordinate } from '@/stores/running-store';

const C = Vital.colors;

interface RunMapViewProps {
  coordinates: Coordinate[];
  isActive?: boolean;
}

// A minimal dark style for the map
const mapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }],
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }],
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }],
  },
];

export function RunMapView({ coordinates, isActive = false }: RunMapViewProps) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (isActive && coordinates.length > 0 && mapRef.current) {
      // Animate to latest coordinate
      mapRef.current.animateCamera({
        center: coordinates[coordinates.length - 1],
        pitch: 45,
        heading: 0,
        altitude: 1000,
        zoom: 17
      });
    }
  }, [coordinates, isActive]);

  // Initial region or fallback
  const initialRegion = coordinates.length > 0 ? {
    latitude: coordinates[0].latitude,
    longitude: coordinates[0].longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : undefined;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        customMapStyle={mapStyle}
        initialRegion={initialRegion}
        showsUserLocation={isActive}
        showsMyLocationButton={false}
        showsCompass={false}
      >
        <Polyline
          coordinates={coordinates}
          strokeColor={C.trainingAccent}
          strokeWidth={5}
          lineCap="round"
          lineJoin="round"
        />
        
        {/* If not active (e.g. summary screen), show start/end markers */}
        {!isActive && coordinates.length > 0 && (
          <>
            <Marker coordinate={coordinates[0]}>
              <View style={[styles.marker, { backgroundColor: C.primary }]} />
            </Marker>
            <Marker coordinate={coordinates[coordinates.length - 1]}>
              <View style={[styles.marker, { backgroundColor: C.trainingAccent }]} />
            </Marker>
          </>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.outlineVariant,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  marker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: '#fff',
  }
});
