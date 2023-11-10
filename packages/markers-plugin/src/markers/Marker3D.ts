import { ExtendedPosition, PSVError, Point, Size, utils, type Viewer } from '@photo-sphere-viewer/core';
import { Color, Group, Mesh, Object3D, PlaneGeometry, ShaderMaterial, Texture, Vector2, Vector3, VideoTexture } from 'three';
import { MarkerType } from '../MarkerType';
import { type MarkersPlugin } from '../MarkersPlugin';
import { MARKER_DATA } from '../constants';
import { MarkerConfig } from '../model';
import chromaKeyFragment from '../shaders/chromaKey.fragment.glsl';
import chromaKeyVertex from '../shaders/chromaKey.vertex.glsl';
import { getPolygonCenter } from '../utils';
import { Marker } from './Marker';

type ShaderUniforms = {
    map: { value: Texture },
    repeat: { value: Vector2 },
    offset: { value: Vector2 },
    alpha: { value: number },
    keying: { value: boolean },
    color: { value: Color },
    similarity: { value: number },
    smoothness: { value: number },
    spill: { value: number },
};

/**
 * @internal
 */
export class Marker3D extends Marker {

    override get video(): HTMLVideoElement {
        if (this.type === MarkerType.videoLayer) {
            return (this.threeElement.material.uniforms as ShaderUniforms).map.value.image;
        } else {
            return null;
        }
    }

    constructor(viewer: Viewer, plugin: MarkersPlugin, config: MarkerConfig) {
        super(viewer, plugin, config);
    }

    override is3d(): boolean {
        return true;
    }

    override createElement(): void {
        const material = new ShaderMaterial({
            transparent: true,
            depthTest: false,
            uniforms: {
                map: { value: null },
                repeat: { value: new Vector2(1, 1) },
                offset: { value: new Vector2(0, 0) },
                alpha: { value: 1 },
                keying: { value: false },
                color: { value: new Color(0x00ff00) },
                similarity: { value: 0.2 },
                smoothness: { value: 0.2 },
                spill: { value: 0.1 },
            } as ShaderUniforms,
            vertexShader: chromaKeyVertex,
            fragmentShader: chromaKeyFragment,
        });

        const geometry = new PlaneGeometry(1, 1);
        const mesh = new Mesh(geometry, material);
        mesh.userData = { [MARKER_DATA]: this };
        const group = new Group().add(mesh);

        // overwrite the visible property to be tied to the Marker instance
        // and do it without context bleed
        Object.defineProperty(group, 'visible', {
            enumerable: true,
            get: function (this: Object3D) {
                return (this.children[0].userData[MARKER_DATA] as Marker).state.visible;
            },
            set: function (this: Object3D, visible: boolean) {
                (this.children[0].userData[MARKER_DATA] as Marker).state.visible = visible;
            },
        });

        this.element = mesh;

        if (this.type === MarkerType.videoLayer) {
            this.viewer.needsContinuousUpdate(true);
        }
    }

    override destroy(): void {
        delete this.threeElement.userData[MARKER_DATA];

        if (this.type === MarkerType.videoLayer) {
            this.viewer.needsContinuousUpdate(false);
        }

        super.destroy();
    }

    override render(): Point {
        if (this.viewer.renderer.isObjectVisible(this.threeElement)) {
            return this.viewer.dataHelper.sphericalCoordsToViewerCoords(this.state.position);
        } else {
            return null;
        }
    }

