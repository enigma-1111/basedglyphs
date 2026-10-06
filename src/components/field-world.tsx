import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import * as THREE from "three";
import {
  heightAt,
  layerSeconds,
  needTool,
  paintChart,
  PALMS,
  PLACES,
  pushOut,
  PYRAMIDS,
  SPAN,
  SPAWN,
  TOOL_PICKUPS,
  COLUMNS,
  type BuriedGlyph,
  type ToolId,
  type Walker,
  type WorldSurvey,
} from "@/game/field";
import { mediaUrl } from "@/lib/collection";
import { scrape, step } from "@/game/sfx";
import { GlyphStick } from "@/game/stick-figure";

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getSpeed: () => number;
      getX: () => number;
      getZ: () => number;
      setKeys: (codes: string[]) => void;
      setBrush: (held: boolean) => void;
      setPose: (x: number, z: number, yaw: number) => void;
    };
  }
}

type Phase = "intro" | "play" | "pause";

export type FieldProps = {
  sites: BuriedGlyph[];
  claimed: string[];
  traits?: Record<string, string> | null;
  phase: Phase;
  qa: boolean;
  tool: ToolId;
  ownedTools: ToolId[];
  brushRef: RefObject<HTMLDivElement | null>;
  brushHeld: RefObject<boolean>;
  stick: RefObject<{ forward: number; steer: number }>;
  pose: RefObject<Walker>;
  onSurvey: (survey: WorldSurvey) => void;
  onReveal: (glyph: BuriedGlyph) => void;
  onTool: (id: ToolId | null) => void;
  onNote: (text: string) => void;
};

const SAND = 0xe4c48a;
const STONE = 0xcbb892;
const LIMESTONE = 0xe7d7b8;
const MUD = 0xa56b45;
const POT = 0xc46a3a;
const EARTH = 0x6e4632;
const GOLD = 0xc6a15b;
const BARK = 0x6b4a2c;
const FROND = 0x3e6b45;
const SKIN = 0xe7c8a0;
const SUN = 0xf6c98a;
const DUSK = 0xc46a32;
const SOIL = 0x8d5a36;
const COPPER = 0xb87333;
const AWNING = 0x8c4a32;
const DOOR = 0x3a2418;
const LINEN = 0xd8c6a4;
const texCache = new Map<string, THREE.Texture>();

type TerrainMaps = {
  sand: THREE.Texture;
  water: THREE.Texture;
  soil: THREE.Texture;
  limestone: THREE.Texture;
  mudbrick: THREE.Texture;
};

function loadRepeat(url: string) {
  return new Promise<THREE.Texture>((resolve, reject) => {
    new THREE.TextureLoader().load(
      url,
      (tex) => {
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 8;
        resolve(tex);
      },
      undefined,
      reject,
    );
  });
}

function useTerrainMaps() {
  const [maps, setMaps] = useState<TerrainMaps | null>(null);
  useEffect(() => {
    let live = true;
    void Promise.all([
      loadRepeat("/textures/sand.jpg"),
      loadRepeat("/textures/water.jpg"),
      loadRepeat("/textures/soil.jpg"),
      loadRepeat("/textures/limestone.jpg"),
      loadRepeat("/textures/mudbrick.jpg"),
    ]).then(([sand, water, soil, limestone, mudbrick]) => {
      if (live) setMaps({ sand, water, soil, limestone, mudbrick });
    });
    return () => {
      live = false;
    };
  }, []);
  return maps;
}

function Rock({ maps }: { maps: TerrainMaps | null }) {
  if (!maps) return <meshLambertMaterial color={LIMESTONE} />;
  return <meshStandardMaterial map={maps.limestone} roughness={0.9} metalness={0.02} />;
}

function Clay({ maps }: { maps: TerrainMaps | null }) {
  if (!maps) return <meshLambertMaterial color={MUD} />;
  return <meshStandardMaterial map={maps.mudbrick} roughness={0.95} />;
}

function useGlyphTexture(url?: string) {
  const [map, setMap] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) {
      setMap(null);
      return;
    }
    const cached = texCache.get(url);
    if (cached) {
      setMap(cached);
      return;
    }
    let live = true;
    const loader = new THREE.TextureLoader();
    loader.load(mediaUrl(url) ?? url, (next) => {
      next.colorSpace = THREE.SRGBColorSpace;
      next.magFilter = THREE.LinearFilter;
      next.minFilter = THREE.LinearFilter;
      texCache.set(url, next);
      if (live) setMap(next);
    });
    return () => {
      live = false;
    };
  }, [url]);
  return map;
}


