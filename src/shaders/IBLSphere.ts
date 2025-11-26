import * as THREE from 'three';

export interface IBLSphereUniforms {
  uCamPos: THREE.Vector3;
  uTime: number;
  uSmooth: number;
  uRadius: number;
  uNoise: number;
  uBgColor1: THREE.Color;
  uBgColor2: THREE.Color;
  uAxis: THREE.Vector3;
  uVignette: number;
  uBright: number;
}

export function createIBLSphereMaterial(
  initial?: Partial<IBLSphereUniforms>,
): THREE.RawShaderMaterial {
  const uniforms: { [key: string]: { value: any } } = {
    uCamPos: { value: initial?.uCamPos ?? new THREE.Vector3(0, 0, 0) },
    uTime: { value: initial?.uTime ?? 0 },
    uSmooth: { value: initial?.uSmooth ?? 0.15 },
    uRadius: { value: initial?.uRadius ?? 0.75 },
    uNoise: { value: initial?.uNoise ?? 0.08 },
    uBgColor1: { value: initial?.uBgColor1 ?? new THREE.Color(0x0f0c29) },
    uBgColor2: { value: initial?.uBgColor2 ?? new THREE.Color(0x4a6fa5) },
    uAxis: { value: initial?.uAxis ?? new THREE.Vector3(0, 0, 1) },
    uVignette: { value: initial?.uVignette ?? 0.85 },
    uBright: { value: initial?.uBright ?? 0.1 },
  };

  const vertexShader = `
precision highp float;
attribute vec3 position;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform vec3 uCamPos;
varying vec3 vDir;

void main() {
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vDir = normalize(wp.xyz - uCamPos);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;

  const fragmentShader = `
precision highp float;
varying vec3 vDir;
uniform float uTime;
uniform float uSmooth;
uniform float uRadius;
uniform float uNoise;
uniform vec3 uBgColor1;
uniform vec3 uBgColor2;
uniform vec3 uAxis;
uniform float uVignette;
uniform float uBright;

const float PI = 3.141592653589793;
const float RECIPROCAL_PI = 0.3183098861837907;
const float RECIPROCAL_PI2 = 0.15915494309189535;

float hash12(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 dir = normalize(vDir);
  float ang = acos(clamp(dot(dir, normalize(uAxis)), -1.0, 1.0));
  float dist = ang / PI;
  float ring = smoothstep(uRadius, uRadius - uSmooth, dist);
  float vig = smoothstep(uVignette, 1.0, dist);
  vec3 outgo = mix(uBgColor1, uBgColor2, ring);
  outgo += vec3(uBright * (1.0 - vig));
  float u = atan(dir.z, dir.x) * RECIPROCAL_PI2 + 0.5;
  float v = asin(clamp(dir.y, -1.0, 1.0)) * RECIPROCAL_PI + 0.5;
  float noise = hash12(vec2(u, v) * 3.152 + vec2(uTime * 0.2, uTime * 0.14));
  outgo += vec3((noise - 0.5) * uNoise * max(ring, 0.0));
  gl_FragColor = vec4(outgo, 1.0);
}`;

  return new THREE.RawShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    depthWrite: false,
    depthTest: false,
    side: THREE.BackSide,
  });
}