    override update(config: MarkerConfig): void {
        super.update(config);

        const mesh = this.threeElement;
        const group = mesh.parent;
        const uniforms = mesh.material.uniforms as ShaderUniforms;

        this.state.dynamicSize = false;

        if (utils.isExtendedPosition(this.config.position)) {
            if (!this.config.size) {
                throw new PSVError('missing marker size');
            }

            this.state.position = this.viewer.dataHelper.cleanPosition(this.config.position);
            this.state.size = this.config.size;

            mesh.position.set(0.5 - this.state.anchor.x, this.state.anchor.y - 0.5, 0);
            this.viewer.dataHelper.sphericalCoordsToVector3(this.state.position, group.position);

            group.lookAt(0, group.position.y, 0);
            switch (this.config.orientation) {
                case 'horizontal':
                    group.rotateX(this.state.position.pitch < 0 ? -Math.PI / 2 : Math.PI / 2);
                    break;
                case 'vertical-left':
                    group.rotateY(-Math.PI * 0.4);
                    break;
                case 'vertical-right':
                    group.rotateY(Math.PI * 0.4);
                    break;
                // no default
            }

            // 100 is magic number that gives a coherent size at default zoom level
            group.scale.set(this.config.size.width / 100, this.config.size.height / 100, 1);

            const p = mesh.geometry.getAttribute('position');
            this.state.positions3D = [0, 1, 3, 2].map((i) => {
                const v3 = new Vector3();
                v3.fromBufferAttribute(p, i);
                return mesh.localToWorld(v3);
            });
        } else {
            if (this.config.position?.length !== 4) {
                throw new PSVError('missing marker position');
            }

            const positions = this.config.position.map((p) => this.viewer.dataHelper.cleanPosition(p));
            const positions3D = positions.map((p) => this.viewer.dataHelper.sphericalCoordsToVector3(p));

            const centroid = getPolygonCenter(positions.map(({ yaw, pitch }) => [yaw, pitch]));
            this.state.position = { yaw: centroid[0], pitch: centroid[1] };

            this.state.positions3D = positions3D;

            const p = mesh.geometry.getAttribute('position');
            [
                positions3D[0],
                positions3D[1],
                positions3D[3], // not a mistake!
                positions3D[2],
            ].forEach((v, i) => {
                p.setX(i, v.x);
                p.setY(i, v.y);
                p.setZ(i, v.z);
            });
            p.needsUpdate = true;

            this.__setTextureWrap(mesh.material);
        }

        switch (this.type) {
            case MarkerType.videoLayer:
                if (this.definition !== this.config.videoLayer) {
                    uniforms.map.value?.dispose();

                    const video = document.createElement('video');
                    video.crossOrigin = this.viewer.config.withCredentials ? 'use-credentials' : 'anonymous';
                    video.loop = true;
                    video.playsInline = true;
                    video.muted = true;
                    video.autoplay = true;
                    video.preload = 'metadata';
                    video.src = this.config.videoLayer;
                    video.style.display = 'none';
                    this.viewer.container.appendChild(video);

                    const texture = new VideoTexture(video);
                    uniforms.map.value = texture;
                    uniforms.alpha.value = 0;

                    if (!utils.isExtendedPosition(this.config.position)) {
                        video.addEventListener('loadedmetadata', () => {
                            mesh.material.userData[MARKER_DATA] = { width: video.videoWidth, height: video.videoHeight };
                            uniforms.alpha.value = this.config.opacity;
                            this.__setTextureWrap(mesh.material);
                        }, { once: true });
                    }

                    video.play();

                    this.definition = this.config.videoLayer;
                }
                break;

            case MarkerType.imageLayer:
                if (this.definition !== this.config.imageLayer) {
                    uniforms.map.value?.dispose();

                    const texture = new Texture();
                    uniforms.map.value = texture;
                    uniforms.alpha.value = 0;

                    this.viewer.textureLoader.loadImage(this.config.imageLayer)
                        .then((image) => {
                            if (!utils.isExtendedPosition(this.config.position)) {
                                mesh.material.userData[MARKER_DATA] = { width: image.width, height: image.height };
                                this.__setTextureWrap(mesh.material);
                            }

                            texture.image = image;
                            texture.anisotropy = 4;
                            texture.needsUpdate = true;
                            this.viewer.needsUpdate();

                            uniforms.alpha.value = this.config.opacity;
                        });

                    this.definition = this.config.imageLayer;
                }
                break;

            // no default
        }

        mesh.renderOrder = 1000 + this.config.zIndex;
        mesh.geometry.boundingBox = null; // reset box for Renderer.isObjectVisible

        uniforms.keying.value = this.config.chromaKey?.enabled === true;
        if (this.config.chromaKey?.enabled) {
            if (typeof this.config.chromaKey.color === 'object' && 'r' in this.config.chromaKey.color) {
                uniforms.color.value.set(
                    this.config.chromaKey.color.r / 255,
                    this.config.chromaKey.color.g / 255,
                    this.config.chromaKey.color.b / 255
                );
            } else {
                uniforms.color.value.set(this.config.chromaKey.color ?? 0x00ff00);
            }
            uniforms.similarity.value = this.config.chromaKey.similarity ?? 0.2;
            uniforms.smoothness.value = this.config.chromaKey.smoothness ?? 0.2;
        }
    }

    /**
     * For layers positionned by corners, applies offset to the texture in order to keep its proportions
     */
    private __setTextureWrap(material: ShaderMaterial) {
        const imageSize: Size = material.userData[MARKER_DATA];
        const uniforms = material.uniforms as ShaderUniforms;

        if (!imageSize || !imageSize.height || !imageSize.width) {
            uniforms.repeat.value.set(1, 1);
            uniforms.offset.value.set(0, 0);
            return;
        }

        const positions = (this.config.position as ExtendedPosition[]).map((p) => {
            return this.viewer.dataHelper.cleanPosition(p);
        });

        const w1 = utils.greatArcDistance(
            [positions[0].yaw, positions[0].pitch],
            [positions[1].yaw, positions[1].pitch]
        );
        const w2 = utils.greatArcDistance(
            [positions[3].yaw, positions[3].pitch],
            [positions[2].yaw, positions[2].pitch]
        );
        const h1 = utils.greatArcDistance(
            [positions[1].yaw, positions[1].pitch],
            [positions[2].yaw, positions[2].pitch]
        );
        const h2 = utils.greatArcDistance(
            [positions[0].yaw, positions[0].pitch],
            [positions[3].yaw, positions[3].pitch]
        );

        const layerRatio = (w1 + w2) / (h1 + h2);
        const imageRatio = imageSize.width / imageSize.height;

        let hMargin = 0;
        let vMargin = 0;
        if (layerRatio < imageRatio) {
            hMargin = imageRatio - layerRatio;
        } else {
            vMargin = 1 / imageRatio - 1 / layerRatio;
        }

        uniforms.repeat.value.set(1 - hMargin, 1 - vMargin);
        uniforms.offset.value.set(hMargin / 2, vMargin / 2);
    }

}