import {
    BufferGeometry,
    CanvasTexture,
    LineSegments,
    Material,
    Mesh,
    MeshBasicMaterial,
    Object3D,
    SphereGeometry,
    WireframeGeometry,
} from 'three';

/**
 * Generates an material for errored tiles
 * @internal
 */
export function buildErrorMaterial(width: number, height: number): MeshBasicMaterial {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = `${canvas.width / 5}px serif`;
    ctx.fillStyle = '#a22';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚠', canvas.width / 2, canvas.height / 2);

    const texture = new CanvasTexture(canvas);
    return new MeshBasicMaterial({ map: texture });
}

/**
 * Creates a wireframe geometry, for debug
 * @internal
 */
export function createWireFrame(geometry: BufferGeometry): Object3D {
    const wireframe = new WireframeGeometry(geometry);
    const line = new LineSegments<WireframeGeometry, Material>(wireframe);
    line.material.depthTest = false;
    line.material.opacity = 0.25;
    line.material.transparent = true;
    return line;
}

/**
 * Creates a small red sphere, for debug
 * @internal
 */
export function createDot(x: number, y: number, z: number) {
    const geom = new SphereGeometry(0.1);
    const material = new MeshBasicMaterial({ color: 0xff0000 });
    const mesh = new Mesh(geom, material);
    mesh.position.set(x, y, z);
    return mesh;
}
