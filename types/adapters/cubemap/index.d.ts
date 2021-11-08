import { AbstractAdapter } from '../..';

/**
 * @summary Cubemap defined as an array of images
 * @description images order is : left, front, right, back, top, bottom
 */
export type CubemapArray = string[6];

/**
 * @summary Object defining a cubemap
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
 * @summary Adapter for cubemaps
 */
export class CubemapAdapter extends AbstractAdapter<CubemapArray | Cubemap> {

}