function Dunes({ maps }: { maps: TerrainMaps | null }) {
  const geo = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(SPAN, SPAN, 72, 72);
    geometry.rotateX(-Math.PI / 2);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i += 1) {
      const x = pos.getX(i) + SPAN / 2;
      const z = pos.getZ(i) + SPAN / 2;
      pos.setY(i, heightAt(x, z));
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          sandMap: { value: null },
          soilMap: { value: null },
          waterMap: { value: null },
          ready: { value: 0 },
          time: { value: 0 },
          sunDir: { value: new THREE.Vector3(0.45, 0.82, 0.28).normalize() },
        },
        vertexShader:
          "varying vec3 vWorld; varying vec3 vNormal; varying float vH; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vWorld = w.xyz; vH = position.y; vNormal = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }",
        fragmentShader:
          "varying vec3 vWorld; varying vec3 vNormal; varying float vH; uniform sampler2D sandMap; uniform sampler2D soilMap; uniform sampler2D waterMap; uniform float ready; uniform float time; uniform vec3 sunDir; void main(){ vec3 sand = vec3(0.82,0.66,0.45); vec3 soil = vec3(0.36,0.26,0.15); vec3 water = vec3(0.14,0.36,0.4); if (ready > 0.5) { vec2 uv = vWorld.xz * 0.28; sand = texture2D(sandMap, uv).rgb; soil = texture2D(soilMap, uv * 1.15).rgb; water = texture2D(waterMap, uv * 0.72 + vec2(time * 0.018, time * 0.006)).rgb; } float river = smoothstep(14.4, 11.4, vWorld.x); float field = smoothstep(26.0, 15.2, vWorld.x) * (1.0 - river); float lift = clamp((vH - 0.3) / 2.4, 0.0, 1.0); vec3 col = mix(sand * (0.9 + lift * 0.14), soil, field); col = mix(col, water, river); float ndl = clamp(dot(normalize(vNormal), normalize(sunDir)), 0.0, 1.0); col *= 0.62 + ndl * 0.62; float glint = pow(max(0.0, dot(reflect(-normalize(sunDir), normalize(vNormal)), vec3(0.15, 0.35, 0.85))), 24.0); col += vec3(0.9, 0.82, 0.55) * glint * river * 0.22; gl_FragColor = vec4(col, 1.0); }",
      }),
    [],
  );
  useEffect(() => {
    if (!maps) return;
    mat.uniforms.sandMap.value = maps.sand;
    mat.uniforms.soilMap.value = maps.soil;
    mat.uniforms.waterMap.value = maps.water;
    mat.uniforms.ready.value = 1;
  }, [maps, mat]);
  useFrame((_, delta) => {
    mat.uniforms.time.value += Math.min(0.05, delta);
  });
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  return <mesh geometry={geo} material={mat} position={[SPAN / 2, 0, SPAN / 2]} receiveShadow />;
}

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          top: { value: new THREE.Color(SUN) },
          bottom: { value: new THREE.Color(DUSK) },
        },
        vertexShader:
          "varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader:
          "varying vec3 vP; uniform vec3 top; uniform vec3 bottom; void main(){ float h = clamp(vP.y / 90.0, 0.0, 1.0); gl_FragColor = vec4(mix(bottom, top, h), 1.0); }",
      }),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <mesh frustumCulled={false} material={mat}>
      <sphereGeometry args={[160, 18, 12]} />
    </mesh>
  );
}

function House({
  x,
  z,
  w = 2.2,
  d = 1.7,
  h = 1.25,
  maps,
}: {
  x: number;
  z: number;
  w?: number;
  d?: number;
  h?: number;
  maps: TerrainMaps | null;
}) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, h / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
        <cylinderGeometry args={[w * 0.42, w * 0.52, h, 4]} />
        <Clay maps={maps} />
      </mesh>
      <mesh position={[0, h + 0.05, 0]}>
        <boxGeometry args={[w + 0.15, 0.1, d + 0.15]} />
        <meshLambertMaterial color={AWNING} />
      </mesh>
      <mesh position={[0, 0.36, d * 0.55]}>
        <boxGeometry args={[0.36, 0.64, 0.06]} />
        <meshLambertMaterial color={DOOR} />
      </mesh>
    </group>
  );
}

function Pylon({ x, z, maps }: { x: number; z: number; maps: TerrainMaps | null }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      {[-1.2, 1.2].map((side) => (
        <mesh key={side} position={[side, 1.7, 0]} rotation={[0, Math.PI / 4, 0]}>
          <cylinderGeometry args={[0.5, 0.82, 3.4, 4]} />
          <Rock maps={maps} />
        </mesh>
      ))}
      <mesh position={[0, 3.05, 0]}>
        <boxGeometry args={[2.7, 0.28, 0.72]} />
        <Rock maps={maps} />
      </mesh>
      <mesh position={[0, 3.05, 0.38]}>
        <boxGeometry args={[0.7, 0.16, 0.04]} />
        <meshBasicMaterial color={GOLD} />
      </mesh>
    </group>
  );
}

