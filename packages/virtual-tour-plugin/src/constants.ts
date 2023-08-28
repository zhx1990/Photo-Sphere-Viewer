import { ObjectLoader } from 'three';
import { VirtualTourArrowStyle, VirtualTourMarkerStyle } from './model';
import arrowIconSvg from './arrow.svg';
import arrowGeometryJson from './models/arrow.json';
import arrowOutlineGeometryJson from './models/arrow_outline.json';

export const LINK_DATA = 'tourLink';
export const LINK_ID = '__tour-link__';

/**
 * Default style of the link marker
 */
export const DEFAULT_MARKER: VirtualTourMarkerStyle = {
    element: () => {
        const button = document.createElement('button');
        button.className = 'psv-virtual-tour-link';
        button.innerHTML = arrowIconSvg;
        return button;
    },
    size: { width: 80, height: 80 },
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
