export type CubemapFaces = 'left' | 'front' | 'right' | 'back' | 'top' | 'bottom';

/**
 * Object defining a cubemap as separated files
 */
export type Cubemap = { [K in CubemapFaces]: string };

/**
 * Object defining a cubemap as separated files
 * @description images order is : left, front, right, back, top, bottom
 */
export type CubemapArray = string[6];

/**
 * Object defining a cubemap as separated files
 */
export type CubemapSeparate = {
    type: 'separate';
    paths: Cubemap | CubemapArray;
};

/**
 * Object defining a cubemap as a single stripe file
 */
export type CubemapStripe = {
    type: 'stripe';
    path: string;
    /**
     * Order of the faces in the file
     * @default 'left, front, right, back, top, bottom'
     */
    order?: CubemapFaces[];
};

/**
 * Object defining a cubemap as a single net file (cross arrangement)
 */
export type CubemapNet = {
    type: 'net';
    path: string;
};

/**
 * Configuration of a cubemap
 */
export type CubemapPanorama = Cubemap | CubemapArray | CubemapSeparate | CubemapStripe | CubemapNet;

export type CubemapAdapterConfig = {
    /**
     * set to true if the top and bottom faces are not correctly oriented
     * @default false
     */
    flipTopBottom?: boolean;
    /**
     * used for cubemap tiles adapter
     * @internal
     */
    blur?: boolean;
};
