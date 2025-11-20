import * as THREE from 'three';

export class ShadowSystem {
  private shadowTexture: THREE.Texture;
  private shadowMaterial: THREE.MeshBasicMaterial;
  private shadowPlane: THREE.Mesh;
  private shadowBaseScale: number = 1;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.shadowTexture = this.createSoftShadowTexture();
    this.shadowMaterial = new THREE.MeshBasicMaterial({
      map: this.shadowTexture,
      transparent: true,
      depthWrite: false,
      color: 0x000000,
      opacity: 0.6
    });
    this.shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), this.shadowMaterial);
    this.shadowPlane.rotation.x = -Math.PI / 2;
    this.shadowPlane.position.y = 0.01;
    
    // Initially not added, will be added when model is loaded/updated
    this.scene.add(this.shadowPlane);
  }

  public update(model: THREE.Object3D, modelBaseY: number): void {
    if (!model) return;

    // 1. Follow X/Z
    this.shadowPlane.position.x = model.position.x;
    this.shadowPlane.position.z = model.position.z;

    // 2. Height based opacity and scale
    const distToFloor = model.position.y - modelBaseY;
    
    // Higher -> Lower opacity (0.6 -> 0)
    const opacity = THREE.MathUtils.clamp(0.6 - distToFloor * 0.8, 0, 0.8);
    this.shadowMaterial.opacity = opacity;

    // Higher -> Larger scale
    const scaleFactor = 1 + distToFloor * 1.5;
    this.shadowPlane.scale.setScalar(this.shadowBaseScale * scaleFactor);
  }

  public setBaseScale(scale: number): void {
    this.shadowBaseScale = scale;
    this.shadowPlane.scale.setScalar(scale);
  }

  public setVisible(visible: boolean): void {
    this.shadowPlane.visible = visible;
  }

  public dispose(): void {
    this.shadowTexture.dispose();
    this.shadowMaterial.dispose();
    this.scene.remove(this.shadowPlane);
    (this.shadowPlane.geometry as THREE.BufferGeometry).dispose();
  }

  private createSoftShadowTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
        throw new Error('Failed to get 2d context for shadow texture');
    }

    const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0.0, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(0.4, 'rgba(0, 0, 0, 0.3)');
    gradient.addColorStop(0.8, 'rgba(0, 0, 0, 0.05)');
    gradient.addColorStop(1.0, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
}
