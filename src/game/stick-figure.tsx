import { useMemo } from "react";
import * as THREE from "three";
import { lookOf, type Hour, type Metal, type Rank } from "@/lib/avatar";

type Kind =
  | "bull"
  | "owl"
  | "bird"
  | "ibis"
  | "knife"
  | "person"
  | "seated"
  | "mother"
  | "ram"
  | "jackal"
  | "bee"
  | "scarab"
  | "beast"
  | "turtle";

const METAL: Record<Metal, number> = {
  iron: 0xb0b6bc,
  gold: 0xd4a84b,
  silver: 0xd8d3c8,
  copper: 0xb86a4a,
};

const EYE = new THREE.MeshBasicMaterial({ color: 0x1a120c });
const WING = new THREE.MeshStandardMaterial({
  color: 0xf4efe4,
  transparent: true,
  opacity: 0.55,
  roughness: 0.2,
});

export function kindOf(glyph: string): Kind {
  const cp = [...glyph][0]?.codePointAt(0) ?? 0;
  if (cp === 0x131a1 || cp === 0x131a2) return "turtle";
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

function Eyes({ y, z, gap, r }: { y: number; z: number; gap: number; r: number }) {
  return (
    <group>
      {[-gap, gap].map((x) => (
        <mesh key={x} position={[x, y, z]}>
          <sphereGeometry args={[r, 8, 8]} />
          <primitive object={EYE} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Man({ mat, blade, horns }: { mat: THREE.Material; blade?: boolean; horns?: boolean }) {
  return (
    <group>
      {[-0.11, 0.11].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.4, 0]} material={mat} castShadow>
            <cylinderGeometry args={[0.07, 0.055, 0.78, 8]} />
          </mesh>
          <mesh position={[x, 0.05, 0.06]} material={mat} castShadow>
            <boxGeometry args={[0.12, 0.07, 0.24]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.86, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.18, 0.24, 0.32, 8]} />
      </mesh>
      <mesh position={[0, 1.16, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.16, 0.2, 0.38, 8]} />
      </mesh>
      <mesh position={[0, 1.5, 0.02]} material={mat} castShadow>
        <sphereGeometry args={[0.16, 16, 12]} />
      </mesh>
      <Eyes y={1.54} z={0.14} gap={0.055} r={0.025} />
      <mesh position={[-0.26, 1.08, 0.02]} rotation={[0.2, 0, 0.55]} material={mat} castShadow>
        <cylinderGeometry args={[0.045, 0.04, 0.46, 6]} />
      </mesh>
      <mesh position={[0.28, 1.05, 0.08]} rotation={[blade ? 0.2 : 0.35, 0, -0.7]} material={mat} castShadow>
        <cylinderGeometry args={[0.045, 0.04, 0.46, 6]} />
      </mesh>
      {blade ? (
        <mesh position={[0.5, 1.22, 0.18]} rotation={[0.15, 0, 0.55]} material={mat} castShadow>
          <boxGeometry args={[0.035, 0.46, 0.1]} />
        </mesh>
      ) : null}
      {horns ? (
        <group>
          <mesh position={[-0.12, 1.66, 0]} rotation={[0, 0, 0.8]} material={mat} castShadow>
            <torusGeometry args={[0.1, 0.025, 6, 10, Math.PI]} />
          </mesh>
          <mesh position={[0.12, 1.66, 0]} rotation={[0, Math.PI, -0.8]} material={mat} castShadow>
            <torusGeometry args={[0.1, 0.025, 6, 10, Math.PI]} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

function Seated({ mat, child }: { mat: THREE.Material; child?: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.42, 0.16]} rotation={[1.15, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.07, 0.055, 0.42, 7]} />
      </mesh>
      <mesh position={[0.16, 0.22, 0.28]} rotation={[1.2, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.065, 0.05, 0.4, 7]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.46, 8]} />
      </mesh>
      <mesh position={[0, 1.12, 0.02]} material={mat} castShadow>
        <sphereGeometry args={[0.15, 14, 12]} />
      </mesh>
      <Eyes y={1.16} z={0.14} gap={0.05} r={0.022} />
      <mesh position={[-0.22, 0.78, 0.08]} rotation={[0.4, 0, 0.4]} material={mat} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.36, 6]} />
      </mesh>
      <mesh position={[0.2, 0.74, 0.16]} rotation={[0.8, 0, -0.3]} material={mat} castShadow>
        <cylinderGeometry args={[0.04, 0.035, 0.34, 6]} />
      </mesh>
      {child ? (
        <group position={[0.05, 0.7, 0.22]}>
          <mesh material={mat} castShadow>
            <sphereGeometry args={[0.09, 10, 8]} />
          </mesh>
          <mesh position={[0, 0.12, 0.02]} material={mat} castShadow>
            <sphereGeometry args={[0.055, 10, 8]} />
          </mesh>
        </group>
      ) : null}
    </group>
  );
}

function Bull({ mat }: { mat: THREE.Material }) {
  return (
    <group>
      <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.22, 0.2, 0.95, 10]} />
      </mesh>
      {[
        [-0.16, 0.28],
        [0.16, 0.28],
        [-0.16, -0.28],
        [0.16, -0.28],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.28, z]} material={mat} castShadow>
          <cylinderGeometry args={[0.06, 0.05, 0.52, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 0.86, 0.58]} material={mat} castShadow>
        <sphereGeometry args={[0.16, 12, 10]} />
      </mesh>
      <mesh position={[0, 0.8, 0.74]} rotation={[Math.PI / 2, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.07, 0.05, 0.18, 8]} />
      </mesh>
      <Eyes y={0.9} z={0.7} gap={0.06} r={0.02} />
      <mesh position={[-0.1, 1.02, 0.52]} rotation={[0.2, 0, 0.7]} material={mat} castShadow>
        <coneGeometry args={[0.04, 0.28, 6]} />
      </mesh>
      <mesh position={[0.1, 1.02, 0.52]} rotation={[0.2, 0, -0.7]} material={mat} castShadow>
        <coneGeometry args={[0.04, 0.28, 6]} />
      </mesh>
      <mesh position={[0, 0.7, -0.62]} rotation={[0.8, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.025, 0.04, 0.36, 5]} />
      </mesh>
    </group>
  );
}

function Owl({ mat }: { mat: THREE.Material }) {
  return (
    <group>
      <mesh position={[0, 0.78, 0]} material={mat} castShadow>
        <sphereGeometry args={[0.34, 16, 12]} />
      </mesh>
      <mesh position={[0, 1.16, 0.1]} material={mat} castShadow>
        <sphereGeometry args={[0.2, 14, 12]} />
      </mesh>
      <Eyes y={1.2} z={0.26} gap={0.08} r={0.03} />
      <mesh position={[0, 1.08, 0.28]} rotation={[1.2, 0, 0]} material={mat} castShadow>
        <coneGeometry args={[0.04, 0.12, 6]} />
      </mesh>
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.42, 0.8, 0]} rotation={[0, 0, side * 0.35]} material={mat} castShadow>
          <boxGeometry args={[0.48, 0.08, 0.28]} />
        </mesh>
      ))}
      {[-0.1, 0.1].map((x) => (
        <mesh key={`tuft-${x}`} position={[x, 1.4, 0.04]} rotation={[0, 0, x > 0 ? -0.35 : 0.35]} material={mat} castShadow>
          <coneGeometry args={[0.045, 0.18, 5]} />
        </mesh>
      ))}
      {[-0.08, 0.08].map((x) => (
        <mesh key={`foot-${x}`} position={[x, 0.36, 0.04]} material={mat} castShadow>
          <cylinderGeometry args={[0.03, 0.025, 0.28, 5]} />
        </mesh>
      ))}
    </group>
  );
}