function Sphinx({ x, z, maps }: { x: number; z: number; maps: TerrainMaps | null }) {
  const y = heightAt(x, z);
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 0.32, -0.15]}>
        <boxGeometry args={[0.62, 0.42, 1.7]} />
        <Rock maps={maps} />
      </mesh>
      <mesh position={[0, 0.18, 0.85]}>
        <boxGeometry args={[0.22, 0.16, 0.4]} />
        <Rock maps={maps} />
      </mesh>
      <mesh position={[0, 0.78, 0.55]}>
        <sphereGeometry args={[0.26, 12, 10]} />
        <Rock maps={maps} />
      </mesh>
      <mesh position={[0, 0.98, 0.52]} rotation={[0.25, 0, 0]}>
        <boxGeometry args={[0.46, 0.14, 0.4]} />
        <meshLambertMaterial color={GOLD} />
      </mesh>
    </group>
  );
}

function Palm({ x, z }: { x: number; z: number }) {
  const crown = useRef<THREE.Group>(null);
  const y = heightAt(x, z);
  useFrame(({ clock }) => {
    if (!crown.current) return;
    const t = clock.elapsedTime;
    crown.current.rotation.z = Math.sin(t * 0.7 + x) * 0.07;
    crown.current.rotation.x = Math.cos(t * 0.5 + z) * 0.04;
  });
  return (
    <group position={[x, y, z]}>
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.08, 0.16, 3.2, 6]} />
        <meshLambertMaterial color={BARK} />
      </mesh>
      <group ref={crown} position={[0, 3.15, 0]}>
        {[0, 1, 2, 3, 4, 5].map((leaf) => {
          const angle = (leaf / 6) * Math.PI * 2;
          return (
            <mesh key={leaf} position={[Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55]} rotation={[1.05, angle, 0]}>
              <coneGeometry args={[0.16, 1.5, 4]} />
              <meshLambertMaterial color={FROND} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Monuments({ maps }: { maps: TerrainMaps | null }) {
  const root = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    root.current?.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh && !mesh.geometry?.type?.includes("Sphere")) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [maps]);
  return (
    <group ref={root}>
      <mesh position={[12, 58, 6]}>
        <sphereGeometry args={[5.4, 18, 14]} />
        <meshBasicMaterial color={SUN} />
      </mesh>
      {PYRAMIDS.map((pyramid) => {
        const y = heightAt(pyramid.x, pyramid.z);
        return (
          <group key={`${pyramid.x}-${pyramid.z}`} position={[pyramid.x, y - 0.15, pyramid.z]} rotation={[0, Math.PI / 4, 0]}>
            <mesh position={[0, pyramid.height / 2, 0]}>
              <coneGeometry args={[pyramid.radius, pyramid.height, 4]} />
              <Rock maps={maps} />
            </mesh>
            <mesh position={[0, pyramid.height - 0.35, 0]}>
              <coneGeometry args={[pyramid.radius * 0.16, 0.7, 4]} />
              <meshLambertMaterial color={GOLD} />
            </mesh>
          </group>
        );
      })}
      <Pylon x={50} z={26} maps={maps} />
      <Sphinx x={36} z={24} maps={maps} />
      {PLACES.filter((place) => place.kind === "obelisk").map((place) => {
        const y = heightAt(place.x, place.z);
        return (
          <group key={place.id} position={[place.x, y, place.z]}>
            <mesh position={[0, 2.4, 0]}>
              <cylinderGeometry args={[0.12, 0.42, 4.8, 4]} />
              <Rock maps={maps} />
            </mesh>
            <mesh position={[0, 4.95, 0]}>
              <coneGeometry args={[0.16, 0.45, 4]} />
              <meshLambertMaterial color={GOLD} />
            </mesh>
          </group>
        );
      })}
      {COLUMNS.map(([x, z]) => {
        const y = heightAt(x, z);
        return (
          <group key={`${x}-${z}`} position={[x, y, z]}>
            <mesh position={[0, 1.5, 0]}>
              <cylinderGeometry args={[0.22, 0.28, 3, 8]} />
              <Rock maps={maps} />
            </mesh>
            <mesh position={[0, 3.05, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 0.12, 8]} />
              <Rock maps={maps} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[73, heightAt(73, 54) + 0.12, 54]} rotation={[0.4, 0.8, 0.2]}>
        <cylinderGeometry args={[0.28, 0.28, 0.35, 8]} />
        <Rock maps={maps} />
      </mesh>
      {PALMS.map(([x, z]) => (
        <Palm key={`${x}-${z}`} x={x} z={z} />
      ))}
      {[18, 34, 46, 62, 78].map((z) => (
        <group key={`reed-${z}`} position={[13.6, heightAt(13.6, z), z]}>
          {[0, 0.35, -0.28].map((offset) => (
            <mesh key={offset} position={[offset * 0.4, 0.7, offset]}>
              <coneGeometry args={[0.05, 1.35, 5]} />
              <meshLambertMaterial color={FROND} />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[11.6, heightAt(11.6, 64) + 0.16, 64]} rotation={[0, 0.5, 0]}>
        <mesh>
          <boxGeometry args={[2.2, 0.16, 0.58]} />
          <meshLambertMaterial color={BARK} />
        </mesh>
        <mesh position={[1.15, 0.18, 0]} rotation={[0, 0, -0.55]}>
          <boxGeometry args={[0.55, 0.1, 0.48]} />
          <meshLambertMaterial color={BARK} />
        </mesh>
        <mesh position={[-1.15, 0.18, 0]} rotation={[0, 0, 0.55]}>
          <boxGeometry args={[0.55, 0.1, 0.48]} />
          <meshLambertMaterial color={BARK} />
        </mesh>
      </group>
      <House x={43} z={82} maps={maps} />
      <House x={54} z={81} w={2.6} d={1.9} h={1.4} maps={maps} />
      <House x={59} z={75} w={1.8} d={1.5} h={1.1} maps={maps} />
      <House x={20} z={62} w={2} d={1.6} h={1.15} maps={maps} />
      <group position={[52, 0, 77]}>
        <mesh position={[-1.4, heightAt(50.6, 77) + 0.35, 0]}>
          <boxGeometry args={[0.28, 0.7, 2.2]} />
          <Clay maps={maps} />
        </mesh>
        <mesh position={[1.4, heightAt(53.4, 77) + 0.35, 0]}>
          <boxGeometry args={[0.28, 0.7, 2.2]} />
          <Clay maps={maps} />
        </mesh>
        <mesh position={[0, heightAt(52, 78.2) + 1.15, 1.1]} rotation={[0.45, 0, 0]}>
          <boxGeometry args={[3.1, 0.05, 1.5]} />
          <meshLambertMaterial color={AWNING} />
        </mesh>
        <mesh position={[0.9, heightAt(52.9, 76.5) + 0.28, -0.45]}>
          <sphereGeometry args={[0.26, 10, 8]} />
          <meshLambertMaterial color={POT} />
        </mesh>
        <mesh position={[1.15, heightAt(53.1, 76.3) + 0.2, -0.12]}>
          <sphereGeometry args={[0.18, 10, 8]} />
          <meshLambertMaterial color={POT} />
        </mesh>
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[28, heightAt(28, 58) + 0.06, 58]}>
        <ringGeometry args={[1.15, 2.35, 28]} />
        <meshBasicMaterial color={GOLD} />
      </mesh>
    </group>
  );
}

type Pit = { layer: number; amt: number; rise: number; fired: boolean };

function LayerShape({ material }: { material: BuriedGlyph["layers"][number] }) {
  if (material === "earth") {
    return (
      <mesh scale={[1, 0.45, 1]}>
        <sphereGeometry args={[0.78, 14, 10]} />
        <meshLambertMaterial color={EARTH} />
      </mesh>
    );
  }
  if (material === "pot") {
    return (
      <group>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.38, 12, 10]} />
          <meshLambertMaterial color={POT} />
        </mesh>
        <mesh position={[0, 0.48, 0]}>
          <cylinderGeometry args={[0.12, 0.18, 0.22, 8]} />
          <meshLambertMaterial color={POT} />
        </mesh>
      </group>
    );
  }
  if (material === "rubble") {
    return (
      <group>
        <mesh position={[-0.22, 0.12, 0]} rotation={[0.2, 0.4, 0.3]}>
          <boxGeometry args={[0.46, 0.22, 0.34]} />
          <meshLambertMaterial color={LIMESTONE} />
        </mesh>
        <mesh position={[0.2, 0.1, 0.08]} rotation={[-0.3, 0.2, 0.5]}>
          <boxGeometry args={[0.38, 0.2, 0.28]} />
          <meshLambertMaterial color={STONE} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh>
      <sphereGeometry args={[0.8, 16, 12]} />
      <meshLambertMaterial color={SAND} />
    </mesh>
  );
}

function DigSite({
  site,
  pose,
  pits,
}: {
  site: BuriedGlyph;
  pose: RefObject<Walker>;
  pits: RefObject<Map<string, Pit>>;
}) {
  const face = useGlyphTexture(site.imageUrl);
  const y = heightAt(site.x, site.z);
  const layers = useRef<(THREE.Object3D | null)[]>([]);
  const tablet = useRef<THREE.Group>(null);
  const grains = useRef<THREE.Group>(null);
  const hole = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const pit = pits.current.get(site.tokenId);
    const layer = pit?.layer ?? 0;
    const amt = pit?.amt ?? 0;
    const rise = pit?.rise ?? 0;
    layers.current.forEach((mesh, index) => {
      if (!mesh) return;
      const active = index === layer && rise <= 0.02;
      const exposed = active && (index > 0 || amt > 0.02);
      mesh.visible = exposed;
      if (exposed) {
        const scale = Math.max(0.08, 1 - amt * 0.9);
        mesh.scale.set(scale, scale, scale);
      }
    });
    if (hole.current) {
      const open = rise > 0 || layer > 0 || amt > 0.02;
      hole.current.visible = open;
      const scale = rise > 0 ? 1 : Math.max(0.2, layer > 0 ? 0.9 : amt);
      hole.current.scale.set(scale, scale, 1);
    }
    if (tablet.current) {
      tablet.current.visible = rise > 0;
      tablet.current.position.y = rise * 1.05;
      tablet.current.scale.setScalar(0.3 + rise * 0.7);
      const here = pose.current;
      tablet.current.rotation.y = Math.atan2(here.x - site.x, here.z - site.z);
    }
    if (grains.current) {
      const spilling = amt > 0.04 && rise <= 0.02;
      grains.current.visible = spilling;
      grains.current.children.forEach((child, index) => {
        const angle = amt * 8 + index;
        child.position.set(Math.cos(angle) * 0.55, 0.2 + amt * 0.7, Math.sin(angle) * 0.55);
      });
    }
  });
  return (
    <group position={[site.x, y, site.z]}>
      <mesh ref={hole} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]} visible={false}>
        <circleGeometry args={[0.72, 18]} />
        <meshLambertMaterial color={EARTH} />
      </mesh>
      {site.layers.map((material, index) => (
        <group
          key={`${material}-${index}`}
          ref={(node) => {
            layers.current[index] = node;
          }}
          position={[0, 0.28 + index * 0.22, 0]}
        >
          <LayerShape material={material} />
        </group>
      ))}
      <group ref={grains} visible={false}>
        {Array.from({ length: 6 }, (_, index) => (
          <mesh key={index}>
            <sphereGeometry args={[0.045, 6, 6]} />
            <meshLambertMaterial color={SAND} />
          </mesh>
        ))}
      </group>
      <group ref={tablet} visible={false}>
        <mesh position={[0, 0.55, 0]}>
          <boxGeometry args={[0.78, 1.12, 0.08]} />
          <meshStandardMaterial map={face ?? undefined} color={face ? 0xffffff : GOLD} roughness={0.42} metalness={0.16} />
        </mesh>
      </group>
    </group>
  );
}

function ToolMesh({ id }: { id: ToolId }) {
  if (id === "trowel") {
    return (
      <group rotation={[0.6, 0.4, 0]}>
        <mesh>
          <boxGeometry args={[0.08, 0.42, 0.08]} />
          <meshLambertMaterial color={BARK} />
        </mesh>
        <mesh position={[0, 0.28, 0.06]} rotation={[0.8, 0, 0]}>
          <boxGeometry args={[0.22, 0.16, 0.04]} />
          <meshLambertMaterial color={COPPER} />
        </mesh>
      </group>
    );
  }
  if (id === "mallet") {
    return (
      <group rotation={[0.4, 0.2, 0.6]}>
        <mesh>
          <cylinderGeometry args={[0.04, 0.04, 0.55, 6]} />
          <meshLambertMaterial color={BARK} />
        </mesh>
        <mesh position={[0, 0.22, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.1, 0.1, 0.28, 8]} />
          <meshLambertMaterial color={MUD} />
        </mesh>
      </group>
    );
  }
  if (id === "brush") {
    return (
      <group rotation={[0.9, 0.2, 0]}>
        <mesh>
          <cylinderGeometry args={[0.03, 0.04, 0.46, 6]} />
          <meshLambertMaterial color={BARK} />
        </mesh>
        <mesh position={[0, 0.28, 0]}>
          <coneGeometry args={[0.07, 0.16, 6]} />
          <meshLambertMaterial color={GOLD} />
        </mesh>
      </group>
    );
  }
  return null;
}

function ToolDrop({ id, x, z }: { id: ToolId; x: number; z: number }) {
  const bob = useRef<THREE.Group>(null);
  const y = heightAt(x, z);
  useFrame(({ clock }) => {
    if (!bob.current) return;
    bob.current.position.y = y + 0.46 + Math.sin(clock.elapsedTime * 2.1 + x) * 0.07;
    bob.current.rotation.y = clock.elapsedTime * 0.55;
  });
  return (
    <group position={[x, 0, z]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, y + 0.04, 0]}>
        <ringGeometry args={[0.32, 0.46, 24]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0.9} />
      </mesh>
      <group ref={bob}>
        <ToolMesh id={id} />
      </group>
    </group>
  );
}

function Motes() {
  const ref = useRef<THREE.Points>(null);
  const geo = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const count = 64;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i += 1) {
      pos[i * 3] = Math.random() * SPAN;
      pos[i * 3 + 1] = 0.8 + Math.random() * 5;
      pos[i * 3 + 2] = Math.random() * SPAN;
    }
    geometry.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geometry;
  }, []);
  useFrame((_, delta) => {
    const attr = ref.current?.geometry.attributes.position as THREE.BufferAttribute | undefined;
    if (!attr) return;
    const arr = attr.array as Float32Array;
    const dt = Math.min(0.05, delta);
    for (let i = 0; i < arr.length; i += 3) {
      arr[i] += dt * 0.4;
      arr[i + 1] += Math.sin(arr[i] * 0.15 + arr[i + 2]) * dt * 0.12;
      if (arr[i] > SPAN) arr[i] -= SPAN;
      if (arr[i + 1] > 7) arr[i + 1] = 0.7;
    }
    attr.needsUpdate = true;
  });
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial color={0xf6e6c4} size={0.07} transparent opacity={0.4} depthWrite={false} sizeAttenuation />
    </points>
  );
}

