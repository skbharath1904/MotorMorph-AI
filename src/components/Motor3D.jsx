import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, ContactShadows } from '@react-three/drei';
import * as THREE from 'three';

const MotorModel = ({ dimensions }) => {
  const groupRef = useRef();

  // Extract dimensions or use defaults (mm to units conversion)
  const statorD = parseFloat(dimensions?.statorDiameter) / 100 || 1.5;
  const rotorL = parseFloat(dimensions?.rotorLength) / 100 || 1.8;
  const airGap = parseFloat(dimensions?.airGap) / 10 || 0.05;
  const statorR = statorD / 2;
  const rotorR = statorR - airGap;

  // Animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Stator (Outer Frame) */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[statorR, statorR, rotorL, 32, 1, true]} />
        <meshStandardMaterial 
          color="#222" 
          metalness={0.8} 
          roughness={0.2} 
          side={THREE.DoubleSide} 
          transparent 
          opacity={0.4} 
        />
      </mesh>

      {/* Stator Coils (Visual representation) */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[statorR, 0.05, 16, 32]} />
        <meshStandardMaterial color="#b87333" metalness={1} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[statorR + 0.02, statorR + 0.02, rotorL, 32, 1, true]} />
        <meshStandardMaterial color="#00d2ff" emissive="#00d2ff" emissiveIntensity={0.5} transparent opacity={0.1} />
      </mesh>

      {/* Rotor (Core) */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[rotorR, rotorR, rotorL * 0.95, 32]} />
        <meshStandardMaterial color="#444" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* Shaft */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.15, 0.15, rotorL * 1.8, 32]} />
        <meshStandardMaterial color="#888" metalness={1} roughness={0.1} />
      </mesh>
    </group>
  );
};

const Motor3D = ({ dimensions }) => {
  // Use a key based on dimensions to force the Canvas to re-mount when the motor changes
  // This prevents issues with Three.js state not updating correctly
  const vizKey = `${dimensions?.statorDiameter}-${dimensions?.rotorLength}`;

  return (
    <div 
      key={vizKey}
      style={{ 
        width: '100%', 
        height: '350px', 
        background: 'rgba(0,0,0,0.3)', 
        borderRadius: '16px', 
        overflow: 'hidden',
        border: '1px solid rgba(0, 210, 255, 0.2)',
        position: 'relative',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
      }}
    >
      <div style={{
        position: 'absolute',
        top: '15px',
        left: '15px',
        zIndex: 1,
        pointerEvents: 'none'
      }}>
        <h4 style={{ margin: 0, fontSize: '0.8rem', color: '#00d2ff', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
          3D Digital Twin
        </h4>
        <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
          Real-time Dimensional Visualization
        </p>
      </div>

      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[3, 2, 4]} fov={50} />
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        <MotorModel dimensions={dimensions} />
        
        <Environment preset="city" />
        <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={10} blur={2} far={4.5} />
        <OrbitControls enableZoom={true} enablePan={false} minDistance={2} maxDistance={10} />
      </Canvas>
    </div>
  );
};

export default Motor3D;
