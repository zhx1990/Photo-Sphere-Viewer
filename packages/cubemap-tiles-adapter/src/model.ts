import type { Cubemap, CubemapAdapterConfig, CubemapPanorama } from '@photo-sphere-viewer/cubemap-adapter';

/**
 * Configuration of a tiled cubemap
 */
export type CubemapTilesPanorama = {
    /**
     * low resolution panorama loaded before tiles
     */
    baseUrl?: CubemapPanorama;
    /**
     * size of a face in pixels
     */
    faceSize: number;
    /**
     * number of tiles on a side of a face
     */
    nbTiles: number;
    /**
     * function to build a tile url
     */
    tileUrl: (face: keyof Cubemap, col: number, row: number) => string;
};

export type CubemapTilesAdapterConfig = CubemapAdapterConfig & {
    /**
     * shows a warning sign on tiles that cannot be loaded
     * @default true
     */
    showErrorTile?: boolean;
    /**
     * applies a blur effect to the low resolution panorama
     * @default true
     */
    baseBlur?: boolean;
};
