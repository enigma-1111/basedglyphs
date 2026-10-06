import { useMemo } from "react";
import * as THREE from "three";
import { lookOf, type Hour, type Metal, type Rank } from "@/lib/avatar";

type V = [number, number, number];
type Seg = { a: V; b: V; r: number };
type Dot = { p: V; r: number };
type Kind = "bull" | "owl" | "bird" | "ibis" | "knife" | "person" | "seated" | "mother" | "ram" | "jackal" | "bee" | "scarab" | "beast";

const METAL: Record<Metal, number> = {
  iron: 0xb0b6bc,
  gold: 0xd4a84b,
  silver: 0xd8d3c8,
  copper: 0xb86a4a,
};

const line = (x1: number, y1: number, x2: number, y2: number, r: number, z = 0): Seg => ({
  a: [x1, y1, z],
  b: [x2, y2, z],
  r,
});

const BULL: Seg[] = [
  line(-0.72, 0.78, 0.46, 0.84, 0.055),
  line(0.32, 0.82, 0.28, 0.02, 0.032),
  line(0.12, 0.8, 0.06, 0.02, 0.032),
  line(-0.22, 0.76, -0.28, 0.02, 0.032),
  line(-0.48, 0.74, -0.56, 0.02, 0.032),
  line(0.46, 0.84, 0.66, 1.18, 0.04),
  line(0.66, 1.18, 0.98, 1.1, 0.038),
  line(0.82, 1.08, 1.05, 0.96, 0.026),
  line(0.7, 1.22, 0.52, 1.55, 0.026),
  line(0.74, 1.2, 0.96, 1.52, 0.026),
  line(-0.72, 0.8, -1.02, 1.12, 0.028),
  line(-1.02, 1.12, -0.88, 0.9, 0.024),
];

const OWL: Seg[] = [
  line(0, 0.22, 0, 0.95, 0.07),
  line(-0.08, 0.2, -0.22, 0.02, 0.028),
  line(0.08, 0.2, 0.22, 0.02, 0.028),
  line(0, 0.78, -0.55, 0.48, 0.03),
  line(0, 0.78, 0.55, 0.48, 0.03),
  line(-0.55, 0.48, -0.35, 0.28, 0.024),
  line(0.55, 0.48, 0.35, 0.28, 0.024),
  line(-0.14, 1.28, -0.28, 1.58, 0.026),
  line(0.14, 1.28, 0.28, 1.58, 0.026),
  line(0.12, 1.08, 0.32, 0.98, 0.022),
];

const BIRD: Seg[] = [
  line(-0.35, 0.62, 0.28, 0.72, 0.05),
  line(0.1, 0.55, 0.02, 0.02, 0.026),
  line(-0.12, 0.55, -0.22, 0.02, 0.026),
  line(0.28, 0.74, 0.42, 1.15, 0.032),
  line(0.42, 1.15, 0.62, 1.22, 0.03),
  line(0.62, 1.2, 0.92, 1.02, 0.022),
  line(0.88, 1.02, 0.78, 0.9, 0.018),
  line(-0.15, 0.7, -0.62, 0.95, 0.026),
  line(-0.35, 0.64, -0.7, 0.4, 0.024),
];

const IBIS: Seg[] = [
  line(-0.2, 0.58, 0.22, 0.7, 0.05),
  line(0.05, 0.52, -0.02, 0.02, 0.026),
  line(-0.16, 0.5, -0.26, 0.02, 0.026),
  line(0.22, 0.72, 0.34, 1.2, 0.03),
  line(0.34, 1.2, 0.5, 1.28, 0.032),
  line(0.5, 1.26, 1.05, 1.16, 0.022),
  line(-0.2, 0.62, -0.55, 0.85, 0.024),
];

const KNIFE: Seg[] = [
  line(0, 0.72, 0, 1.22, 0.045),
  line(-0.14, 0.7, -0.2, 0.02, 0.03),
  line(0.14, 0.7, 0.2, 0.02, 0.03),
  line(0, 1.05, -0.32, 0.7, 0.028),
  line(0, 1.08, 0.4, 0.92, 0.028),
  line(0.34, 0.98, 0.34, 0.86, 0.02),
  line(0.4, 0.92, 0.78, 1.16, 0.02),
];

