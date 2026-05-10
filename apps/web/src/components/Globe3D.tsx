"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, OrbitControls, Environment, Float } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";

function AnimatedSphere() {
  const sphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (sphereRef.current) {
      sphereRef.current.rotation.y += 0.002;
      sphereRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <Sphere ref={sphereRef} args={[1, 64, 64]} scale={2}>
        <MeshDistortMaterial
          color="#06b6d4" // Cyan 500
          attach="material"
          distort={0.3}
          speed={1.5}
          roughness={0.2}
          metalness={0.8}
          wireframe={false}
          emissive="#3b82f6" // Blue 500
          emissiveIntensity={0.5}
        />
      </Sphere>
      {/* Outer wireframe glow */}
      <Sphere args={[1.05, 32, 32]} scale={2}>
        <meshBasicMaterial color="#8b5cf6" wireframe transparent opacity={0.15} />
      </Sphere>
    </Float>
  );
}

export default function Globe3D() {
  return (
    <div className="w-full h-full relative">
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} color="#ffffff" />
        <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#8b5cf6" />
        
        <AnimatedSphere />
        
        <OrbitControls 
          enableZoom={false} 
          enablePan={false}
          autoRotate 
          autoRotateSpeed={0.5}
          maxPolarAngle={Math.PI / 2 + 0.2}
          minPolarAngle={Math.PI / 2 - 0.2}
        />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
