import { Camera, Object3D, Renderer } from 'three';

export class StereoEffect {
    domElement: HTMLCanvasElement;

    render(scene: Object3D, camera: Camera): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;

    constructor(renderer: Renderer);
}
