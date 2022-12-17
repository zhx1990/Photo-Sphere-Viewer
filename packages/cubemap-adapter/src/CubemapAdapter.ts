import type { TextureData, Viewer } from '@photo-sphere-viewer/core';
import { AbstractAdapter, CONSTANTS, PSVError, SYSTEM, utils } from '@photo-sphere-viewer/core';
import { BoxGeometry, Mesh, ShaderMaterial, Texture } from 'three';
import { CubemapAdapterConfig, CubemapPanorama } from './model';

type CubemapMesh = Mesh<BoxGeometry, ShaderMaterial[]>;
type CubemapTexture = TextureData<Texture[]>;

const getConfig = utils.getConfigParser<CubemapAdapterConfig>({
    flipTopBottom: false,
    blur: false,
});

/**
 * Adapter for cubemaps
 */
export class CubemapAdapter extends AbstractAdapter<CubemapPanorama, Texture[]> {
    // PSV faces order is left, front, right, back, top, bottom
    // 3JS faces order is left, right, top, bottom, back, front
    static readonly CUBE_ARRAY = [0, 2, 4, 5, 3, 1];
    static readonly CUBE_HASHMAP = ['left', 'right', 'top', 'bottom', 'back', 'front'];

    static override readonly id = 'cubemap';
    static override readonly supportsDownload = false;
    static override readonly supportsOverlay = true;

    private readonly config: CubemapAdapterConfig;

    constructor(viewer: Viewer, config: CubemapAdapterConfig) {
        super(viewer);

        this.config = getConfig(config);
    }

    override supportsTransition() {
        return true;
    }

    override supportsPreload() {
        return true;
    }

    loadTexture(panorama: CubemapPanorama): Promise<CubemapTexture> {
        const cleanPanorama = [];

        if (Array.isArray(panorama)) {
            if (panorama.length !== 6) {
                return Promise.reject(new PSVError('A cubemap array must contain exactly 6 images.'));
            }

            // reorder images
            for (let i = 0; i < 6; i++) {
                cleanPanorama[i] = panorama[CubemapAdapter.CUBE_ARRAY[i]];
            }
        } else if (typeof panorama === 'object') {
            if (!CubemapAdapter.CUBE_HASHMAP.every((side) => !!(panorama as any)[side])) {
                return Promise.reject(
                    new PSVError('A cubemap object must contain exactly left, front, right, back, top, bottom images.')
                );
            }

            // transform into array
            CubemapAdapter.CUBE_HASHMAP.forEach((side, i) => {
                cleanPanorama[i] = (panorama as any)[side];
            });
        } else {
            return Promise.reject(new PSVError('Invalid cubemap panorama, are you using the right adapter?'));
        }

        if (this.viewer.config.fisheye) {
            utils.logWarn('fisheye effect with cubemap texture can generate distorsion');
        }

        const promises: Promise<Texture>[] = [];
        const progress = [0, 0, 0, 0, 0, 0];

        for (let i = 0; i < 6; i++) {
            promises.push(
                this.viewer.textureLoader
                    .loadImage(cleanPanorama[i], (p) => {
                        progress[i] = p;
                        this.viewer.loader.setProgress(utils.sum(progress) / 6);
                    })
                    .then((img) => this.createCubemapTexture(img))
            );
        }

        return Promise.all(promises).then((texture) => ({ panorama, texture }));
    }

    /**
     * Creates the final texture from image
     */
    private createCubemapTexture(img: HTMLImageElement): Texture {
        if (img.width !== img.height) {
            utils.logWarn('Invalid base image, the width equal the height');
        }

        // resize image
        if (this.config.blur || img.width > SYSTEM.maxTextureWidth) {
            const ratio = Math.min(1, SYSTEM.maxCanvasWidth / img.width);

            const buffer = document.createElement('canvas');
            buffer.width = img.width * ratio;
            buffer.height = img.height * ratio;

            const ctx = buffer.getContext('2d');

            if (this.config.blur) {
                ctx.filter = 'blur(1px)';
            }

            ctx.drawImage(img, 0, 0, buffer.width, buffer.height);

            return utils.createTexture(buffer);
        }

        return utils.createTexture(img);
    }

    createMesh(scale = 1): CubemapMesh {
        const cubeSize = CONSTANTS.SPHERE_RADIUS * 2 * scale;
        const geometry = new BoxGeometry(cubeSize, cubeSize, cubeSize).scale(1, 1, -1) as BoxGeometry;

        const materials = [];
        for (let i = 0; i < 6; i++) {
            materials.push(
                AbstractAdapter.createOverlayMaterial({
                    additionalUniforms: {
                        rotation: { value: 0.0 },
                    },
                    overrideVertexShader: `
uniform float rotation;
varying vec2 vUv;
const float mid = 0.5;
void main() {
  if (rotation == 0.0) {
    vUv = uv;
  } else {
    vUv = vec2(
      cos(rotation) * (uv.x - mid) + sin(rotation) * (uv.y - mid) + mid,
      cos(rotation) * (uv.y - mid) - sin(rotation) * (uv.x - mid) + mid
    );
  }
  gl_Position = projectionMatrix *  modelViewMatrix * vec4( position, 1.0 );
}`,
                })
            );
        }

        return new Mesh(geometry, materials);
    }

    setTexture(mesh: CubemapMesh, textureData: CubemapTexture) {
        const { texture } = textureData;

        for (let i = 0; i < 6; i++) {
            if (this.config.flipTopBottom && (i === 2 || i === 3)) {
                this.__setUniform(mesh, i, 'rotation', Math.PI);
            }

            this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.panorama, texture[i]);
        }

        this.setOverlay(mesh, null, 0);
    }

    setOverlay(mesh: CubemapMesh, textureData: CubemapTexture, opacity: number) {
        for (let i = 0; i < 6; i++) {
            this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.overlayOpacity, opacity);
            if (!textureData) {
                this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.overlay, new Texture());
            } else {
                this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.overlay, textureData.texture[i]);
            }
        }
    }

    setTextureOpacity(mesh: CubemapMesh, opacity: number) {
        for (let i = 0; i < 6; i++) {
            this.__setUniform(mesh, i, AbstractAdapter.OVERLAY_UNIFORMS.globalOpacity, opacity);
            mesh.material[i].transparent = opacity < 1;
        }
    }

    disposeTexture(textureData: CubemapTexture) {
        textureData.texture?.forEach((texture) => texture.dispose());
    }

    private __setUniform(mesh: CubemapMesh, index: number, uniform: string, value: any) {
        if (mesh.material[index].uniforms[uniform].value instanceof Texture) {
            mesh.material[index].uniforms[uniform].value.dispose();
        }
        mesh.material[index].uniforms[uniform].value = value;
    }
}