function FootDust({ pose }: { pose: RefObject<Walker> }) {
  const group = useRef<THREE.Group>(null);
  const last = useRef({ x: SPAWN.x, z: SPAWN.z, acc: 0, i: 0 });
  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);
    const here = pose.current;
    const moved = Math.hypot(here.x - last.current.x, here.z - last.current.z);
    last.current.x = here.x;
    last.current.z = here.z;
    const root = group.current;
    if (!root) return;
    root.children.forEach((child) => {
      child.position.y += dt * 0.45;
      const next = Math.max(0, child.scale.x - dt * 1.1);
      child.scale.setScalar(next);
    });
    if (moved < 0.01) return;
    last.current.acc += moved;
    if (last.current.acc < 1.15) return;
    last.current.acc = 0;
    const puff = root.children[last.current.i % root.children.length];
    last.current.i += 1;
    puff.position.set(here.x, heightAt(here.x, here.z) + 0.06, here.z);
    puff.scale.setScalar(0.32);
    step();
  });
  return (
    <group ref={group}>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} scale={0}>
          <sphereGeometry args={[0.14, 6, 5]} />
          <meshBasicMaterial color={SAND} transparent opacity={0.4} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function Surveyor({
  pose,
  traits,
  sites,
  pits,
  ownedTools,
}: {
  pose: RefObject<Walker>;
  traits?: Record<string, string> | null;
  sites: BuriedGlyph[];
  pits: RefObject<Map<string, Pit>>;
  ownedTools: ToolId[];
}) {
  const body = useRef<THREE.Group>(null);
  const last = useRef({ x: SPAWN.x, z: SPAWN.z, step: 0 });
  useFrame(() => {
    const here = pose.current;
    if (!body.current) return;
    const moved = Math.hypot(here.x - last.current.x, here.z - last.current.z);
    last.current.x = here.x;
    last.current.z = here.z;
    last.current.step += moved * 9;
    const hop = Math.sin(last.current.step) * Math.min(0.06, moved * 7);
    body.current.position.set(here.x, heightAt(here.x, here.z) + hop, here.z);
    body.current.rotation.y = here.yaw + Math.PI;
    body.current.rotation.z = Math.sin(last.current.step) * 0.04;
  });
  return (
    <>
      <group ref={body}>
        <GlyphStick traits={traits} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[0.42, 16]} />
          <meshBasicMaterial color={0x3a2a18} transparent opacity={0.28} depthWrite={false} />
        </mesh>
      </group>
      {sites.map((site) => (
        <DigSite key={site.tokenId} site={site} pose={pose} pits={pits} />
      ))}
      {TOOL_PICKUPS.filter((pickup) => !ownedTools.includes(pickup.id)).map((pickup) => (
        <ToolDrop key={pickup.id} id={pickup.id} x={pickup.x} z={pickup.z} />
      ))}
    </>
  );
}

