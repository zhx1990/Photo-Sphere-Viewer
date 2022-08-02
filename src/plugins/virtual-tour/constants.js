import { ObjectLoader } from 'three';
import arrowGeometryJson from './arrow.json';
import arrowIconSvg from './arrow.svg';
import arrowOutlineGeometryJson from './arrow_outline.json';
import nodesList from './nodes-list.svg';

/**
 * @summary In client mode all the nodes are provided in the config or with the `setNodes` method
 * @type {string}
 * @memberof PSV.plugins.VirtualTourPlugin
 * @constant
 */
export const MODE_CLIENT = 'client';

/**
 * @summary In server mode the nodes are fetched asynchronously
 * @type {string}
 * @memberof PSV.plugins.VirtualTourPlugin
 * @constant
 */
export const MODE_SERVER = 'server';

/**
 * @summary In manual mode each link is positionned manually on the panorama
 * @type {string}
 * @memberof PSV.plugins.VirtualTourPlugin
 * @constant
 */
export const MODE_MANUAL = 'manual';

/**
 * @summary In GPS mode each node is globally positionned and the links are automatically computed
 * @type {string}
 * @memberof PSV.plugins.VirtualTourPlugin
 * @constant
 */
export const MODE_GPS = 'gps';

/**
 * @summaru In markers mode the links are represented using markers
 * @type {string}
 * @memberof PSV.plugins.VirtualTourPlugin
 * @constant
 */
export const MODE_MARKERS = 'markers';

/**
 * @summaru In 3D mode the links are represented using 3d arrows
 * @type {string}
 * @memberof PSV.plugins.VirtualTourPlugin
 * @constant
 */
export const MODE_3D = '3d';

/**
 * @summary Available events
 * @enum {string}
 * @memberof PSV.plugins.VirtualTourPlugin
 * @constant
 */
export const EVENTS = {
  /**
   * @event node-changed
   * @memberof PSV.plugins.VirtualTourPlugin
   * @summary Triggered when the current node changes
   * @param {string} nodeId
   */
  NODE_CHANGED     : 'node-changed',
  /**
   * @event filter:render-nodes-list
   * @memberof PSV.plugins.VirtualTourPlugin
   * @summary Used to alter the list of nodes displayed on the side-panel
   * @param {PSV.plugins.VirtualTourPlugin.Node[]} nodes
   * @returns {PSV.plugins.VirtualTourPlugin.Node[]}
   */
  RENDER_NODES_LIST: 'render-nodes-list',
};

/**
 * @summary Property name added to markers
 * @type {string}
 * @constant
 * @private
 */
export const LINK_DATA = 'tourLink';

/**
 * @summary Default style of the link marker
 * @type {PSV.plugins.MarkersPlugin.Properties}
 * @constant
 * @private
 */
export const DEFAULT_MARKER = {
  html     : arrowIconSvg,
  width    : 80,
  height   : 80,
  scale    : [0.5, 2],
  anchor   : 'top center',
  className: 'psv-virtual-tour__marker',
  style    : {
    color: 'rgba(0, 208, 255, 0.8)',
  },
};

/**
 * @summary Default style of the link arrow
 * @type {PSV.plugins.VirtualTourPlugin.ArrowStyle}
 * @constant
 * @private
 */
export const DEFAULT_ARROW = {
  color       : 0xaaaaaa,
  hoverColor  : 0xaa5500,
  outlineColor: 0x000000,
  scale       : [0.5, 2],
};

/**
 * @type {external:THREE.BufferedGeometry}
 * @constant
 * @private
 */
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

/**
 * @summary Panel identifier for nodes list
 * @type {string}
 * @constant
 * @private
 */
export const ID_PANEL_NODES_LIST = 'virtualTourNodesList';

/**
 * @summary Nodes list template
 * @param {PSV.plugins.VirtualTourPlugin.Node[]} nodes
 * @param {string} title
 * @param {string} currentNodeId
 * @returns {string}
 * @constant
 * @private
 */
export const NODES_LIST_TEMPLATE = (nodes, title, currentNodeId) => `
<div class="psv-panel-menu psv-panel-menu--stripped psv-virtual-tour__menu">
  <h1 class="psv-panel-menu-title">${nodesList} ${title}</h1>
  <ul class="psv-panel-menu-list">
    ${nodes.map(node => `
    <li data-node-id="${node.id}" tabindex="0"
        class="psv-panel-menu-item ${currentNodeId === node.id ? 'psv-panel-menu-item--active' : ''}">
      ${node.thumbnail ? `<span class="psv-panel-menu-item-icon"><img src="${node.thumbnail}"/></span>` : ''}
      <span class="psv-panel-menu-item-label">${node.caption || node.name}</span>
    </li>
    `).join('')}
  </ul>
</div>
`;
