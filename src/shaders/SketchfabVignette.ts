import * as THREE from 'three';

/**
 * Sketchfab风格的暗角着色器
 * 实现以模型为中心的径向渐变暗角效果
 */
export interface SketchfabVignetteUniforms {
  uTime: number;
  uCenter: THREE.Vector2; // 暗角中心位置（屏幕空间）
  uRadius: number; // 暗角半径
  uSoftness: number; // 边缘柔和度
  uStrength: number; // 暗角强度
  uColor: THREE.Color; // 暗角颜色
}

/**
 * 创建Sketchfab风格暗角材质
 */
export function createSketchfabVignetteMaterial(
  uniforms: Partial<SketchfabVignetteUniforms> = {},
): THREE.ShaderMaterial {
  const defaultUniforms: SketchfabVignetteUniforms = {
    uTime: 0,
    uCenter: new THREE.Vector2(0.5, 0.5),
    uRadius: 0.8,
    uSoftness: 0.4,
    uStrength: 0.8,
    uColor: new THREE.Color(0x000000),
    ...uniforms,
  };

  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: defaultUniforms.uTime },
      uCenter: { value: defaultUniforms.uCenter },
      uRadius: { value: defaultUniforms.uRadius },
      uSoftness: { value: defaultUniforms.uSoftness },
      uStrength: { value: defaultUniforms.uStrength },
      uColor: { value: defaultUniforms.uColor },
    },
    vertexShader: `
            varying vec2 vUv;

            void main() {
                vUv = uv;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
    fragmentShader: `
            uniform float uTime;
            uniform vec2 uCenter;
            uniform float uRadius;
            uniform float uSoftness;
            uniform float uStrength;
            uniform vec3 uColor;

            varying vec2 vUv;

            void main() {
                // 计算到中心点的距离
                vec2 center = uCenter;
                float dist = distance(vUv, center);

                // 创建径向渐变暗角效果
                // 计算到中心的相对距离
                dist = length(vUv - uCenter);

                // 使用平滑的径向渐变
                float vignette = 1.0 - smoothstep(
                    uRadius * 0.5,
                    uRadius,
                    dist
                );

                // 应用强度
                vignette = 1.0 - (1.0 - vignette) * uStrength;

                // 输出暗角叠加颜色
                gl_FragColor = vec4(uColor * (1.0 - vignette), vignette);
            }
        `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.NormalBlending,
  });
}

/**
 * 为模型创建基于包围盒的暗角背景
 */
export function createModelVignette(
  boundingBox: THREE.Box3,
  _camera: THREE.Camera,
  uniforms?: Partial<SketchfabVignetteUniforms>,
): THREE.Mesh {
  // 计算包围盒的中心和大小
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());

  // 计算适合的暗角球体大小（包围盒大小的2倍）
  const radius = Math.max(size.x, size.y, size.z) * 2;

  // 创建球体几何体
  const sphereGeometry = new THREE.SphereGeometry(radius, 64, 64);

  // 创建暗角材质
  const material = createSketchfabVignetteMaterial(uniforms);

  // 创建网格
  const vignetteMesh = new THREE.Mesh(sphereGeometry, material);

  // 设置位置到模型中心
  vignetteMesh.position.copy(center);

  // 确保在模型内部渲染
  vignetteMesh.scale.set(-1, 1, 1); // 翻转X轴，让球体内部可见

  // 设置渲染属性
  vignetteMesh.renderOrder = -1000;
  vignetteMesh.frustumCulled = false;
  vignetteMesh.castShadow = false;
  vignetteMesh.receiveShadow = false;

  return vignetteMesh;
}

/**
 * 更新暗角中心位置（屏幕空间）
 */
export function updateVignetteCenter(
  mesh: THREE.Mesh,
  modelPosition: THREE.Vector3,
  camera: THREE.Camera,
  _width: number,
  _height: number,
): void {
  // 将模型位置转换为屏幕坐标
  const screenPosition = modelPosition.clone();
  screenPosition.project(camera);

  // 转换为UV坐标 (0-1)
  const uvX = (screenPosition.x + 1) * 0.5;
  const uvY = (screenPosition.y + 1) * 0.5;

  // 更新着色器uniform
  const material = mesh.material as THREE.ShaderMaterial;
  if (material.uniforms.uCenter) {
    material.uniforms.uCenter.value.set(uvX, uvY);
  }
}
