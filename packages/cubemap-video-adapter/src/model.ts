import type { AbstractVideoAdapterConfig, AbstractVideoPanorama } from '../../shared/AbstractVideoAdapter';

/**
 * Configuration of a cubemap video
 */
export type CubemapVideoPanorama = AbstractVideoPanorama;

export type CubemapVideoAdapterConfig = AbstractVideoAdapterConfig & {
    /**
     * if the video is an equiangular cubemap (EAC)
     * @default true
     */
    equiangular?: boolean;
};
