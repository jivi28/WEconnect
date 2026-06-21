"use client";

import {
  Component,
  forwardRef,
  type ReactNode,
  Suspense,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, type ThreeEvent, useFrame } from "@react-three/fiber";
import { OrbitControls, useGLTF } from "@react-three/drei";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import * as THREE from "three";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Viewer3DHandle {
  /** Return the camera/orbit to its initial framing. */
  resetCamera: () => void;
}

export interface ComponentViewer3DProps {
  modelPath: string;
  height?: number;
  autoRotate?: boolean;
  className?: string;
  enableControls?: boolean;
  enableZoom?: boolean;
  enablePan?: boolean;
  enableRotate?: boolean;
  cameraPosition?: [number, number, number];
  fov?: number;
  normalizeTo?: number;
  fitMode?: "longest-axis" | "bounding-sphere";
  stopPointerPropagation?: boolean;
  /** Fires on a genuine click (not a rotate-drag) on the model geometry. */
  onModelClick?: () => void;
}

/** Catches a failed model load (e.g. a missing .bin buffer) and reports it up. */
class ModelBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

function getVisibleBounds(root: THREE.Object3D) {
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3();

  root.traverse((node) => {
    const mesh = node as THREE.Mesh;
    if (!mesh.isMesh || !mesh.visible || !mesh.geometry) return;
    if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
    if (!mesh.geometry.boundingBox) return;
    bounds.union(mesh.geometry.boundingBox.clone().applyMatrix4(mesh.matrixWorld));
  });

  return bounds.isEmpty() ? new THREE.Box3().setFromObject(root) : bounds;
}

/**
 * Loads + renders the glTF exactly as exported from CAD. Cloned per-instance so
 * multiple viewers coexist. The ONLY manipulation is a uniform scale so the
 * longest bounding-box axis equals `normalizeTo` — materials, colours,
 * roughness and metalness are never touched.
 */
function Model({
  url,
  normalizeTo,
  fitMode,
  autoSpin,
  onMeshClick,
}: {
  url: string;
  normalizeTo: number;
  fitMode: "longest-axis" | "bounding-sphere";
  autoSpin: boolean;
  onMeshClick?: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (autoSpin && groupRef.current) groupRef.current.rotation.y += delta * 0.5;
  });

  const object = useMemo(() => {
    const obj = scene.clone(true);

    // Bounding-sphere fitting is conservative enough to keep every corner in
    // frame at every rotation. Longest-axis fitting remains useful for static
    // catalogue previews where a tighter crop is preferable.
    const box = getVisibleBounds(obj);
    const size = new THREE.Vector3();
    box.getSize(size);
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    const sphere = new THREE.Sphere();
    box.getBoundingSphere(sphere);
    const sourceSpan =
      fitMode === "bounding-sphere" ? sphere.radius * 2 || 1 : maxDim;
    obj.scale.setScalar(normalizeTo / sourceSpan);

    // CAD exports often have an off-centre origin. Recalculate after scaling
    // and move the actual visual centre to the orbit/camera target.
    const scaledBox = getVisibleBounds(obj);
    const visualCenter = new THREE.Vector3();
    if (fitMode === "bounding-sphere") {
      const scaledSphere = new THREE.Sphere();
      scaledBox.getBoundingSphere(scaledSphere);
      visualCenter.copy(scaledSphere.center);
    } else {
      scaledBox.getCenter(visualCenter);
    }
    obj.position.sub(visualCenter);

    return obj;
  }, [scene, normalizeTo, fitMode]);

  return (
    <group ref={groupRef}>
      <primitive object={object} onClick={onMeshClick} />
    </group>
  );
}

/** Grey animated pulse placeholder, sized to the viewer it stands in for. */
function Skeleton({ height }: { height: number }) {
  return (
    <div
      style={{ height }}
      className="w-full animate-pulse rounded-md bg-[#ececec]"
    />
  );
}

/**
 * Self-contained Three.js viewer for a Würth Elektronik component.
 *
 * - Left-drag rotate · scroll zoom · right-drag pan (OrbitControls)
 * - Idle auto-rotation that pauses while the user interacts
 * - Fully transparent background so the model floats over the canvas
 * - Neutral white lighting only — the model is rendered faithfully (no
 *   environment maps, no material/colour overrides)
 * - Lazy: mounts the WebGL canvas only once the card scrolls into view
 */
export const ComponentViewer3D = forwardRef<
  Viewer3DHandle,
  ComponentViewer3DProps
