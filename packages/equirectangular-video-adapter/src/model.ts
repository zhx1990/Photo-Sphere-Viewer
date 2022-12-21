import type { EquirectangularAdapterConfig } from '@photo-sphere-viewer/core';
import type { AbstractVideoAdapterConfig, AbstractVideoPanorama } from '../../shared/AbstractVideoAdapter';

/**
 * Configuration of an equirectangular video
 */
export type EquirectangularVideoPanorama = AbstractVideoPanorama;

export type EquirectangularVideoAdapterConfig = EquirectangularAdapterConfig & AbstractVideoAdapterConfig;
