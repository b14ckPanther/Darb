import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  AmbientLight,
  CanvasTexture,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  FogExp2,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  Scene,
  Shape,
  ShapeGeometry,
  DirectionalLight,
  SRGBColorSpace,
  Vector2,
  WebGLRenderer,
} from "three";

/**
 * The threshold scene: a route of architectural doorways receding toward light.
 *
 * The doorway profile follows the approved hero architecture (vertical jambs, a single rising
 * pitch, softened shoulders). It is scene geometry, not the Darb mark; the mark itself is only
 * ever rendered from the approved raster in `@darb/ui`.
 */

export type ThresholdDirection = "ltr" | "rtl";

export interface ThresholdOptions {
  canvas: HTMLCanvasElement;
  direction: ThresholdDirection;
  compact: boolean;
}

export interface ThresholdScene {
  /** Sizes the canvas and compiles shaders off the critical path before the first frame. */
  prepare(width: number, height: number): Promise<void>;
  setProgress(value: number): void;
  setPointer(x: number, y: number): void;
  resize(width: number, height: number): void;
  renderOnce(): void;
  dispose(): void;
}

const palette = {
  night: new Color("#051711"),
  forest: new Color("#0f3326"),
  gold: new Color("#daa64d"),
  light: new Color("#ffe7b8"),
};

const frameSpacing = 4.4;

type Point = readonly [number, number];

/** Traces a polyline with rounded vertices; floor contacts stay sharp. */
function roundedOutline(points: readonly Point[], radii: readonly number[]): Shape {
  const shape = new Shape();
  const count = points.length;

  points.forEach((point, index) => {
    const radius = radii[index] ?? 0;
    const previous = points[(index - 1 + count) % count] as Point;
    const next = points[(index + 1) % count] as Point;

    if (radius <= 0) {
      if (index === 0) shape.moveTo(point[0], point[1]);
      else shape.lineTo(point[0], point[1]);
      return;
    }

    const toPrevious = new Vector2(previous[0] - point[0], previous[1] - point[1]);
    const toNext = new Vector2(next[0] - point[0], next[1] - point[1]);
    const inset = Math.min(radius, toPrevious.length() / 2, toNext.length() / 2);
    const start = toPrevious.normalize().multiplyScalar(inset);
    const end = toNext.normalize().multiplyScalar(inset);

    if (index === 0) shape.moveTo(point[0] + start.x, point[1] + start.y);
    else shape.lineTo(point[0] + start.x, point[1] + start.y);
    shape.quadraticCurveTo(point[0], point[1], point[0] + end.x, point[1] + end.y);
  });

  shape.closePath();
  return shape;
}

const doorway = {
  jamb: 0.46,
  leftShoulder: 3.55,
  outerWidth: 3.1,
  peak: 4.7,
  rightShoulder: 4.45,
} as const;

function innerOpening(): { points: Point[]; radii: number[] } {
  const innerHalf = doorway.outerWidth / 2 - doorway.jamb;
  return {
    points: [
      [innerHalf, 0],
      [innerHalf, doorway.rightShoulder - doorway.jamb * 1.05],
      [innerHalf - 0.28, doorway.peak - doorway.jamb * 1.2],
      [-innerHalf, doorway.leftShoulder - doorway.jamb * 0.62],
      [-innerHalf, 0],
    ],
    radii: [0, 0.3, 0.3, 0.62, 0],
  };
}

/** A doorway frame drawn as one closed U-shaped outline (outer contour, then the opening). */
function doorwayShape(): Shape {
  const half = doorway.outerWidth / 2;
  const inner = innerOpening();
  const points: Point[] = [
    [-half, 0],
    [-half, doorway.leftShoulder],
    [half - 0.35, doorway.peak],
    [half, doorway.rightShoulder],
    [half, 0],
    ...inner.points,
  ];
  return roundedOutline(points, [0, 0.9, 0.42, 0.42, 0, ...inner.radii]);
}

/** The lit opening of the final doorway: light is seen only through the door. */
function openingShape(): Shape {
  const inner = innerOpening();
  return roundedOutline(inner.points, inner.radii);
}

function lightTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (context) {
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    );
    gradient.addColorStop(0, "rgba(255, 244, 214, 1)");
    gradient.addColorStop(0.28, "rgba(255, 223, 160, 0.55)");
    gradient.addColorStop(0.62, "rgba(218, 166, 77, 0.12)");
    gradient.addColorStop(1, "rgba(218, 166, 77, 0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** Floor light: a warm pool running toward the viewer along the route. */
function floorTexture(): CanvasTexture {
  const width = 128;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  if (context) {
    const across = context.createLinearGradient(0, 0, width, 0);
    across.addColorStop(0, "rgba(255, 214, 140, 0)");
    across.addColorStop(0.5, "rgba(255, 196, 110, 0.85)");
    across.addColorStop(1, "rgba(255, 214, 140, 0)");
    context.fillStyle = across;
    context.fillRect(0, 0, width, height);

    context.globalCompositeOperation = "destination-in";
    const along = context.createLinearGradient(0, 0, 0, height);
    along.addColorStop(0, "rgba(0, 0, 0, 1)");
    along.addColorStop(1, "rgba(0, 0, 0, 0.05)");
    context.fillStyle = along;
    context.fillRect(0, 0, width, height);
  }

  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createThresholdScene({
  canvas,
  direction,
  compact,
}: ThresholdOptions): ThresholdScene {
  const renderer = new WebGLRenderer({
    alpha: false,
    antialias: true,
    canvas,
    failIfMajorPerformanceCaveat: true,
    powerPreference: compact ? "low-power" : "high-performance",
  });
  renderer.setClearColor(palette.night);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  scene.background = palette.night;
  scene.fog = new FogExp2(palette.night.getHex(), compact ? 0.036 : 0.032);

  const camera = new PerspectiveCamera(compact ? 50 : 36, 1, 0.1, 120);
  const frameCount = compact ? 6 : 8;
  const corridorLength = frameCount * frameSpacing;

  scene.add(new AmbientLight(palette.forest, 0.9));

  const faceLight = new DirectionalLight(new Color("#a9cbb8"), 0.35);
  faceLight.position.set(3, 5, 12);
  scene.add(faceLight);

  const farLight = new PointLight(palette.light, 90, 0, 1.35);
  farLight.position.set(0.1, 2.6, -corridorLength - 1.2);
  scene.add(farLight);

  const nearFill = new PointLight(palette.gold, 6, 18, 1.6);
  nearFill.position.set(-2.2, 3.6, 3.5);
  scene.add(nearFill);

  const geometry = new ExtrudeGeometry(doorwayShape(), {
    bevelEnabled: true,
    bevelSegments: 2,
    bevelSize: 0.03,
    bevelThickness: 0.03,
    curveSegments: compact ? 10 : 18,
    depth: 0.62,
  });
  geometry.translate(0, 0, -0.31);

  const faceMaterial = new MeshStandardMaterial({
    color: palette.forest,
    metalness: 0.05,
    roughness: 0.82,
  });
  const revealMaterial = new MeshStandardMaterial({
    color: new Color("#c99a45"),
    emissive: palette.gold,
    emissiveIntensity: 0.08,
    metalness: 0.35,
    roughness: 0.38,
  });

  const frames = new Group();
  for (let index = 0; index < frameCount; index += 1) {
    const frame = new Mesh(geometry, [faceMaterial, revealMaterial]);
    frame.position.z = -index * frameSpacing;
    frames.add(frame);
  }
  scene.add(frames);

  const floorGeometry = new PlaneGeometry(160, corridorLength + 140);
  // Emissive night keeps the unlit floor at the page ground instead of tone-mapping to black.
  const floorMaterial = new MeshStandardMaterial({
    color: new Color("#0a241b"),
    emissive: palette.night,
    emissiveIntensity: 1,
    metalness: 0.1,
    roughness: 0.55,
    toneMapped: false,
  });
  const floor = new Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -corridorLength / 2 - 40;
  scene.add(floor);

  const poolTexture = floorTexture();
  const poolMaterial = new MeshBasicMaterial({
    blending: AdditiveBlending,
    depthWrite: false,
    map: poolTexture,
    opacity: 0.22,
    toneMapped: false,
    transparent: true,
  });
  const pool = new Mesh(new PlaneGeometry(2.4, corridorLength + 8), poolMaterial);
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(0, 0.01, -corridorLength / 2 + 4);
  scene.add(pool);

  const routeMaterial = new MeshBasicMaterial({ color: palette.gold, fog: true });
  const route = new Mesh(new PlaneGeometry(0.035, corridorLength + 30), routeMaterial);
  route.rotation.x = -Math.PI / 2;
  route.position.set(0, 0.02, -corridorLength / 2 + 15);
  scene.add(route);

  const glowTexture = lightTexture();
  const glowMaterial = new MeshBasicMaterial({
    blending: AdditiveBlending,
    depthWrite: false,
    fog: false,
    map: glowTexture,
    side: DoubleSide,
    transparent: true,
  });
  const glow = new Mesh(new PlaneGeometry(11, 11), glowMaterial);
  glow.position.set(0, 2.2, -corridorLength - 1.5);
  scene.add(glow);

  const horizonMaterial = new MeshBasicMaterial({
    color: new Color("#f3d59b"),
    fog: false,
    toneMapped: false,
  });
  const horizon = new Mesh(new ShapeGeometry(openingShape(), 16), horizonMaterial);
  horizon.position.set(0, 0, -(frameCount - 1) * frameSpacing - 0.36);
  scene.add(horizon);

  const state = {
    height: 1,
    pointer: new Vector2(),
    pointerTarget: new Vector2(),
    progress: 0,
    progressTarget: 0,
    width: 1,
  };

  /** Where the vanishing point sits across the stage; the route leans toward the reading end. */
  const restingAnchor = compact ? 0.5 : direction === "rtl" ? 0.33 : 0.67;

  function applyCamera() {
    const eased = 1 - Math.pow(1 - state.progress, 2);
    camera.position.set(
      state.pointer.x * 0.35,
      1.75 + state.pointer.y * 0.18 + eased * 0.1,
      (compact ? 15.5 : 12) - eased * (compact ? 19 : 15.5),
    );
    camera.lookAt(state.pointer.x * 0.2, 1.95, camera.position.z - 20);

    const anchorX = restingAnchor + (0.5 - restingAnchor) * eased;
    const anchorY = compact ? 0.4 : 0.5;
    const fullWidth = 2 * Math.max(anchorX, 1 - anchorX) * state.width;
    const fullHeight = 2 * Math.max(anchorY, 1 - anchorY) * state.height;
    camera.aspect = fullWidth / fullHeight;
    camera.setViewOffset(
      fullWidth,
      fullHeight,
      fullWidth / 2 - anchorX * state.width,
      fullHeight / 2 - anchorY * state.height,
      state.width,
      state.height,
    );
    camera.updateProjectionMatrix();

    renderer.toneMappingExposure = 1.05 + eased * 0.35;
    revealMaterial.emissiveIntensity = 0.06 + eased * 0.1;
  }

  function renderOnce() {
    applyCamera();
    renderer.render(scene, camera);
  }

  let frame = 0;
  function tick() {
    frame = 0;
    const settle = 0.12;
    state.progress += (state.progressTarget - state.progress) * settle;
    state.pointer.lerp(state.pointerTarget, 0.06);
    renderOnce();

    const moving =
      Math.abs(state.progressTarget - state.progress) > 0.0005 ||
      state.pointer.distanceTo(state.pointerTarget) > 0.0005;
    if (moving) frame = requestAnimationFrame(tick);
  }

  function schedule() {
    if (!frame) frame = requestAnimationFrame(tick);
  }

  function resize(width: number, height: number) {
    state.width = Math.max(1, width);
    state.height = Math.max(1, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, compact ? 1.5 : 1.75));
    renderer.setSize(state.width, state.height, false);
    renderOnce();
  }

  return {
    async prepare(width, height) {
      state.width = Math.max(1, width);
      state.height = Math.max(1, height);
      applyCamera();
      await renderer.compileAsync(scene, camera);
      resize(width, height);
    },
    setProgress(value) {
      state.progressTarget = Math.min(1, Math.max(0, value));
      schedule();
    },
    setPointer(x, y) {
      state.pointerTarget.set(x, y);
      schedule();
    },
    resize,
    renderOnce,
    dispose() {
      if (frame) cancelAnimationFrame(frame);
      geometry.dispose();
      floorGeometry.dispose();
      faceMaterial.dispose();
      revealMaterial.dispose();
      floorMaterial.dispose();
      poolMaterial.dispose();
      routeMaterial.dispose();
      glowMaterial.dispose();
      horizonMaterial.dispose();
      poolTexture.dispose();
      glowTexture.dispose();
      scene.traverse((object) => {
        if (object instanceof Mesh && object !== floor) object.geometry.dispose();
      });
      renderer.dispose();
    },
  };
}