function Bird({ mat, beak }: { mat: THREE.Material; beak: number }) {
  return (
    <group>
      <mesh position={[0, 0.72, -0.02]} rotation={[Math.PI / 2, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.13, 0.17, 0.5, 8]} />
      </mesh>
      <mesh position={[0, 0.98, 0.22]} rotation={[0.45, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.04, 0.055, 0.34, 6]} />
      </mesh>
      <mesh position={[0, 1.16, 0.36]} material={mat} castShadow>
        <sphereGeometry args={[0.1, 12, 10]} />
      </mesh>
      <mesh position={[0, 1.14, 0.36 + beak * 0.45]} rotation={[Math.PI / 2, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.015, 0.032, beak, 5]} />
      </mesh>
      <Eyes y={1.2} z={0.44} gap={0.04} r={0.016} />
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.36, 0.78, 0]} rotation={[0, 0, side * 0.25]} material={mat} castShadow>
          <boxGeometry args={[0.46, 0.05, 0.22]} />
        </mesh>
      ))}
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.32, 0.02]} material={mat} castShadow>
          <cylinderGeometry args={[0.02, 0.016, 0.52, 5]} />
        </mesh>
      ))}
      <mesh position={[0, 0.78, -0.36]} rotation={[1.1, 0, 0]} material={mat} castShadow>
        <coneGeometry args={[0.07, 0.32, 5]} />
      </mesh>
    </group>
  );
}

