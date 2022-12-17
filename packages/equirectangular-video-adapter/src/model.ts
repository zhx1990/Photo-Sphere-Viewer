import type { EquirectangularAdapterConfig } from '@photo-sphere-viewer/core';
import type { AbstractVideoAdapterConfig, AbstractVideoPanorama } from '@photo-sphere-viewer/shared';

/**
 * Configuration of an equirectangular video
 */
export type EquirectangularVideoPanorama = AbstractVideoPanorama;

export type EquirectangularVideoAdapterConfig = EquirectangularAdapterConfig & AbstractVideoAdapterConfig;
