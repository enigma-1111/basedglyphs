import { OrbitControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Component, Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import type { ViewSpec, ViewerApi } from "@/components/view-spec";
import type { MaterialId } from "@/lib/collection";

const PRESET: Record<
  MaterialId,
  { color: string; roughness: number; metalness: number; emissive: string }
> = {
  stone: { color: "#b7a894", roughness: 0.92, metalness: 0.05, emissive: "#4a3a28" },
  bronze: { color: "#8d5a34", roughness: 0.42, metalness: 0.82, emissive: "#5a3014" },
  gold: { color: "#c6a15b", roughness: 0.32, metalness: 0.88, emissive: "#6a4a16" },
  obsidian: { color: "#171412", roughness: 0.22, metalness: 0.58, emissive: "#2c241c" },
};

class TextureBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReduced(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);
  return reduced;
}

function ShapeBody({ spec, texture }: { spec: ViewSpec; texture: THREE.Texture | null }) {
  const preset = PRESET[spec.material];
  const depth = Math.max(0.04, spec.height);
  const glow = spec.glow;

  const plaque = useMemo(() => {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, depth);
    const side = () =>
      new THREE.MeshStandardMaterial({
        color: preset.color,
        roughness: preset.roughness,
        metalness: preset.metalness,
        emissive: preset.emissive,
        emissiveIntensity: glow * 0.18,
      });
    const front = new THREE.MeshStandardMaterial({
      color: texture ? "#ffffff" : preset.color,
      map: texture,
      roughness: texture ? Math.min(preset.roughness, 0.62) : preset.roughness,
      metalness: texture ? preset.metalness * 0.28 : preset.metalness,
      bumpMap: texture,
      bumpScale: texture ? 0.05 + depth * 0.8 : 0,
      emissive: preset.emissive,
      emissiveMap: texture,
      emissiveIntensity: glow * (texture ? 0.7 : 0.25),
    });
    return { geometry, materials: [side(), side(), side(), side(), front, side()] };
  }, [depth, glow, preset, texture]);

  useEffect(() => {
    return () => {
      plaque.geometry.dispose();
      plaque.materials.forEach((material) => material.dispose());
    };
  }, [plaque]);

  if (spec.shape === "lantern") {
    return (
      <group>
        <mesh position={[0, -0.85, 0]}>
          <cylinderGeometry args={[0.08, 0.12, 1.15, 8]} />
          <meshStandardMaterial color={preset.color} roughness={preset.roughness} metalness={preset.metalness} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.72, 0.9, 0.72]} />
          <meshStandardMaterial
            color={preset.color}
            roughness={0.35}
            metalness={preset.metalness}
            emissive={preset.emissive}
            emissiveIntensity={0.35 + glow}
            transparent
            opacity={0.92}
          />
        </mesh>
        <mesh position={[0, 0.05, 0.37]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshStandardMaterial map={texture} color={texture ? "#ffffff" : preset.color} />
        </mesh>
      </group>
    );
  }

  if (spec.shape === "seal") {
    return (
      <group>
        <mesh rotation-x={-Math.PI / 2}>
          <cylinderGeometry args={[0.86, 0.86, 0.08, 40]} />
          <meshStandardMaterial color={preset.color} roughness={preset.roughness} metalness={preset.metalness} />
        </mesh>
        <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
          <circleGeometry args={[0.66, 40]} />
          <meshStandardMaterial
            map={texture}
            color={texture ? "#ffffff" : preset.color}
            roughness={0.55}
            metalness={preset.metalness * 0.4}
            emissive={preset.emissive}
            emissiveIntensity={glow * 0.45}
          />
        </mesh>
      </group>
    );
  }

  if (spec.shape === "shrine") {
    return (
      <group>
        <mesh position={[0, -0.62, 0]}>
          <boxGeometry args={[1.8, 0.28, 1.5]} />
          <meshStandardMaterial color={preset.color} roughness={0.9} metalness={preset.metalness * 0.4} />
        </mesh>
        <mesh position={[0, -0.28, 0]}>
          <boxGeometry args={[1.3, 0.36, 1.1]} />
          <meshStandardMaterial color={preset.color} roughness={0.88} metalness={preset.metalness * 0.4} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <boxGeometry args={[0.85, 0.62, 0.7]} />
          <meshStandardMaterial color={preset.color} roughness={preset.roughness} metalness={preset.metalness} />
        </mesh>
        <mesh position={[0, 0.25, 0.36]} geometry={plaque.geometry} material={plaque.materials} scale={0.42} />
      </group>
    );
  }

  if (spec.shape === "obelisk") {
    return (
      <group>
        <mesh position={[0, -0.95, 0]}>
          <boxGeometry args={[0.9, 0.18, 0.9]} />
          <meshStandardMaterial color={preset.color} roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.05, 0.34, 2.05, 4]} />
          <meshStandardMaterial color={preset.color} roughness={preset.roughness} metalness={preset.metalness} />
        </mesh>
        <mesh position={[0, 0.15, 0.2]} geometry={plaque.geometry} material={plaque.materials} scale={0.34} />
      </group>
    );
  }

  if (spec.shape === "block") {
    return (
      <mesh geometry={plaque.geometry} material={plaque.materials} scale={[0.9, 0.72, 1]} />
    );
  }

  return (
    <group>
      <mesh position={[0, 0, -depth * 0.45]}>
        <boxGeometry args={[1.68, 1.68, Math.max(0.06, depth * 0.55)]} />
        <meshStandardMaterial color={preset.color} roughness={0.94} metalness={preset.metalness * 0.45} />
      </mesh>
      <mesh geometry={plaque.geometry} material={plaque.materials} />
    </group>
  );
}