function Quad({ mat, ears }: { mat: THREE.Material; ears: number }) {
  return (
    <group>
      <mesh position={[0, 0.48, 0]} rotation={[Math.PI / 2, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.14, 0.16, 0.7, 8]} />
      </mesh>
      {[
        [-0.1, 0.22],
        [0.1, 0.22],
        [-0.1, -0.2],
        [0.1, -0.2],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.22, z]} material={mat} castShadow>
          <cylinderGeometry args={[0.035, 0.03, 0.4, 5]} />
        </mesh>
      ))}
      <mesh position={[0, 0.62, 0.42]} material={mat} castShadow>
        <sphereGeometry args={[0.12, 12, 10]} />
      </mesh>
      <mesh position={[0, 0.58, 0.56]} rotation={[Math.PI / 2, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.04, 0.06, 0.16, 6]} />
      </mesh>
      <Eyes y={0.66} z={0.5} gap={0.04} r={0.016} />
      {[-0.06, 0.06].map((x) => (
        <mesh key={x} position={[x, 0.74, 0.4]} material={mat} castShadow>
          <coneGeometry args={[0.03, ears, 5]} />
        </mesh>
      ))}
      <mesh position={[0, 0.52, -0.42]} rotation={[0.7, 0, 0]} material={mat} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 0.28, 5]} />
      </mesh>
    </group>
  );
}

function Bee({ mat }: { mat: THREE.Material }) {
  return (
    <group>
      <mesh position={[0, 0.55, 0]} scale={[0.7, 0.7, 1.3]} material={mat} castShadow>
        <sphereGeometry args={[0.22, 14, 10]} />
      </mesh>
      <mesh position={[0, 0.58, 0.32]} material={mat} castShadow>
        <sphereGeometry args={[0.1, 10, 8]} />
      </mesh>
      <Eyes y={0.62} z={0.4} gap={0.04} r={0.018} />
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * 0.16, 0.72, 0]} rotation={[0.4, 0, side * 0.5]}>
          <sphereGeometry args={[0.12, 8, 6]} />
          <primitive object={WING} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

