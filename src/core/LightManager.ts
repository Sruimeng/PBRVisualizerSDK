import { LightState } from "@/types";
import { Color, DirectionalLight, Mesh, PointLight, RectAreaLight, Scene, SpotLight, Vector3 } from "three";
const DEFAULT_LIGHT_STATE: LightState[] = [
  // 主光 (Key)
  {
    enabled: true,
    type: 'rectAreaLight',
    color: new Color(0xffffff),
    intensity: 3.0,
    position: new Vector3(3, 4, 3),
    size: [4, 4],
  },
  // 轮廓光 (Rim)
  {
    enabled: true,
    type: 'rectAreaLight',
    color: new Color(0x4c8bf5),
    intensity: 5.0,
    position: new Vector3(-3, 2, -4),
    size: [3, 3],
  },
  // 补光 (Fill)
  {
    enabled: true,
    type: 'rectAreaLight',
    color: new Color(0xffeedd),
    intensity: 1.5,
    position: new Vector3(-4, 0, 4),
    size: [5, 5],
  },
];
export class LightManager {
  constructor(scene: Scene, model: Mesh,options?: LightState[]) {
    const lightOptions = options || DEFAULT_LIGHT_STATE;
    lightOptions.forEach((lightState) => {
      const modelPosition = model.position;
      const { enabled = true, type = 'rectAreaLight', color = new Color(0xffffff), intensity = 1.0, position = new Vector3(0, 0, 0), size = [1, 1] } = lightState;
      let light: RectAreaLight | PointLight | SpotLight | DirectionalLight | null = null;
      switch (type) {
        case 'rectAreaLight':
          light = new RectAreaLight(color, intensity, size[0], size[1]);
          break;
        case 'pointLight':
          light = new PointLight(color, intensity);
          break;
        case 'spotLight':
          light = new SpotLight(color, intensity);
          break;
        case 'directionalLight':
          light = new DirectionalLight(color, intensity);
          break;
        default:
          break;
      }
      if (light) {
        light.position.copy(position.add(modelPosition));
        light.visible = enabled;
        scene.add(light);
      }
    });
  }
}
