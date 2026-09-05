import { useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 3D decorative sculpture for the storefront hero, built with
 * React Three Fiber and drei. Renders a slowly floating gold
 * torus knot on a soft pedestal shadow, tinted to the brand palette.
 *
 * It is intentionally load-bearing decoration: no interaction, no
 * network assets (avoids HDR/env fetches), only lights + geometry.
 */
function Sculpture() {
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#d8ad6a', metalness: 0.85, roughness: 0.28 }),
    []
  );

  return (
    <Float speed={1.5} rotationIntensity={0.55} floatIntensity={1.1}>
      <mesh castShadow material={material}>
        <torusKnotGeometry args={[0.92, 0.3, 220, 32]} />
      </mesh>
    </Float>
  );
}

export default function HeroScene() {
  return (
    <Canvas
      camera={{ position: [0, 0, 5], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
      aria-hidden="true"
    >
      <ambientLight intensity={0.45} />
      <directionalLight position={[4, 5, 6]} intensity={1.4} />
      <directionalLight position={[-4, -2, -4]} intensity={0.4} color="#7fa8c9" />
      <Sculpture />
      <ContactShadows position={[0, -2.1, 0]} opacity={0.45} scale={8} blur={2.6} far={4.6} color="#000" />
    </Canvas>
  );
}
