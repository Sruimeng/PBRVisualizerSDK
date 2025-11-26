import * as THREE from 'three';

export interface NoiseSphereUniforms {
  uResolution: THREE.Vector2;
  uTime: number;
  uSmooth: number;
  uRadius: number;
  uNoise: number;
  uBgColor1: THREE.Color;
  uBgColor2: THREE.Color;
}

export function createNoiseSphereMaterial(
  initial?: Partial<NoiseSphereUniforms>,
): THREE.RawShaderMaterial {
  const uniforms = {
    uResolution: { value: initial?.uResolution ?? new THREE.Vector2(1024, 1024) },
    uTime: { value: initial?.uTime ?? 0 },
    uSmooth: { value: initial?.uSmooth ?? 0.1 },
    uRadius: { value: initial?.uRadius ?? 0.75 },
    uNoise: { value: initial?.uNoise ?? 0.15 },
    uBgColor1: { value: initial?.uBgColor1 ?? new THREE.Color(0x0a0e2a) },
    uBgColor2: { value: initial?.uBgColor2 ?? new THREE.Color(0x4a6fa5) },
  };

  const vertexShader = `
precision highp float;
attribute vec3 position;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
void main(){
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

  const fragmentShader = `
precision highp float;
uniform vec2 uResolution;
uniform float uTime;
uniform float uSmooth;
uniform float uRadius;
uniform float uNoise;
uniform vec3 uBgColor1;
uniform vec3 uBgColor2;

float hash12(vec2 p){
  return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
}

void main(){
  vec2 aspect = uResolution.xy / uResolution.yy;
  vec2 vUv = gl_FragCoord.xy / uResolution.xy;
  vec2 sphereUv = (vUv * 2.0 - 1.0) * aspect;
  float dist = length(sphereUv);
  float sphere = smoothstep(uRadius, uRadius - uSmooth, dist);
  vec3 color = mix(uBgColor1, uBgColor2, sphere);
  float timeOffset = uTime * 0.2;
  float n = hash12(vUv * 3.14159 + vec2(timeOffset, timeOffset * 0.7));
  color += (n - 0.5) * uNoise * max(sphere, 0.0);
  float pulse = sin(uTime * 2.0) * 0.05;
  float pulseSphere = smoothstep(uRadius + pulse, uRadius + pulse - uSmooth, dist);
  color = mix(color, uBgColor2 * 1.2, pulseSphere * 0.3);
  gl_FragColor = vec4(color, 1.0);
}`;

  return new THREE.RawShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  });
}
