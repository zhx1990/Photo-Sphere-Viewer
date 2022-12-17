/**
 * Object defining a cubemap
 */
export type Cubemap = {
    left: string;
    front: string;
    right: string;
    back: string;
    top: string;
    bottom: string;
};

/**
 * Configuration of a cubemap
 * @description if an array, images order is : left, front, right, back, top, bottom
 */
export type CubemapPanorama = Cubemap | string[6];

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