const PERSON: Seg[] = [
  line(0, 0.72, 0, 1.22, 0.045),
  line(-0.14, 0.7, -0.18, 0.02, 0.03),
  line(0.14, 0.7, 0.18, 0.02, 0.03),
  line(0, 1.05, -0.34, 0.72, 0.028),
  line(0, 1.08, 0.36, 0.78, 0.028),
];

const SEATED: Seg[] = [
  line(0.05, 0.55, 0.05, 1.15, 0.045),
  line(0.05, 0.55, 0.48, 0.55, 0.032),
  line(0.48, 0.55, 0.48, 0.02, 0.03),
  line(-0.05, 0.52, -0.12, 0.02, 0.03),
  line(0.05, 1.0, 0.42, 0.82, 0.026),
  line(0.05, 0.95, -0.28, 0.7, 0.026),
];

const MOTHER: Seg[] = [
  ...SEATED,
  line(0.22, 0.78, 0.22, 1.05, 0.022),
  line(0.16, 0.72, 0.08, 0.58, 0.018),
  line(0.28, 0.72, 0.4, 0.58, 0.018),
];

const RAM: Seg[] = [
  line(0.05, 0.5, 0.05, 1.12, 0.045),
  line(0.05, 0.5, 0.5, 0.5, 0.032),
  line(0.5, 0.5, 0.5, 0.02, 0.03),
  line(0.02, 1.15, -0.28, 1.28, 0.024),
  line(-0.28, 1.28, -0.08, 1.42, 0.022),
  line(0.12, 1.15, 0.38, 1.32, 0.024),
  line(0.38, 1.32, 0.16, 1.46, 0.022),
  line(0.05, 0.95, 0.08, 0.55, 0.02),
  line(-0.05, 0.78, 0.16, 0.78, 0.02),
];

const JACKAL: Seg[] = [
  line(-0.45, 0.62, 0.35, 0.7, 0.04),
  line(0.22, 0.66, 0.16, 0.02, 0.026),
  line(0.02, 0.64, -0.04, 0.02, 0.026),
  line(-0.22, 0.6, -0.28, 0.02, 0.026),
  line(-0.4, 0.58, -0.48, 0.02, 0.026),
  line(0.35, 0.72, 0.72, 0.78, 0.03),
  line(0.55, 0.84, 0.42, 1.08, 0.022),
  line(0.55, 0.84, 0.72, 1.08, 0.022),
  line(-0.45, 0.64, -0.75, 0.85, 0.024),
];

const BEE: Seg[] = [
  line(-0.15, 0.7, 0.35, 0.7, 0.055),
  line(0.35, 0.7, 0.62, 0.7, 0.035),
  line(0.05, 0.78, -0.28, 1.15, 0.018),
  line(0.12, 0.78, 0.42, 1.18, 0.018),
  line(0.5, 0.78, 0.42, 1.05, 0.016),
  line(0.5, 0.78, 0.7, 1.02, 0.016),
  line(-0.05, 0.62, -0.2, 0.02, 0.02),
  line(0.15, 0.62, 0.05, 0.02, 0.02),
  line(0.32, 0.62, 0.4, 0.02, 0.02),
];

const SCARAB: Seg[] = [
  line(-0.15, 0.55, 0.28, 0.55, 0.07),
  line(0.28, 0.55, 0.55, 0.55, 0.04),
  line(-0.05, 0.62, -0.35, 0.95, 0.022),
  line(0.08, 0.62, 0.35, 0.95, 0.022),
  line(-0.2, 0.48, -0.45, 0.2, 0.02),
  line(0.05, 0.45, -0.1, 0.12, 0.02),
  line(0.28, 0.45, 0.22, 0.12, 0.02),
  line(0.42, 0.48, 0.62, 0.22, 0.02),
];

const BEAST: Seg[] = [
  line(-0.55, 0.62, 0.4, 0.68, 0.045),
  line(0.22, 0.66, 0.16, 0.02, 0.028),
  line(0.02, 0.64, -0.04, 0.02, 0.028),
  line(-0.25, 0.6, -0.32, 0.02, 0.028),
  line(-0.45, 0.58, -0.52, 0.02, 0.028),
  line(0.4, 0.7, 0.62, 0.95, 0.032),
  line(0.48, 1.0, 0.32, 1.18, 0.02),
  line(0.48, 1.0, 0.66, 1.18, 0.02),
  line(-0.55, 0.64, -0.85, 0.85, 0.024),
];

