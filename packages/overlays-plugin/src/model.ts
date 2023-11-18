import type { AdapterConstructor } from '@photo-sphere-viewer/core';
import type { CubemapPanorama } from '@photo-sphere-viewer/cubemap-adapter';
import { ColorRepresentation } from 'three';

export type BaseOverlayConfig = {
    id?: string;
    /**
     * @default image
     */
    type?: 'image' | 'video';
    /**
     * @default 1
     */
    opacity?: number;
    /**
     * @default 0
     */
    zIndex?: number;
};

/**
 * Overlay applied on a sphere, complete or partial
 */
export type SphereOverlayConfig = BaseOverlayConfig & {
    path: string;
    /**
     * @default -PI
     */
    yaw?: number | string;
    /**
     * @default PI / 2
     */
    pitch?: number | string;
    /**
     * @default 2 * PI
     */
    width?: number | string;
    /**
     * @default PI
     */
    height?: number | string;
    /**
     * Will make a color of the image/video transparent
     */
    chromaKey?: {
        /** @default false */
        enabled: boolean;
        /** @default 0x00ff00 */
        color?: ColorRepresentation | { r: number; g: number; b: number };
        /** @default 0.2 */
        similarity?: number;
        /** @default 0.2 */
        smoothness?: number;
    };
};

/**
 * Overlay applied on a whole cube (6 images)
 */
export type CubeOverlayConfig = BaseOverlayConfig & {
    path: CubemapPanorama;
    type?: 'image';
};

export type OverlayConfig = SphereOverlayConfig | CubeOverlayConfig;

/**
 * @internal
 */
export type ParsedOverlayConfig = OverlayConfig & {
    mode: 'sphere' | 'cube';
};

export type OverlaysPluginConfig = {
    /**
     * Initial overlays
     */
    overlays?: OverlayConfig[];
    /**
     * Automatically remove all overlays when the panorama changes
     * @default true
     */
    autoclear?: boolean;
    /**
     * Used to display cubemap overlays on equirectangular panoramas
     */
    cubemapAdapter?: AdapterConstructor;
};

export type UpdatableOverlaysPluginConfig = Omit<OverlaysPluginConfig, 'overlays' | 'cubemapAdapter'>;
