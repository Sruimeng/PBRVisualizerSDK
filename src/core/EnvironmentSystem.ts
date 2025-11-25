import { EnvironmentConfig } from "@/types";
import { EquirectangularReflectionMapping, Scene } from "three";
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

export class EnvironmentSystem {

  constructor(private scene: Scene,private environment: EnvironmentConfig){
    this.initialize();
  }

  async initialize(){
    const { url, intensity = 1.0 } = this.environment;
    const scene = this.scene
    new HDRLoader()
    .load(url, (texture)=> {
        texture.mapping = EquirectangularReflectionMapping;
        scene.environment = texture;
        scene.environmentIntensity = intensity;
    });
  }
}