const FIGURES: Record<Kind, { segs: Seg[]; dots: Dot[] }> = {
  bull: { segs: BULL, dots: [{ p: [0.78, 1.14, 0.02], r: 0.035 }] },
  owl: {
    segs: OWL,
    dots: [
      { p: [-0.08, 1.18, 0.04], r: 0.045 },
      { p: [0.1, 1.18, 0.04], r: 0.045 },
    ],
  },
  bird: { segs: BIRD, dots: [{ p: [0.52, 1.2, 0.03], r: 0.04 }] },
  ibis: { segs: IBIS, dots: [{ p: [0.42, 1.26, 0.03], r: 0.04 }] },
  knife: { segs: KNIFE, dots: [{ p: [0, 1.4, 0], r: 0.11 }] },
  person: { segs: PERSON, dots: [{ p: [0, 1.4, 0], r: 0.11 }] },
  seated: { segs: SEATED, dots: [{ p: [0.05, 1.32, 0], r: 0.1 }] },
  mother: {
    segs: MOTHER,
    dots: [
      { p: [0.05, 1.32, 0], r: 0.1 },
      { p: [0.22, 1.14, 0.02], r: 0.055 },
    ],
  },
  ram: { segs: RAM, dots: [{ p: [0.05, 1.22, 0], r: 0.09 }] },
  jackal: { segs: JACKAL, dots: [{ p: [0.62, 0.8, 0.02], r: 0.045 }] },
  bee: { segs: BEE, dots: [{ p: [0.62, 0.7, 0], r: 0.06 }] },
  scarab: { segs: SCARAB, dots: [{ p: [0.52, 0.55, 0.02], r: 0.05 }] },
  beast: { segs: BEAST, dots: [{ p: [0.58, 0.88, 0.02], r: 0.05 }] },
};

export function kindOf(glyph: string): Kind {
  const cp = [...glyph][0]?.codePointAt(0) ?? 0;
  if (cp === 0x130d2 || (cp >= 0x130d0 && cp <= 0x130d6)) return "bull";
  if (cp === 0x13153) return "owl";
  if (cp === 0x1304d) return "knife";
  if (cp === 0x131a4) return "bee";
  if (cp === 0x13189) return "scarab";
  if (cp === 0x1305f) return "ibis";
  if (cp === 0x13061) return "ram";
  if (cp === 0x13062) return "jackal";
  if (cp === 0x13056) return "mother";
  if (cp === 0x1313f) return "bird";
  if (cp >= 0x13000 && cp <= 0x1304c) return "person";
  if (cp >= 0x1304e && cp <= 0x1307f) return "seated";
  if (cp >= 0x130c0 && cp <= 0x1313e) return "beast";
  if (cp >= 0x1313f && cp <= 0x1317f) return "bird";
  if (cp >= 0x13180 && cp <= 0x131b0) return "scarab";
  return "person";
}

const DEFAULT_TRAITS: Record<string, string> = {
  Alchemy: "☉ Gold",
  Glyph: "𓁟",
  Hierarchy: "Scribe",
  Time: "Ra - Day",
};

function Bone({ a, b, r, mat }: { a: V; b: V; r: number; mat: THREE.Material }) {
  const geom = useMemo(() => {
    const start = new THREE.Vector3(...a);
    const end = new THREE.Vector3(...b);
    const len = Math.max(0.02, start.distanceTo(end));
    const mid = start.clone().add(end).multiplyScalar(0.5);
    const q = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      end.clone().sub(start).normalize(),
    );
    return { len, pos: [mid.x, mid.y, mid.z] as V, q };
  }, [a, b]);
  return (
    <mesh position={geom.pos} quaternion={geom.q} material={mat} castShadow>
      <cylinderGeometry args={[r, r, geom.len, 6]} />
    </mesh>
  );
}

