"use client";

import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Stars, Line } from "@react-three/drei";
import { useRef, useMemo } from "react";
import * as THREE from "three";

// Flight arc between two lat/lng points on the globe
function FlightArc({ from, to, color = "#06b6d4" }: { from: [number, number]; to: [number, number]; color?: string }) {
  const points = useMemo(() => {
    const toVec = (lat: number, lng: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lng + 180) * (Math.PI / 180);
      const r = 2.05;
      return new THREE.Vector3(
        -r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      );
    };
    const start = toVec(from[0], from[1]);
    const end = toVec(to[0], to[1]);
    const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(2.6);
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(40);
  }, [from, to]);

  return <Line points={points} color={color} lineWidth={1.2} transparent opacity={0.6} />;
}

// City pulse marker
function CityMarker({ lat, lng, color = "#f59e0b" }: { lat: number; lng: number; color?: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.scale.setScalar(1 + 0.3 * Math.sin(clock.elapsedTime * 2 + lat));
    }
  });
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const r = 2.08;
  const x = -r * Math.sin(phi) * Math.cos(theta);
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);

  return (
    <mesh ref={ref} position={[x, y, z]}>
      <sphereGeometry args={[0.025, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.9} />
    </mesh>
  );
}

function Globe() {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.elapsedTime * 0.08;
    }
  });

  // Use procedural globe with shader-like material
  return (
    <group>
      {/* Main globe */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshPhongMaterial
          color="#0a1628"
          emissive="#0d2040"
          specular="#1e40af"
          shininess={60}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh scale={1.04}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshBasicMaterial color="#06b6d4" transparent opacity={0.04} side={THREE.BackSide} />
      </mesh>

      {/* Grid lines */}
      {Array.from({ length: 9 }).map((_, i) => {
        const lat = -80 + i * 20;
        const phi = (90 - lat) * (Math.PI / 180);
        const r = 2.01;
        const pts = Array.from({ length: 65 }, (_, j) => {
          const theta = (j / 64) * Math.PI * 2;
          return new THREE.Vector3(
            -r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
          );
        });
        return <Line key={`lat-${i}`} points={pts} color="#1e3a5f" lineWidth={0.3} transparent opacity={0.3} />;
      })}
      {Array.from({ length: 12 }).map((_, i) => {
        const lng = i * 30;
        const pts = Array.from({ length: 65 }, (_, j) => {
          const lat = -90 + (j / 64) * 180;
          const phi = (90 - lat) * (Math.PI / 180);
          const theta = (lng + 180) * (Math.PI / 180);
          const r = 2.01;
          return new THREE.Vector3(
            -r * Math.sin(phi) * Math.cos(theta),
            r * Math.cos(phi),
            r * Math.sin(phi) * Math.sin(theta)
          );
        });
        return <Line key={`lng-${i}`} points={pts} color="#1e3a5f" lineWidth={0.3} transparent opacity={0.3} />;
      })}
    </group>
  );
}

const CITIES: Array<{ lat: number; lng: number; color: string }> = [
  { lat: 35.6762, lng: 139.6503, color: "#f59e0b" },  // Tokyo
  { lat: 48.8566, lng: 2.3522, color: "#8b5cf6" },    // Paris
  { lat: 1.3521, lng: 103.8198, color: "#10b981" },   // Singapore
  { lat: 40.7128, lng: -74.0060, color: "#ef4444" },  // New York
  { lat: 25.2048, lng: 55.2708, color: "#f59e0b" },   // Dubai
  { lat: -8.3405, lng: 115.0920, color: "#06b6d4" },  // Bali
  { lat: 51.5074, lng: -0.1278, color: "#8b5cf6" },   // London
];

const ARCS: Array<{ from: [number, number]; to: [number, number]; color: string }> = [
  { from: [35.6762, 139.6503], to: [48.8566, 2.3522], color: "#06b6d4" },
  { from: [1.3521, 103.8198], to: [25.2048, 55.2708], color: "#8b5cf6" },
  { from: [40.7128, -74.0060], to: [51.5074, -0.1278], color: "#10b981" },
  { from: [48.8566, 2.3522], to: [40.7128, -74.0060], color: "#f59e0b" },
];

export default function Globe3D() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 1, 5.5], fov: 42 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" />
        <directionalLight position={[-8, -3, -5]} intensity={0.4} color="#4f46e5" />
        <pointLight position={[0, 0, 4]} intensity={0.6} color="#06b6d4" />

        <Stars radius={80} depth={50} count={3000} factor={2} fade speed={0.5} />

        <Globe />

        {CITIES.map((c, i) => (
          <CityMarker key={i} lat={c.lat} lng={c.lng} color={c.color} />
        ))}
        {ARCS.map((arc, i) => (
          <FlightArc key={i} from={arc.from} to={arc.to} color={arc.color} />
        ))}

        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate
          autoRotateSpeed={0.3}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={(2 * Math.PI) / 3}
        />
      </Canvas>
    </div>
  );
}
