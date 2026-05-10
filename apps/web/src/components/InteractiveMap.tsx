"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

interface InteractiveMapProps {
  center?: [number, number];
  zoom?: number;
  markers?: { position: [number, number]; title: string }[];
  isNavigating?: boolean;
}

export default function InteractiveMap({ 
  center = [35.6762, 139.6503], // Tokyo default
  zoom = 13, 
  markers = [],
  isNavigating = false 
}: InteractiveMapProps) {
  
  return (
    <div className="w-full h-full relative">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        {/* Google Satellite Imagery — Latest 2026 */}
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
          maxZoom={20}
        />
        
        <ChangeView center={center} zoom={isNavigating ? 15 : zoom} />

        {markers.map((marker, idx) => (
          <Marker key={idx} position={marker.position}>
            <Popup>
              <div className="text-black font-medium">{marker.title}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Overlay gradient for cinematic look */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.5)] z-[1000]" />
    </div>
  );
}
