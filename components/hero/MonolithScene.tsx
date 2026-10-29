"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { easing } from "maath";
import { useEffect, useMemo, useRef } from "react";
import type { Group } from "three";
import { getSceneMode } from "@/lib/sceneState";

const SLABS = 7;
const SLAB_GAP = 0.2;

type Props = {
  active: boolean;
  quality: "high" | "low";
  onReady?: () => void;
};

// ألواح متراكبة مثل صفحات كتاب: كروم مصقول وحجر obsidian أسود.
export default function MonolithScene({ active, quality, onReady }: Props) {
  return (
    <Canvas
      frameloop={active ? "always" : "never"}
      dpr={[1, quality === "high" ? 1.5 : 1.25]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
      camera={{ position: [0, 0.4, 7], fov: 30 }}
      onCreated={() => onReady?.()}
    >
      <Slabs />
      <ContactShadows position={[0, -1.7, 0]} opacity={0.55} scale={9} blur={2.6} far={3.5} resolution={512} color="#000000" />
      <Studio />
    </Canvas>
  );
}

// إضاءة استوديو أحادية مبنية من مصادر ضوء داخل المشهد، بدون تحميل HDRI من الإنترنت.
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <color attach="background" args={["#050505"]} />
      {/* شرائط سقف متوازية: تعطي الأسطح العلوية انعكاسات خطية مثل تصوير المنتجات. */}
      {[-3, -0.8, 1.6].map((z, i) => (
        <Lightformer key={z} form="rect" intensity={[1.2, 2.2, 0.8][i]} position={[0, 6, z]} rotation-x={Math.PI / 2} scale={[14, [0.8, 1.6, 0.5][i], 1]} />
      ))}
      <Lightformer form="rect" intensity={0.25} position={[0, 7, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} />
      {/* شرائط ضوء حادة تصنع خطوط اللمعان على الحواف. */}
      <Lightformer form="rect" intensity={5} position={[0, 3, -4]} scale={[12, 0.6, 1]} />
      <Lightformer form="rect" intensity={2.5} position={[-6, 1, 0]} rotation-y={Math.PI / 2} scale={[10, 1.5, 1]} />
      <Lightformer form="rect" intensity={1.4} position={[6, 0, 0]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
      {/* إضاءة أمامية خافتة عشان واجهات الألواح ما تختفي في السواد. */}
      <Lightformer form="rect" intensity={0.6} position={[0, 0, 8]} scale={[12, 6, 1]} />
    </Environment>
  );
}

function Slabs() {
  const group = useRef<Group>(null);
  const slabs = useRef<(Group | null)[]>([]);
  const { pointer, size } = useThree();
  const narrow = size.width < 640;

  // كل لوح له ميلان وإزاحة بسيطة ثابتة، عشان الكومة تبان طبيعية.
  const rest = useMemo(
    () =>
      Array.from({ length: SLABS }, (_, i) => {
        const t = i / (SLABS - 1) - 0.5;
        return {
          y: (i - (SLABS - 1) / 2) * SLAB_GAP,
          rotY: Math.sin(i * 1.7) * 0.18,
          x: Math.sin(i * 2.3) * 0.06,
          z: Math.cos(i * 1.3) * 0.05,
          chrome: i % 2 === 0,
          scatter: { y: t * 3.2, rotY: (i % 2 ? 1 : -1) * (0.6 + i * 0.15), rotZ: Math.sin(i * 3.1) * 0.35 },
        };
      }),
    [],
  );

  const reduced = useRef(false);
  useEffect(() => {
    reduced.current = matchMedia("(prefers-reduced-motion: reduce)").matches;
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.elapsedTime;
    const processing = getSceneMode() === "processing";
    const still = reduced.current;

    // دوران بطيء + ميلان مع المؤشر (في الجوال حركة تلقائية هادية).
    const px = narrow ? Math.sin(t * 0.35) * 0.4 : pointer.x;
    const py = narrow ? Math.cos(t * 0.28) * 0.25 : pointer.y;
    const spin = still ? 0 : t * (processing ? 0.55 : 0.12);
    easing.dampE(g.rotation, [0.5 - py * 0.12, -0.5 + spin + px * 0.35, 0.05], 0.6, delta);
    easing.damp3(g.position, [0, still ? 0 : Math.sin(t * 0.6) * 0.06, 0], 0.8, delta);

    // وقت المعالجة: الألواح تنفصل وتدور، وبعدها ترجع تترتب.
    const phase = processing ? (Math.sin(t * 1.1) + 1) / 2 : 0;
    slabs.current.forEach((slab, i) => {
      if (!slab) return;
      const r = rest[i];
      const y = r.y + (r.scatter.y - r.y) * phase * 0.85;
      easing.damp3(slab.position, [r.x, y, r.z], processing ? 0.35 : 0.7, delta);
      easing.dampE(
        slab.rotation,
        [0, r.rotY + r.scatter.rotY * phase, r.scatter.rotZ * phase],
        processing ? 0.4 : 0.8,
        delta,
      );
    });
  });

  return (
    <group ref={group} scale={narrow ? 1.05 : 1.2} rotation={[0.5, -0.5, 0.05]}>
      {rest.map((r, i) => (
        <group key={i} ref={(el) => void (slabs.current[i] = el)} position={[r.x, r.y, r.z]} rotation={[0, r.rotY, 0]}>
          <RoundedBox args={[2.6, 0.13, 1.8]} radius={0.05} smoothness={4} castShadow>
            {r.chrome ? (
              <meshPhysicalMaterial color="#e6e6e6" metalness={1} roughness={0.2} clearcoat={0.5} clearcoatRoughness={0.15} envMapIntensity={1.6} />
            ) : (
              <meshPhysicalMaterial color="#0a0a0a" metalness={0.5} roughness={0.12} clearcoat={1} clearcoatRoughness={0.03} envMapIntensity={1.3} />
            )}
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}