function TexturedRelief({ spec, url }: { spec: ViewSpec; url: string }) {
  const texture = useTexture(url);
  useLayoutEffect(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);
  return <ShapeBody spec={spec} texture={texture} />;
}

export function Relief({ spec }: { spec: ViewSpec }) {
  if (!spec.imageUrl) return <ShapeBody spec={spec} texture={null} />;
  return (
    <TextureBoundary key={spec.imageUrl + spec.shape} fallback={<ShapeBody spec={spec} texture={null} />}>
      <Suspense fallback={null}>
        <TexturedRelief spec={spec} url={spec.imageUrl} />
      </Suspense>
    </TextureBoundary>
  );
}

function SpinningRelief({
  spec,
  apiRef,
}: {
  spec: ViewSpec;
  apiRef: RefObject<ViewerApi | null>;
}) {
  const group = useRef<THREE.Group>(null);
  const dragging = useRef(false);
  const reduced = useReducedMotion();
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);
  const camera = useThree((state) => state.camera);

  useFrame((_, delta) => {
    const node = group.current;
    if (!node || dragging.current || reduced || spec.spin === false) return;
    node.rotation.y += Math.min(delta, 0.1) * 0.45;
  });

  useEffect(() => {
    apiRef.current = {
      captureTurntable: () =>
        new Promise<Blob>((resolve, reject) => {
          const node = group.current;
          const ctxCanvas = document.createElement("canvas");
          const frames = 8;
          const tile = 320;
          ctxCanvas.width = tile * frames;
          ctxCanvas.height = tile;
          const ctx = ctxCanvas.getContext("2d");
          if (!node || !ctx) {
            reject(new Error("Preview is not ready."));
            return;
          }
          const source = gl.domElement;
          const side = Math.min(source.width, source.height);
          const sx = (source.width - side) / 2;
          const sy = (source.height - side) / 2;
          const previous = node.rotation.y;
          for (let index = 0; index < frames; index += 1) {
            node.rotation.y = (index / frames) * Math.PI * 2;
            gl.render(scene, camera);
            ctx.drawImage(source, sx, sy, side, side, index * tile, 0, tile, tile);
          }
          node.rotation.y = previous;
          gl.render(scene, camera);
          ctxCanvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("Could not make the turntable image."));
          }, "image/png");
        }),
    };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, camera, gl, scene]);

  return (
    <>
      <OrbitControls
        enablePan={false}
        minDistance={1.8}
        maxDistance={6}
        onStart={() => {
          dragging.current = true;
        }}
        onEnd={() => {
          dragging.current = false;
        }}
      />
      <group ref={group}>
        <Relief spec={spec} />
      </group>
    </>
  );
}

export function PieceCanvas({
  spec,
  apiRef,
}: {
  spec: ViewSpec;
  apiRef: RefObject<ViewerApi | null>;
}) {
  return (
    <div className="stage-piece overflow-hidden rounded-card border border-line bg-bg">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 0.05, 3.15], fov: 35 }}
        gl={{ preserveDrawingBuffer: true, antialias: true, alpha: false }}
      >
        <color attach="background" args={["#14110e"]} />
        <ambientLight intensity={0.42} />
        <directionalLight position={[2.4, 3.2, 4]} intensity={1.45} color="#f3ead7" />
        <pointLight position={[-1.5, 0.3, 1.8]} intensity={6} distance={8} color="#c6a15b" />
        <SpinningRelief spec={spec} apiRef={apiRef} />
      </Canvas>
    </div>
  );
}
