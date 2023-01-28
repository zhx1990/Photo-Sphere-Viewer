import { ObjectLoader } from 'three';
import arrowIconSvg from './arrow.svg';
import { VirtualTourArrowStyle, VirtualTourMarkerStyle } from './model';
import arrowGeometryJson from './models/arrow.json';
import arrowOutlineGeometryJson from './models/arrow_outline.json';

export const LINK_DATA = 'tourLink';
export const LINK_ID = '__tour-link__';

/**
 * Default style of the link marker
 */
export const DEFAULT_MARKER: VirtualTourMarkerStyle = {
    html: arrowIconSvg,
    size: { width: 80, height: 80 },
    scale: [0.5, 2],
    anchor: 'top center',
    className: 'psv-virtual-tour__marker',
    style: {
        color: 'rgba(0, 208, 255, 0.8)',
    },
};

/**
 * Default style of the link arrow
 */
export const DEFAULT_ARROW: VirtualTourArrowStyle = {
    color: '#aaaaaa',
    hoverColor: '#aa5500',
    outlineColor: '#000000',
    scale: [0.5, 2],
};

export const { ARROW_GEOM, ARROW_OUTLINE_GEOM } = (() => {
    const loader = new ObjectLoader();
    const geometries = loader.parseGeometries([arrowGeometryJson, arrowOutlineGeometryJson]);
    const arrow = geometries[arrowGeometryJson.uuid];
    const arrowOutline = geometries[arrowOutlineGeometryJson.uuid];
    const scale = 0.015;
    const rot = Math.PI / 2;
    arrow.scale(scale, scale, scale);
    arrow.rotateX(rot);
    arrowOutline.scale(scale, scale, scale);
    arrowOutline.rotateX(rot);
    return { ARROW_GEOM: arrow, ARROW_OUTLINE_GEOM: arrowOutline };
})();