>(function ComponentViewer3D(
  {
    modelPath,
    height = 200,
    autoRotate = true,
    className,
    enableControls = true,
    enableZoom = true,
    enablePan = true,
    enableRotate = true,
    cameraPosition = [1.5, 1.2, 1.5],
    fov = 45,
    normalizeTo = 1.0,
    fitMode = "longest-axis",
    stopPointerPropagation = true,
    onModelClick,
  },
  ref,
) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [autoRotating, setAutoRotating] = useState(autoRotate);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(
    () => typeof IntersectionObserver === "undefined",
  );
  const [modelError, setModelError] = useState(false);

  // Click-vs-drag detection so rotating the model doesn't trigger onModelClick.
  const downAt = useRef<{ x: number; y: number } | null>(null);
  const moved = useRef(false);

  // Keep WebGL alive only while the preview is near the viewport. The full
  // catalogue contains dozens of models, so retaining every visited canvas
  // eventually exhausts the browser's context limit.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([entry]) => setReady(entry.isIntersecting),
      { rootMargin: "80px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    resetCamera: () => {
      controlsRef.current?.reset();
      setAutoRotating(autoRotate);
    },
  }));

  function handleInteractStart() {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    setAutoRotating(false);
  }
  function handleInteractEnd() {
    if (!autoRotate) return;
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setAutoRotating(true), 2500);
  }

  function handleMeshClick(e: ThreeEvent<MouseEvent>) {
    e.stopPropagation();
    if (!moved.current) onModelClick?.();
  }

  return (
    <div
      ref={containerRef}
      // Keep OrbitControls' pointer/wheel gestures from reaching dnd-kit, and
      // track movement so a rotate-drag isn't mistaken for a click.
      onPointerDown={(e) => {
        if (stopPointerPropagation) e.stopPropagation();
        downAt.current = { x: e.clientX, y: e.clientY };
        moved.current = false;
      }}
      onPointerMove={(e) => {
        if (!downAt.current) return;
        const dx = e.clientX - downAt.current.x;
        const dy = e.clientY - downAt.current.y;
        if (dx * dx + dy * dy > 16) moved.current = true;
      }}
      onPointerUp={() => {
        downAt.current = null;
      }}
      // Don't let a model click bubble to the canvas (which dismisses popovers).
      onClick={stopPointerPropagation ? (e) => e.stopPropagation() : undefined}
      onWheel={stopPointerPropagation ? (e) => e.stopPropagation() : undefined}
      style={{ height }}
      className={cn("relative w-full bg-transparent", className)}
    >
      {ready && !modelError ? (
        <Suspense fallback={<Skeleton height={height} />}>
          <Canvas
            dpr={[1, 2]}
            camera={{ position: cameraPosition, fov }}
            onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
            gl={{ alpha: true, antialias: true }}
            style={{ background: "transparent" }}
          >
            {/* Neutral white lighting only — render exactly as exported. */}
            <ambientLight intensity={0.9} color="#ffffff" />
            <directionalLight position={[2, 4, 3]} intensity={0.8} color="#ffffff" />
            <directionalLight position={[-2, 1, -2]} intensity={0.3} color="#ffffff" />

            <ModelBoundary onError={() => setModelError(true)}>
              <Model
                url={modelPath}
                normalizeTo={normalizeTo}
                fitMode={fitMode}
                autoSpin={autoRotate && !enableControls}
                onMeshClick={handleMeshClick}
              />
            </ModelBoundary>

            {enableControls && (
              <OrbitControls
                ref={controlsRef}
                makeDefault
                target={[0, 0, 0]}
                enablePan={enablePan}
                enableZoom={enableZoom}
                enableRotate={enableRotate}
                autoRotate={autoRotating}
                autoRotateSpeed={0.8}
                minDistance={1.4}
                maxDistance={9}
                enableDamping
                dampingFactor={0.08}
                onStart={handleInteractStart}
                onEnd={handleInteractEnd}
              />
            )}
          </Canvas>
        </Suspense>
      ) : modelError ? (
        <div
          style={{ height }}
          className="flex w-full flex-col items-center justify-center gap-1.5 px-3 text-center"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#CC0000]/35 bg-[#CC0000]/10 text-[#CC0000]">
            <Box size={22} strokeWidth={1.5} />
          </span>
          <span className="text-[10px] leading-tight text-ink-faint">
            Component preview
          </span>
        </div>
      ) : (
        <Skeleton height={height} />
      )}
    </div>
  );
});
