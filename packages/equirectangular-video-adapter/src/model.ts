import type { AbstractVideoAdapterConfig, AbstractVideoPanorama } from '../../shared/AbstractVideoAdapter';
import type { MeshBasicMaterial, ShaderMaterial } from 'three';

/**
 * Configuration of an equirectangular video
 */
export type EquirectangularVideoPanorama = AbstractVideoPanorama;

export type EquirectangularVideoAdapterConfig = AbstractVideoAdapterConfig & {
    /**
     * number of faces of the sphere geometry, higher values may decrease performances
     * @default 64
     */
    resolution?: number;
    meshMaterial?: MeshBasicMaterial | ShaderMaterial;
};
