"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float, Text3D } from "@react-three/drei";
import type { Mesh } from "three";

function ProductBox({ name }: { name: string }) {
 const meshRef = useRef < Mesh > (null);
 
 useFrame((state) => {
  if (!meshRef.current) return;
  meshRef.current.rotation.y = state.clock.elapsedTime * 0.3;
 });
 
 return (
  <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <boxGeometry args={[2, 2, 2]} />
        <meshStandardMaterial color="#888" metalness={0.4} roughness={0.2} />
      </mesh>
    </Float>
 );
}

interface Product3DViewerProps {
 name: string;
}

export function Product3DViewer({ name }: Product3DViewerProps) {
 return (
  <div className="h-full w-full">
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        <ProductBox name={name} />
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 4}
          maxPolarAngle={(3 * Math.PI) / 4}
        />
        <Environment preset="studio" />
      </Canvas>
      <p className="absolute bottom-3 left-0 right-0 text-center text-xs text-muted-foreground">
        Drag to rotate
      </p>
    </div>
 );
}