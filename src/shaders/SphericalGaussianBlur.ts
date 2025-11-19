import * as THREE from 'three';

export function roughnessToMip(roughness: number): number {
  if (roughness >= 0.8) return -2.0 * Math.log2(1.16 * roughness);
  if (roughness >= 0.4) return (0.8 - roughness) * (3.0 - 1.0) / (0.8 - 0.4) + 1.0;
  return (0.4 - roughness) * (1.0 - 0.0) / (0.4 - 0.0) + 0.0;
}

export function getSamplesForRoughness(roughness: number): number {
  if (roughness < 0.2) return 4;
  if (roughness < 0.5) return 8;
  if (roughness < 0.8) return 12;
  return 16;
}

export function createSGBMaterial(envMap: THREE.Texture, options: {
  samples: number;
  latitudinal: boolean;
  dTheta: number;
  mipInt: number;
  poleAxis: THREE.Vector3;
}): THREE.RawShaderMaterial {
  const n = 20;
  const weights = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const sigma = 0.5;
    const t = i / n;
    weights[i] = Math.exp(-0.5 * Math.pow(t / sigma, 2));
  }
  const vertexShader = `
precision highp float;
attribute vec3 position;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
varying vec3 vDir;
void main(){
  vDir = normalize(position);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;
  const fragmentShader = `
precision highp float;
varying vec3 vDir;
uniform sampler2D envMap;
uniform int samples;
uniform float weights[20];
uniform bool latitudinal;
uniform float dTheta;
uniform float mipInt;
uniform vec3 poleAxis;
const float PI = 3.141592653589793;
const float RECIPROCAL_PI = 0.3183098861837907;
const float RECIPROCAL_PI2 = 0.15915494309189535;
vec2 equirectUv(vec3 dir){
  vec3 d = normalize(dir);
  float u = atan(d.z, d.x) * RECIPROCAL_PI2 + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) * RECIPROCAL_PI + 0.5;
  return vec2(u,v);
}
vec3 rotateAroundAxis(vec3 v, vec3 axis, float theta){
  float c = cos(theta);
  float s = sin(theta);
  return v * c + cross(axis, v) * s + axis * dot(axis, v) * (1.0 - c);
}
void main(){
  vec3 axis = latitudinal ? normalize(poleAxis) : normalize(cross(poleAxis, vDir));
  vec3 color = vec3(0.0);
  color += weights[0] * texture2D(envMap, equirectUv(vDir)).rgb;
  for(int i=1;i<20;i++){
    if(i>=samples) break;
    float theta = dTheta * float(i);
    vec3 d1 = rotateAroundAxis(vDir, axis, theta);
    vec3 d2 = rotateAroundAxis(vDir, axis, -theta);
    color += weights[i] * texture2D(envMap, equirectUv(d1)).rgb;
    color += weights[i] * texture2D(envMap, equirectUv(d2)).rgb;
  }
  gl_FragColor = vec4(color, 1.0);
}`;
  return new THREE.RawShaderMaterial({
    uniforms: {
      envMap: { value: envMap },
      samples: { value: options.samples },
      weights: { value: Array.from(weights) },
      latitudinal: { value: options.latitudinal },
      dTheta: { value: options.dTheta },
      mipInt: { value: options.mipInt },
      poleAxis: { value: options.poleAxis.clone() }
    },
    vertexShader,
    fragmentShader,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide
  });
}