function Walk({
  sites,
  claimed,
  traits,
  phase,
  qa,
  tool,
  ownedTools,
  brushRef,
  brushHeld,
  stick,
  pose,
  onSurvey,
  onReveal,
  onTool,
  onNote,
}: FieldProps) {
  const { camera } = useThree();
  const keys = useRef(new Set<string>());
  const yaw = useRef(SPAWN.yaw);
  const speed = useRef(0);
  const at = useRef({ x: SPAWN.x, z: SPAWN.z });
  const pits = useRef(new Map<string, Pit>());
  const lastTool = useRef<ToolId | null>(null);
  const lastNote = useRef("");
  const desired = useRef(new THREE.Vector3());
  const look = useRef(new THREE.Vector3());
  const trauma = useRef(0);
  const shakeTime = useRef(0);
  const hitstop = useRef(0);
  const sun = useRef<THREE.DirectionalLight>(null);
  const maps = useTerrainMaps();
  const reduceMotion = useRef(false);

  const ensure = (site: BuriedGlyph, done: boolean) => {
    let pit = pits.current.get(site.tokenId);
    if (!pit) {
      pit = {
        layer: done ? site.layers.length : 0,
        amt: 0,
        rise: done ? 1 : 0,
        fired: done,
      };
      pits.current.set(site.tokenId, pit);
    } else if (done && pit.rise < 1) {
      pit.layer = site.layers.length;
      pit.rise = 1;
      pit.fired = true;
      pit.amt = 0;
    }
    return pit;
  };

  useEffect(() => {
    reduceMotion.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useEffect(() => {
    at.current = { x: SPAWN.x, z: SPAWN.z };
    yaw.current = SPAWN.yaw;
    speed.current = 0;
    pose.current = { x: SPAWN.x, z: SPAWN.z, yaw: SPAWN.yaw };
    onSurvey(paintChart(sites));
  }, [sites, onSurvey, pose]);

  useEffect(() => {
    const down = (event: KeyboardEvent) => {
      keys.current.add(event.code);
    };
    const up = (event: KeyboardEvent) => {
      keys.current.delete(event.code);
    };
    const blur = () => keys.current.clear();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);

  useEffect(() => {
    if (!qa && !import.meta.env.DEV) return;
    const probe = {
      getYaw: () => yaw.current,
      getSpeed: () => speed.current,
      getX: () => at.current.x,
      getZ: () => at.current.z,
      setKeys: (codes: string[]) => {
        keys.current = new Set(codes);
      },
      setBrush: (held: boolean) => {
        brushHeld.current = held;
      },
      setPose: (x: number, z: number, face: number) => {
        at.current.x = x;
        at.current.z = z;
        yaw.current = face;
        speed.current = 0;
      },
      getDig: () => {
        const here = at.current;
        return {
          phase,
          tool,
          brush: brushHeld.current,
          x: here.x,
          z: here.z,
          sites: sites.map((site) => {
            const pit = pits.current.get(site.tokenId);
            return {
              id: site.tokenId,
              x: site.x,
              z: site.z,
              d: Math.hypot(site.x - here.x, site.z - here.z),
              layers: site.layers.join(","),
              pit,
            };
          }),
        };
      },
    };
    window.__controlsTest = probe;
    return () => {
      if (window.__controlsTest === probe) delete window.__controlsTest;
    };
  }, [qa, brushHeld]);

  useFrame((_, delta) => {
    const dt = Math.min(0.05, delta);
    const playing = phase === "play";
    const frozen = hitstop.current > 0;
    if (frozen) hitstop.current = Math.max(0, hitstop.current - dt);
    let throttle = 0;
    let steer = 0;
    if (playing && !frozen) {
      const held = keys.current;
      if (held.has("KeyW") || held.has("ArrowUp")) throttle += 1;
      if (held.has("KeyS") || held.has("ArrowDown")) throttle -= 1;
      if (held.has("KeyA") || held.has("ArrowLeft")) steer += 1;
      if (held.has("KeyD") || held.has("ArrowRight")) steer -= 1;
      throttle = Math.max(-1, Math.min(1, throttle + stick.current.forward));
      steer = Math.max(-1, Math.min(1, steer + stick.current.steer));
    }
    if (!frozen) {
      yaw.current += steer * 2.6 * dt;
      const wet = at.current.x < 13 ? 0.5 : 1;
      const target = playing ? throttle * 7.2 * wet : 0;
      speed.current += (target - speed.current) * Math.min(1, dt * 7);
      const stepX = -Math.sin(yaw.current);
      const stepZ = -Math.cos(yaw.current);
      let nx = at.current.x + stepX * speed.current * dt;
      let nz = at.current.z + stepZ * speed.current * dt;
      const pushed = pushOut(nx, nz);
      nx = Math.min(SPAN - 3, Math.max(3, pushed.x));
      nz = Math.min(SPAN - 3, Math.max(3, pushed.z));
      at.current.x = nx;
      at.current.z = nz;
      pose.current = { x: nx, z: nz, yaw: yaw.current };
    }
    const nx = at.current.x;
    const nz = at.current.z;
    const fx = -Math.sin(yaw.current);
    const fz = -Math.cos(yaw.current);

    const y = heightAt(nx, nz);
    desired.current.set(nx - fx * 8.2, y + 4.35, nz - fz * 8.2);
    camera.position.lerp(desired.current, 1 - Math.exp(-4.5 * dt));
    look.current.set(nx + fx * 2.2, y + 1.28, nz + fz * 2.2);
    camera.lookAt(look.current);
    if (sun.current) {
      sun.current.position.set(nx - 16, y + 26, nz + 18);
      sun.current.target.position.set(nx, y, nz);
      sun.current.target.updateMatrixWorld();
    }
    shakeTime.current += dt;
    trauma.current = Math.max(0, trauma.current - dt * 0.9);
    const mag = trauma.current * trauma.current;
    if (mag > 0.001) {
      camera.position.x += Math.sin(shakeTime.current * 43) * 0.18 * mag;
      camera.position.y += Math.cos(shakeTime.current * 37) * 0.1 * mag;
    }

    let best: BuriedGlyph | null = null;
    let bestD = Infinity;
    for (const site of sites) {
      const pit = ensure(site, claimed.includes(site.tokenId));
      if (pit.rise > 0) continue;
      const dist = Math.hypot(site.x - nx, site.z - nz);
      if (dist < bestD) {
        best = site;
        bestD = dist;
      }
    }

    const sweeping = playing && !frozen && (brushHeld.current || keys.current.has("Space"));
    let bar = 0;
    let note = "";
    if (sweeping && best && bestD < 3.4) {
      const pit = ensure(best, false);
      const material = best.layers[pit.layer];
      const secs = material ? layerSeconds(material, tool) : 0;
      if (!material || secs <= 0) {
        note = material ? needTool(material) : "";
        pit.amt = 0;
      } else {
        pit.amt = Math.min(1, pit.amt + dt / secs);
        scrape();
        if (pit.amt >= 1) {
          pit.amt = 0;
          pit.layer += 1;
          if (!reduceMotion.current) {
            trauma.current = Math.min(1, trauma.current + 0.18);
            hitstop.current = 0.05;
          }
          if (pit.layer >= best.layers.length) pit.rise = 0.04;
        }
      }
      bar = pit.amt;
    }
    for (const site of sites) {
      const pit = pits.current.get(site.tokenId);
      if (!pit || pit.rise >= 1) continue;
      if (pit.layer >= site.layers.length) {
        pit.rise = Math.min(1, pit.rise + dt / 0.85);
        if (pit.rise >= 1 && !pit.fired) {
          pit.fired = true;
          if (!reduceMotion.current) trauma.current = Math.min(1, trauma.current + 0.55);
          onReveal(site);
        }
      } else if (!(sweeping && best?.tokenId === site.tokenId)) {
        pit.amt = Math.max(0, pit.amt - dt * 0.4);
      }
    }
    if (brushRef.current) brushRef.current.style.transform = `scaleX(${bar})`;

    let offer: ToolId | null = null;
    let offerD = 2.4;
    for (const pickup of TOOL_PICKUPS) {
      if (ownedTools.includes(pickup.id)) continue;
      const dist = Math.hypot(pickup.x - nx, pickup.z - nz);
      if (dist < offerD) {
        offer = pickup.id;
        offerD = dist;
      }
    }
    if (offer !== lastTool.current) {
      lastTool.current = offer;
      onTool(offer);
    }
    if (note !== lastNote.current) {
      lastNote.current = note;
      onNote(note);
    }
  });

  return (
    <>
      <Sky />
      <hemisphereLight args={[SUN, SOIL, 0.72]} />
      <ambientLight intensity={0.22} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={1.7}
        color={SUN}
        position={[SPAWN.x - 16, 28, SPAWN.z + 18]}
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={4}
        shadow-camera-far={70}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-22}
        shadow-bias={-0.0006}
      />
      <fog attach="fog" args={[DUSK, 42, 120]} />
      <Dunes maps={maps} />
      <Monuments maps={maps} />
      <Motes />
      <FootDust pose={pose} />
      <Surveyor pose={pose} traits={traits} sites={sites} pits={pits} ownedTools={ownedTools} />
    </>
  );
}

export function FieldWorld(props: FieldProps) {
  return (
    <Canvas
      className="sands-canvas absolute inset-0"
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 46, near: 0.1, far: 240, position: [SPAWN.x, 8, SPAWN.z + 12] }}
      gl={{ antialias: true, alpha: false }}
    >
      <Walk {...props} />
    </Canvas>
  );
}
