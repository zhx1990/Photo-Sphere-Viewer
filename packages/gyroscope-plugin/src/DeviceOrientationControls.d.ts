import { Object3D } from 'three';

export class DeviceOrientationControls {
    deviceOrientation: any;
    screenOrientation: number;
    alphaOffset: number;

    constructor(public object: Object3D);

    connect();

    disconnect();

    update();
}
