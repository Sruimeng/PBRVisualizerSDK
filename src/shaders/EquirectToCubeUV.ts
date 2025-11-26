import * as THREE from 'three';

export function createEquirectToCubeMaterial(
  equirectTexture: THREE.Texture,
): THREE.RawShaderMaterial {
  const vertexShader = `
precision highp float;
attribute vec3 position;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform vec3 uCamPos;
varying vec3 vDir;
void main(){
  vec4 wp = modelMatrix * vec4(position,1.0);
  vDir = normalize(wp.xyz - uCamPos);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
}`;

  const fragmentShader = `
precision highp float;
varying vec3 vDir;
uniform sampler2D envMap;
const float PI = 3.141592653589793;
const float RECIPROCAL_PI = 0.3183098861837907;
const float RECIPROCAL_PI2 = 0.15915494309189535;
vec2 equirectUv(vec3 dir){
  vec3 d = normalize(dir);
  float u = atan(d.z, d.x) * RECIPROCAL_PI2 + 0.5;
  float v = asin(clamp(d.y, -1.0, 1.0)) * RECIPROCAL_PI + 0.5;
  return vec2(u,v);
}
void main(){
  vec2 uv = equirectUv(vDir);
  gl_FragColor = vec4(texture2D(envMap, uv).rgb, 1.0);
}`;

  return new THREE.RawShaderMaterial({
    uniforms: {
      uCamPos: { value: new THREE.Vector3() },
      envMap: { value: equirectTexture },
    },
    vertexShader,
    fragmentShader,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
  });
}
