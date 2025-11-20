import { LightState } from "@/types";
import { Color, RectAreaLight, Scene, Vector3 } from "three";

export class LightManager {
  constructor(scene: Scene, options: LightState[]) {
    options.forEach((lightState) => {
      const { enabled = true, color = new Color(0xffffff), intensity = 1.0, position = new Vector3(0, 0, 0) } = lightState;
      const light = new RectAreaLight(color, intensity);
      light.position.copy(position);
      light.visible = enabled;
      scene.add(light);
    });
  }
}
