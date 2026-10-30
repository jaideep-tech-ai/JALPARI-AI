'use client';

import * as React from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import { useJourney } from '@/lib/scroll-journey';

/* ------------------------------------------------------------------ */
/* Shaders                                                             */
/* ------------------------------------------------------------------ */

const EARTH_VERT = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;
  void main() {
    vUv = uv;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vPosW = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const EARTH_FRAG = /* glsl */ `
  uniform sampler2D dayMap;
  uniform sampler2D nightMap;
  uniform sampler2D specMap;
  uniform sampler2D normalMap;
  uniform vec3 sunDirection;   // world-space, normalised (points TO the sun)
  uniform float uLights;       // night-lights boost
  varying vec2 vUv;
  varying vec3 vNormalW;
  varying vec3 vPosW;

  // Tangent-space normal mapping via the derivative-constructed cotangent frame
  // (no precomputed tangents needed — works on any sphere UV layout)
  vec3 perturbNormal(vec3 pos, vec3 n, vec2 uv, sampler2D normalMap) {
    vec3 dp1 = dFdx(pos);
    vec3 dp2 = dFdy(pos);
    vec2 duv1 = dFdx(uv);
    vec2 duv2 = dFdy(uv);
    vec3 dp2perp = cross(dp2, n);
    vec3 dp1perp = cross(n, dp1);
    vec3 t = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 b = dp2perp * duv1.y + dp1perp * duv2.y;
    float invmax = inversesqrt(max(dot(t, t), dot(b, b)));
    mat3 TBN = mat3(t * invmax, b * invmax, n);
    vec3 nm = texture2D(normalMap, uv).xyz * 2.0 - 1.0;
    return normalize(TBN * nm);
  }

  void main() {
    vec3 V = normalize(cameraPosition - vPosW);
    vec3 N0 = normalize(vNormalW);
    vec3 N = perturbNormal(vPosW, N0, vUv, normalMap);

    float cosSun = dot(N, sunDirection);
    float cosSun0 = dot(N0, sunDirection);
    float dayFactor = smoothstep(-0.18, 0.22, cosSun0);

    // Day side — lambert with a hint of ambient so the dark limb stays readable
    vec3 dayCol = texture2D(dayMap, vUv).rgb;
    float diff = max(cosSun, 0.0);
    vec3 lit = dayCol * (0.10 + 1.18 * diff);

    // Night side — city lights fading in past the terminator
    vec3 nightCol = texture2D(nightMap, vUv).rgb;
    float nightMix = pow(1.0 - dayFactor, 1.55);
    vec3 lights = nightCol * nightMix * uLights * vec3(1.0, 0.86, 0.62);

    // Sun glint on oceans
    float waterMask = texture2D(specMap, vUv).r;
    vec3 H = normalize(sunDirection + V);
    float spec = pow(max(dot(N, H), 0.0), 46.0) * waterMask * dayFactor;
    vec3 specCol = vec3(0.38, 0.58, 0.92) * spec * 1.25;

    // Atmospheric rim
    float rim = pow(1.0 - max(dot(V, N0), 0.0), 2.9);
    vec3 rimCol = mix(vec3(0.10, 0.32, 0.85), vec3(0.0, 0.94, 1.0), rim) * rim * 0.9;

    vec3 color = lit + lights + specCol + rimCol;
    gl_FragColor = vec4(color, 1.0);
  }
`;

const ATMO_VERT = /* glsl */ `
  varying vec3 vNormalV;
  varying vec3 vNormalW;
  void main() {
    vNormalV = normalize(normalMatrix * normal);
    vNormalW = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const ATMO_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform vec3 sunDirection;
  varying vec3 vNormalV;
  varying vec3 vNormalW;
  void main() {
    // Classic back-side fresnel halo in view space
    float rim = pow(clamp(0.66 - dot(vNormalV, vec3(0.0, 0.0, 1.0)), 0.0, 1.0), 3.4);
    // Brighter on the sunlit limb
    float sun = 0.6 + 0.4 * max(dot(normalize(vNormalW), sunDirection), 0.0);
    gl_FragColor = vec4(uColor, 1.0) * rim * uIntensity * sun;
  }
`;

const STAR_VERT = /* glsl */ `
  attribute float aScale;
  attribute float aPhase;
  attribute float aTint;
  uniform float uTime;
  uniform float uReduced;
  varying float vA;
  varying float vTint;
  void main() {
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    float tw = sin(uTime * 1.35 + aPhase * 6.2831);
    gl_PointSize = aScale * (240.0 / -mv.z) * (1.0 + (uReduced < 0.5 ? 0.28 * tw : 0.0));
    vA = 0.5 + 0.5 * tw;
    vTint = aTint;
    gl_Position = projectionMatrix * mv;
  }
`;

const STAR_FRAG = /* glsl */ `
  varying float vA;
  varying float vTint;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.08, d) * (0.35 + 0.65 * vA);
    vec3 warm = vec3(1.0, 0.96, 0.9);
    vec3 cool = vec3(0.62, 0.82, 1.0);
    vec3 cyan = vec3(0.35, 0.95, 1.0);
    vec3 col = vTint < 0.82 ? mix(warm, cool, vTint / 0.82) : cyan;
    gl_FragColor = vec4(col, alpha);
  }
`;

/* ------------------------------------------------------------------ */
/* Textures                                                            */
/* ------------------------------------------------------------------ */

function useEarthTextures() {
  const [day, night, spec, normal] = useTexture([
    '/textures/earth/earth_atmos_2048.jpg',
    '/textures/earth/earth_lights_2048.png',
    '/textures/earth/earth_specular_2048.jpg',
    '/textures/earth/earth_normal_2048.jpg',
  ]);
  React.useEffect(() => {
    /* eslint-disable react-hooks/immutability -- three.js textures are mutable by design (R3F standard) */
    day.colorSpace = THREE.SRGBColorSpace;
    night.colorSpace = THREE.SRGBColorSpace;
    day.anisotropy = night.anisotropy = spec.anisotropy = normal.anisotropy = 4;
    [day, night, spec, normal].forEach((t) => (t.wrapS = THREE.ClampToEdgeWrapping));
    /* eslint-enable react-hooks/immutability */
  }, [day, night, spec, normal]);
  return { day, night, spec, normal };
}

/* ------------------------------------------------------------------ */
/* Earth + atmosphere                                                  */
/* ------------------------------------------------------------------ */

// Rotation that brings ~lon 78°E (central India) to face the camera (+Z).
const INDIA_FACING_Y = -1.38;
const DAY_SUN = new THREE.Vector3(-0.7, 0.28, 0.66).normalize();
const NIGHT_SUN = new THREE.Vector3(0.45, 0.18, -0.85).normalize();

function Earth() {
  const { day, night, spec, normal } = useEarthTextures();
  const groupRef = React.useRef<THREE.Group>(null);
  const meshRef = React.useRef<THREE.Mesh>(null);
  const sunRef = React.useRef(new THREE.Vector3(-0.7, 0.28, 0.66).normalize());
  const lightsRef = React.useRef(1);

  const uniforms = React.useMemo(
    () => ({
      dayMap: { value: day },
      nightMap: { value: night },
      specMap: { value: spec },
      normalMap: { value: normal },
      sunDirection: { value: DAY_SUN.clone() },
      uLights: { value: 1 },
    }),
    [day, night, spec, normal],
  );

  useFrame((state, delta) => {
    const { progress, reduced, pointer } = useJourney.getState();
    const g = groupRef.current;
    const m = meshRef.current;
    if (!g || !m) return;

    const mobile = state.size.width < 768;
    // Phase targets -------------------------------------------------
    // A (0 → 0.35): hero, earth right, day side lit
    // B (0.35 → 0.65): zoom in, India rotates to the night side, city lights glow
    // C (0.65 → 1): earth slides left + shrinks, data panel takes over
    const zA = mobile ? 0.95 : 1.95;      // x offset
    const yA = mobile ? 1.05 : -0.05;     // y offset
    const sA = mobile ? 0.78 : 1.12;      // scale

    const pB = THREE.MathUtils.smoothstep(progress, 0.33, 0.62);
    const pC = THREE.MathUtils.smoothstep(progress, 0.62, 0.92);

    const targetX = THREE.MathUtils.lerp(zA, mobile ? -0.2 : -2.25, pC);
    const targetY = mobile ? THREE.MathUtils.lerp(yA, 1.35, pC) : THREE.MathUtils.lerp(yA, 0.35, pC);
    const targetScale = sA * THREE.MathUtils.lerp(1, mobile ? 0.55 : 0.58, pC) *
      (1 + pB * (mobile ? 0.08 : 0.1)); // slight zoom-in during phase B

    const camZ = THREE.MathUtils.lerp(8, 6.4, pB);

    // Scroll-facing rotation: ease toward India-on-night-side during B
    const baseY = 0.35;
    const targetRotY = baseY + pB * (INDIA_FACING_Y + Math.PI * 0.9 - baseY) + pC * 0.5;
    const targetRotX = 0.12 + pointer.y * 0.1 * (reduced ? 0 : 1);

    // Idle spin (inner mesh) — frozen under reduced motion
    if (!reduced) m.rotation.y += delta * 0.045;

    // Damp toward targets
    const k = 1 - Math.pow(0.0018, delta); // frame-rate independent damping
    g.position.x += (targetX - g.position.x) * k;
    g.position.y += (targetY - g.position.y) * k;
    const s = THREE.MathUtils.lerp(g.scale.x, targetScale, k);
    g.scale.setScalar(s);
    g.rotation.y += (targetRotY - g.rotation.y) * k;
    g.rotation.x += (targetRotX - g.rotation.x) * k;

    // Sun choreography: front-left → behind (night side) during phase B
    sunRef.current.copy(DAY_SUN).lerp(NIGHT_SUN, pB).normalize();
    uniforms.sunDirection.value.copy(sunRef.current);

    // City lights boost during the zoom
    lightsRef.current = THREE.MathUtils.lerp(1, 1.65, pB);
    // eslint-disable-next-line react-hooks/immutability -- per-frame uniform update is the R3F standard pattern
    uniforms.uLights.value = lightsRef.current;

    // Gentle camera parallax with the pointer
    const cam = state.camera;
    const px = pointer.x * 0.28 * (reduced ? 0 : 1);
    const py = pointer.y * 0.16 * (reduced ? 0 : 1);
    cam.position.x += (px - cam.position.x) * k * 0.6;
    cam.position.y += (py - cam.position.y) * k * 0.6;
    cam.position.z += (camZ - cam.position.z) * k;
    cam.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef} position={[1.95, -0.05, 0]} rotation={[0.12, 0.35, 0]}>
      {/* Fresnel halo rides with every Earth transform */}
      <Atmosphere sunRef={sunRef} />
      {/* 23.5° axial tilt */}
      <group rotation={[0, 0, THREE.MathUtils.degToRad(23.5)]}>
        <mesh ref={meshRef}>
          <sphereGeometry args={[2, 96, 96]} />
          <shaderMaterial
            vertexShader={EARTH_VERT}
            fragmentShader={EARTH_FRAG}
            uniforms={uniforms}
          />
        </mesh>
      </group>
    </group>
  );
}

function Atmosphere({ sunRef }: { sunRef: React.MutableRefObject<THREE.Vector3> }) {
  const uniforms = React.useMemo(
    () => ({
      uColor: { value: new THREE.Color('#3d8bff') },
      uIntensity: { value: 1.35 },
      sunDirection: { value: DAY_SUN.clone() },
    }),
    [],
  );
  useFrame(() => {
    // Keep the halo's sun bias in sync with the Earth shader
    uniforms.sunDirection.value.copy(sunRef.current);
  });
  return (
    <mesh scale={[1.18, 1.18, 1.18]}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        vertexShader={ATMO_VERT}
        fragmentShader={ATMO_FRAG}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------ */
/* Stars                                                               */
/* ------------------------------------------------------------------ */

function Stars() {
  const ref = React.useRef<THREE.Points>(null);
  const { positions, scales, phases, tints } = React.useMemo(() => {
    const COUNT = 1500;
    const positions = new Float32Array(COUNT * 3);
    const scales = new Float32Array(COUNT);
    const phases = new Float32Array(COUNT);
    const tints = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      // Random direction on a shell
      const u = Math.random() * 2 - 1;
      const theta = Math.random() * Math.PI * 2;
      const r = 42 + Math.random() * 48;
      const s = Math.sqrt(1 - u * u);
      positions[i * 3] = r * s * Math.cos(theta);
      positions[i * 3 + 1] = r * u;
      positions[i * 3 + 2] = r * s * Math.sin(theta);
      scales[i] = 0.5 + Math.random() * 1.5;
      phases[i] = Math.random();
      tints[i] = Math.random();
    }
    return { positions, scales, phases, tints };
  }, []);

  const uniforms = React.useMemo(
    () => ({ uTime: { value: 0 }, uReduced: { value: 0 } }),
    [],
  );

  useFrame((_, delta) => {
    const { reduced } = useJourney.getState();
    // eslint-disable-next-line react-hooks/immutability -- per-frame uniform update is the R3F standard pattern
    uniforms.uReduced.value = reduced ? 1 : 0;
    if (!reduced) {
      uniforms.uTime.value += delta;
    }
    if (ref.current && !reduced) ref.current.rotation.y += delta * 0.004;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aScale" args={[scales, 1]} />
        <bufferAttribute attach="attributes-aPhase" args={[phases, 1]} />
        <bufferAttribute attach="attributes-aTint" args={[tints, 1]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={STAR_VERT}
        fragmentShader={STAR_FRAG}
        uniforms={uniforms}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/* ------------------------------------------------------------------ */
/* Canvas host                                                         */
/* ------------------------------------------------------------------ */

function SceneContents() {
  return (
    <>
      <ambientLight intensity={0.22} color={'#020205'} />
      <Earth />
      <Stars />
    </>
  );
}

export function EarthScene() {
  const setReduced = useJourney((s) => s.setReduced);
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [setReduced]);

  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 40, position: [0, 0, 8], near: 0.1, far: 220 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
      }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <React.Suspense fallback={null}>
        <SceneContents />
      </React.Suspense>
    </Canvas>
  );
}