function Scarab({ mat }: { mat: THREE.Material }) {
  return (
    <group>
      <mesh position={[0, 0.32, 0]} scale={[1.3, 0.55, 1]} material={mat} castShadow>
        <sphereGeometry args={[0.28, 14, 10]} />
      </mesh>
      <mesh position={[0, 0.28, 0.28]} material={mat} castShadow>
        <sphereGeometry args={[0.1, 10, 8]} />
      </mesh>
      <Eyes y={0.32} z={0.36} gap={0.04} r={0.016} />
      {[-0.18, 0.18].map((x) =>
        [-0.08, 0.08].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.12, z]} rotation={[0.6, 0, x > 0 ? -0.8 : 0.8]} material={mat} castShadow>
            <cylinderGeometry args={[0.02, 0.015, 0.2, 4]} />
          </mesh>
        )),
      )}
    </group>
  );
}

function Turtle({ mat }: { mat: THREE.Material }) {
  return (
    <group>
      <mesh position={[0, 0.32, 0]} scale={[1.15, 0.55, 1.35]} material={mat} castShadow>
        <sphereGeometry args={[0.34, 16, 12]} />
      </mesh>
      <mesh position={[0, 0.28, 0.42]} material={mat} castShadow>
        <sphereGeometry args={[0.1, 10, 8]} />
      </mesh>
      <Eyes y={0.32} z={0.5} gap={0.04} r={0.016} />
      {[
        [-0.2, 0.12],
        [0.2, 0.12],
        [-0.2, -0.16],
        [0.2, -0.16],
      ].map(([x, z]) => (
        <mesh key={`${x}-${z}`} position={[x, 0.1, z]} material={mat} castShadow>
          <sphereGeometry args={[0.06, 8, 6]} />
        </mesh>
      ))}
    </group>
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
  if (rank === "priest") {
    return (
      <mesh position={[0, 2.05, 0]} material={mat}>
        <torusGeometry args={[0.08, 0.025, 6, 12]} />
      </mesh>
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
      <mesh position={[0, 2.35, 0]} rotation={[0, 0, 0.4]} material={mat}>
        <torusGeometry args={[0.12, 0.025, 6, 14, Math.PI * 1.35]} />
      </mesh>
    );
  }
  if (hour === "morning" || hour === "evening") {
    return (
      <mesh position={[0, hour === "evening" ? 2.22 : 2.38, 0]} material={mat}>
        <sphereGeometry args={[0.09, 12, 10]} />
      </mesh>
    );
  }
  return (
    <mesh position={[0, 2.4, 0]} material={mat}>
      <sphereGeometry args={[0.1, 12, 10]} />
    </mesh>
  );
}

function Body({ kind, mat }: { kind: Kind; mat: THREE.Material }) {
  if (kind === "bull") return <Bull mat={mat} />;
  if (kind === "owl") return <Owl mat={mat} />;
  if (kind === "ibis") return <Bird mat={mat} beak={0.42} />;
  if (kind === "bird") return <Bird mat={mat} beak={0.16} />;
  if (kind === "jackal") return <Quad mat={mat} ears={0.18} />;
  if (kind === "beast") return <Quad mat={mat} ears={0.1} />;
  if (kind === "bee") return <Bee mat={mat} />;
  if (kind === "scarab") return <Scarab mat={mat} />;
  if (kind === "turtle") return <Turtle mat={mat} />;
  if (kind === "knife") return <Man mat={mat} blade />;
  if (kind === "ram") return <Man mat={mat} horns />;
  if (kind === "seated") return <Seated mat={mat} />;
  if (kind === "mother") return <Seated mat={mat} child />;
  return <Man mat={mat} />;
}

export function GlyphStick({ traits }: { traits?: Record<string, string> | null }) {
  const look = lookOf(traits ?? DEFAULT_TRAITS);
  const kind = kindOf(look.mark);
  const mat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: METAL[look.metal],
        metalness: 0.74,
        roughness: look.metal === "iron" ? 0.28 : 0.4,
      }),
    [look.metal],
  );
  return (
    <group position={[0, 0.02, 0]} scale={1.15}>
      <Body kind={kind} mat={mat} />
      <RankMark rank={look.rank} mat={mat} />
      <HourMark hour={look.hour} mat={mat} />
    </group>
  );
}
