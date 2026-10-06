import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Relief } from "@/components/piece-canvas";
import type { ViewSpec } from "@/components/view-spec";
import { mediaUrl, type WorldRole } from "@/lib/collection";
import type { Placement, SavedAsset } from "@/lib/store";

function stoneTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.fillStyle = "#2a241e";
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2200; i += 1) {
    const tone = 28 + Math.random() * 50;
    ctx.fillStyle = `rgba(${tone + 28}, ${tone + 18}, ${tone + 8}, 0.35)`;
    ctx.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(5, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function Temple() {
  const texture = useMemo(() => stoneTexture(), []);
  useEffect(() => () => texture?.dispose(), [texture]);
  const pillars = [-8, -4, 0, 4, 8];
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[22, 32]} />
        <meshStandardMaterial map={texture} color="#3a3228" roughness={0.96} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.015, 1]}>
        <planeGeometry args={[2.6, 20]} />
        <meshStandardMaterial color="#4a4034" roughness={0.9} />
      </mesh>
      {pillars.map((z) =>
        [-3.3, 3.3].map((x) => (
          <group key={`${x}-${z}`} position={[x, 0, z]}>
            <mesh position={[0, 1.7, 0]}>
              <cylinderGeometry args={[0.28, 0.34, 3.4, 8]} />
              <meshStandardMaterial color="#3d342c" roughness={0.9} />
            </mesh>
            <mesh position={[0, 3.5, 0]}>
              <boxGeometry args={[0.8, 0.28, 0.8]} />
              <meshStandardMaterial color="#4a4036" roughness={0.86} />
            </mesh>
          </group>
        )),
      )}
      <mesh position={[-1.55, 2.3, -10]}>
        <boxGeometry args={[1.15, 4.6, 0.7]} />
        <meshStandardMaterial color="#342c26" roughness={0.9} />
      </mesh>
      <mesh position={[1.55, 2.3, -10]}>
        <boxGeometry args={[1.15, 4.6, 0.7]} />
        <meshStandardMaterial color="#342c26" roughness={0.9} />
      </mesh>
      <mesh position={[0, 4.15, -10]}>
        <boxGeometry args={[2.3, 0.55, 0.65]} />
        <meshStandardMaterial color="#4a4036" roughness={0.88} />
      </mesh>
      {[-6, -2, 2, 6].map((z) => (
        <group key={z} position={[z % 4 === 0 ? -1.7 : 1.7, 0, z]}>
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 1.4, 6]} />
            <meshStandardMaterial color="#2a241e" />
          </mesh>
          <mesh position={[0, 1.5, 0]}>
            <sphereGeometry args={[0.12, 12, 12]} />
            <meshStandardMaterial color="#c6a15b" emissive="#c6a15b" emissiveIntensity={1.4} />
          </mesh>
          <pointLight position={[0, 1.5, 0]} intensity={3.2} distance={5.5} color="#c6a15b" />
        </group>
      ))}
    </group>
  );
}

function specFor(asset: SavedAsset, role: WorldRole): ViewSpec {
  return {
    imageUrl: mediaUrl(asset.imageUrl),
    material: asset.material,
    height: asset.height,
    glow: role === "lantern" ? Math.max(asset.glow, 0.45) : asset.glow,
    shape: role === "lantern" ? "lantern" : role === "seal" ? "seal" : asset.shape,
    spin: false,
  };
}

function Placed({
  placement,
  asset,
  selected,
  onSelect,
}: {
  placement: Placement;
  asset: SavedAsset;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const lift = placement.role === "seal" ? 0.08 : placement.role === "lantern" ? 1.15 : 1.05;
  return (
    <group
      position={[placement.x, 0, placement.z]}
      rotation={[0, placement.rot, 0]}
      scale={placement.scale}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(placement.id);
      }}
    >
      {placement.role === "statue" ? (
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[1.15, 0.4, 1.15]} />
          <meshStandardMaterial color="#3a3228" roughness={0.92} />
        </mesh>
      ) : null}
      {selected ? (
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
          <ringGeometry args={[0.72, 0.86, 40]} />
          <meshBasicMaterial color="#c6a15b" />
        </mesh>
      ) : null}
      <group position={[0, lift, 0]}>
        <Relief spec={specFor(asset, placement.role)} />
      </group>
    </group>
  );
}

export function WorldCanvas({
  placements,
  assets,
  selectedId,
  onSelect,
}: {
  placements: Placement[];
  assets: SavedAsset[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const byId = useMemo(() => new Map(assets.map((asset) => [asset.id, asset])), [assets]);
  return (
    <div className="stage-world overflow-hidden rounded-card border border-line bg-bg touch-none">
      <Canvas
        dpr={[1, 1.5]}
        camera={{ position: [0, 4.4, 9.2], fov: 42 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={["#100e0c"]} />
        <fog attach="fog" args={["#100e0c", 9, 28]} />
        <hemisphereLight args={["#e7d7b4", "#1a140f", 0.38]} />
        <ambientLight intensity={0.22} />
        <directionalLight position={[4, 8, 5]} intensity={1.05} color="#f3ead7" />
        <Temple />
        <mesh
          rotation-x={-Math.PI / 2}
          position={[0, 0.02, 0]}
          onClick={() => onSelect(null)}
        >
          <planeGeometry args={[18, 24]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
        {placements.map((placement) => {
          const asset = byId.get(placement.assetId);
          if (!asset) return null;
          return (
            <Placed
              key={placement.id}
              placement={placement}
              asset={asset}
              selected={placement.id === selectedId}
              onSelect={onSelect}
            />
          );
        })}
        <OrbitControls
          target={[0, 1.2, 0]}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={4}
          maxDistance={16}
        />
      </Canvas>
    </div>
  );
}