function RankMark({ rank, mat }: { rank: Rank; mat: THREE.Material }) {
  if (rank === "noble") {
    return (
      <mesh position={[0, 1.95, 0]} material={mat}>
        <torusGeometry args={[0.16, 0.035, 8, 18]} />
      </mesh>
    );
  }
  if (rank === "royal" || rank === "pharaoh") {
    return (
      <mesh position={[0, rank === "pharaoh" ? 2.05 : 1.95, 0]} material={mat} castShadow>
        <coneGeometry args={[rank === "pharaoh" ? 0.16 : 0.12, rank === "pharaoh" ? 0.42 : 0.28, 5]} />
      </mesh>
    );
  }
  if (rank === "scribe") {
    return (
      <mesh position={[0, 1.95, 0]} material={mat}>
        <boxGeometry args={[0.28, 0.16, 0.04]} />
      </mesh>
    );
  }
  if (rank === "farmer") {
    return (
      <group position={[0, 1.9, 0]}>
        <Bone a={[0.12, 0.2, 0]} b={[-0.16, -0.16, 0]} r={0.028} mat={mat} />
        <Bone a={[-0.16, -0.16, 0]} b={[0.08, -0.22, 0]} r={0.024} mat={mat} />
      </group>
    );
  }
  if (rank === "merchant") {
    return (
      <mesh position={[0, 1.95, 0]} material={mat}>
        <boxGeometry args={[0.22, 0.18, 0.16]} />
      </mesh>
    );
  }
  if (rank === "priest") {
    return (
      <group position={[0, 1.85, 0]}>
        <Bone a={[0, 0, 0]} b={[0, 0.45, 0]} r={0.025} mat={mat} />
        <mesh position={[0, 0.45, 0]} material={mat}>
          <torusGeometry args={[0.08, 0.025, 6, 12]} />
        </mesh>
      </group>
    );
  }
  return (
    <mesh position={[0, 1.95, 0]} material={mat}>
      <sphereGeometry args={[0.08, 10, 10]} />
    </mesh>
  );
}

function HourMark({ hour, mat }: { hour: Hour; mat: THREE.Material }) {
  if (hour === "night") {
    return (
      <mesh position={[0, 2.45, 0]} rotation={[0, 0, 0.4]} material={mat}>
        <torusGeometry args={[0.14, 0.028, 6, 14, Math.PI * 1.35]} />
      </mesh>
    );
  }
  if (hour === "morning") {
    return (
      <group position={[0, 2.42, 0]}>
        <mesh position={[0, 0.06, 0]} material={mat}>
          <sphereGeometry args={[0.1, 12, 10]} />
        </mesh>
        <Bone a={[-0.22, -0.06, 0]} b={[0.22, -0.06, 0]} r={0.02} mat={mat} />
      </group>
    );
  }
  if (hour === "evening") {
    return (
      <group position={[0, 2.38, 0]}>
        <mesh position={[0, -0.02, 0]} material={mat}>
          <sphereGeometry args={[0.09, 12, 10]} />
        </mesh>
        <Bone a={[-0.2, 0.12, 0]} b={[0.2, 0.12, 0]} r={0.02} mat={mat} />
      </group>
    );
  }
  return (
    <group position={[0, 2.48, 0]}>
      <mesh material={mat}>
        <sphereGeometry args={[0.1, 12, 10]} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <Bone
            key={i}
            a={[Math.cos(a) * 0.14, Math.sin(a) * 0.14, 0]}
            b={[Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0]}
            r={0.016}
            mat={mat}
          />
        );
      })}
    </group>
  );
}

export function GlyphStick({ traits }: { traits?: Record<string, string> | null }) {
  const look = lookOf(traits ?? DEFAULT_TRAITS);
  const kind = kindOf(look.mark);
  const figure = FIGURES[kind];
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: METAL[look.metal],
        metalness: 0.88,
        roughness: look.metal === "iron" ? 0.22 : 0.36,
      }),
    [look.metal],
  );
  return (
    <group position={[0, 0.02, 0]} scale={1.65}>
      {figure.segs.map((seg, index) => (
        <Bone key={index} a={seg.a} b={seg.b} r={seg.r} mat={mat} />
      ))}
      {figure.dots.map((dot, index) => (
        <mesh key={`d${index}`} position={dot.p} material={mat} castShadow>
          <sphereGeometry args={[dot.r, 10, 10]} />
        </mesh>
      ))}
      {kind === "owl" ? (
        <mesh position={[0, 1.16, 0]} material={mat}>
          <torusGeometry args={[0.22, 0.03, 6, 16]} />
        </mesh>
      ) : null}
      <RankMark rank={look.rank} mat={mat} />
      <HourMark hour={look.hour} mat={mat} />
    </group>
  );
}
