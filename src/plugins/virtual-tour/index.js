import { AbstractPlugin, CONSTANTS, DEFAULTS, PSVError, registerButton, utils } from 'photo-sphere-viewer';
import * as THREE from 'three';
import { ClientSideDatasource } from './ClientSideDatasource';
import {
  ARROW_GEOM,
  DEFAULT_ARROW,
  DEFAULT_MARKER,
  EVENTS,
  ID_PANEL_NODES_LIST,
  LINK_DATA,
  MODE_3D,
  MODE_CLIENT,
  MODE_GPS,
  MODE_MANUAL,
  MODE_MARKERS,
  MODE_SERVER,
  NODES_LIST_TEMPLATE
} from './constants';
import { NodesListButton } from './NodesListButton';
import { ServerSideDatasource } from './ServerSideDatasource';
import './style.scss';
import { bearing, distance, setMeshColor } from './utils';


/**
 * @callback GetNode
 * @summary Function to load a node
 * @memberOf PSV.plugins.VirtualTourPlugin
 * @param {string} nodeId
 * @returns {PSV.plugins.VirtualTourPlugin.Node|Promise<PSV.plugins.VirtualTourPlugin.Node>}
 */

/**
 * @callback GetLinks
 * @summary Function to load the links of a node
 * @memberOf PSV.plugins.VirtualTourPlugin
 * @param {string} nodeId
 * @returns {PSV.plugins.VirtualTourPlugin.NodeLink[]|Promise<PSV.plugins.VirtualTourPlugin.NodeLink[]>}
 */

/**
 * @callback Preload
 * @summary Function to determine if a link must be preloaded
 * @memberOf PSV.plugins.VirtualTourPlugin
 * @param {PSV.plugins.VirtualTourPlugin.Node} node
 * @param {PSV.plugins.VirtualTourPlugin.NodeLink} link
 * @returns {boolean}
 */

/**
 * @typedef {Object} PSV.plugins.VirtualTourPlugin.Node
 * @summary Definition of a single node in the tour
 * @property {string} id - unique identifier of the node
 * @property {*} panorama
 * @property {PSV.plugins.VirtualTourPlugin.NodeLink[]} [links] - links to other nodes
 * @property {number[]} [position] - GPS position (longitude, latitude, optional altitude)
 * @property {PSV.PanoData | PSV.PanoDataProvider} [panoData] - data used for this panorama
 * @property {PSV.SphereCorrection} [sphereCorrection] - sphere correction to apply to this panorama
 * @property {string} [name] - short name of the node
 * @property {string} [caption] - caption visible in the navbar
 * @property {string} [thumbnail] - thumbnail for the nodes list in the side panel
 * @property {PSV.plugins.MarkersPlugin.Properties[]} [markers] - additional markers to use on this node
 */

/**
 * @typedef {PSV.ExtendedPosition} PSV.plugins.VirtualTourPlugin.NodeLink
 * @summary Definition of a link between two nodes
 * @property {string} nodeId - identifier of the target node
 * @property {string} [name] - override the name of the node (tooltip)
 * @property {number[]} [position] - override the GPS position of the node
 * @property {PSV.plugins.MarkersPlugin.Properties} [markerStyle] - override global marker style
 * @property {PSV.plugins.VirtualTourPlugin.ArrowStyle} [arrowStyle] - override global arrow style
 */

/**
 * @typedef {Object} PSV.plugins.VirtualTourPlugin.ArrowStyle
 * @summary Style of the arrow in 3D mode
 * @property {string} [color=#0055aa]
 * @property {string} [hoverColor=#aa5500]
 * @property {number} [opacity=0.8]
 * @property {number[]} [scale=[0.5,2]]
 */

/**
 * @typedef {Object} PSV.plugins.VirtualTourPlugin.Options
 * @property {'client'|'server'} [dataMode='client'] - configure data mode
 * @property {'manual'|'gps'} [positionMode='manual'] - configure positioning mode
 * @property {'markers'|'3d'} [renderMode='3d'] - configure rendering mode of links
 * @property {PSV.plugins.VirtualTourPlugin.Node[]} [nodes] - initial nodes
 * @property {PSV.plugins.VirtualTourPlugin.GetNode} [getNode]
 * @property {PSV.plugins.VirtualTourPlugin.GetLinks} [getLinks]
 * @property {string} [startNodeId] - id of the initial node, if not defined the first node will be used
 * @property {boolean|PSV.plugins.VirtualTourPlugin.Preload} [preload=false] - preload linked panoramas
 * @property {boolean} [listButton] - adds a button to show the list of nodes, defaults to `true` only in client data mode
 * @property {boolean} [linksOnCompass] - if the Compass plugin is enabled, displays the links on the compass, defaults to `true` on in markers render mode
 * @property {PSV.plugins.MarkersPlugin.Properties} [markerStyle] - global marker style
 * @property {PSV.plugins.VirtualTourPlugin.ArrowStyle} [arrowStyle] - global arrow style
 * @property {number} [markerLatOffset=-0.1] - (GPS & Markers mode) latitude offset applied to link markers, to compensate for viewer height
 * @property {'top'|'bottom'} [arrowPosition='bottom'] - (3D mode) arrows vertical position
 */


// add markers buttons
DEFAULTS.navbar.splice(DEFAULTS.navbar.indexOf('caption'), 0, NodesListButton.id);
DEFAULTS.lang[NodesListButton.id] = 'Locations';
DEFAULTS.lang.loading = 'Loading...';
registerButton(NodesListButton);


export { EVENTS, MODE_3D, MODE_CLIENT, MODE_GPS, MODE_MANUAL, MODE_MARKERS, MODE_SERVER } from './constants';


/**
 * @summary Create virtual tours by linking multiple panoramas
 * @extends PSV.plugins.AbstractPlugin
 * @memberof PSV.plugins
 */
export class VirtualTourPlugin extends AbstractPlugin {

  static id = 'virtual-tour';

  /**
   * @param {PSV.Viewer} psv
   * @param {PSV.plugins.VirtualTourPlugin.Options} [options]
   */
  constructor(psv, options) {
    super(psv);

    /**
     * @member {Object}
     * @property {PSV.plugins.VirtualTourPlugin.Node} currentNode
     * @property {external:THREE.Mesh} currentArrow
     * @property {PSV.Tooltip} currentTooltip
     * @property {string} loadingNode
     * @private
     */
    this.prop = {
      currentNode   : null,
      currentArrow  : null,
      currentTooltip: null,
      loadingNode   : null,
    };

    /**
     * @type {Record<string, boolean | Promise>}
     * @private
     */
    this.preload = {};

    /**
     * @member {PSV.plugins.VirtualTourPlugin.Options}
     * @private
     */
    this.config = {
      dataMode       : MODE_CLIENT,
      positionMode   : MODE_MANUAL,
      renderMode     : MODE_3D,
      preload        : false,
      markerLatOffset: -0.1,
      arrowPosition  : 'bottom',
      linksOnCompass : options?.renderMode === MODE_MARKERS,
      listButton     : options?.dataMode !== MODE_SERVER,
      ...options,
      markerStyle: {
        ...DEFAULT_MARKER,
        ...options?.markerStyle,
      },
      arrowStyle : {
        ...DEFAULT_ARROW,
        ...options?.arrowStyle,
      },
      nodes      : null,
    };

    /**
     * @type {PSV.plugins.MarkersPlugin}
     * @private
     */
    this.markers = this.psv.getPlugin('markers');

    /**
     * @type {PSV.plugins.CompassPlugin}
     * @private
     */
    this.compass = this.psv.getPlugin('compass');

    if (!this.is3D() && !this.markers) {
      throw new PSVError('Tour plugin requires the Markers plugin in markers mode');
    }

    /**
     * @type {PSV.plugins.VirtualTourPlugin.AbstractDatasource}
     */
    this.datasource = this.isServerSide() ? new ServerSideDatasource(this) : new ClientSideDatasource(this);

    /**
     * @type {external:THREE.Group}
     * @private
     */
    this.arrowsGroup = null;

    if (this.is3D()) {
      this.arrowsGroup = new THREE.Group();

      const localLight = new THREE.PointLight(0xffffff, 1, 0);
      localLight.position.set(2, 0, 0);
      this.arrowsGroup.add(localLight);

      this.psv.once(CONSTANTS.EVENTS.READY, () => {
        this.__positionArrows();
        this.psv.renderer.scene.add(this.arrowsGroup);

        const ambientLight = new THREE.AmbientLight(0xffffff, 1);
        this.psv.renderer.scene.add(ambientLight);

        this.psv.needsUpdate();

        this.psv.container.addEventListener('mousemove', this);
      });

      this.psv.on(CONSTANTS.EVENTS.POSITION_UPDATED, this);
      this.psv.on(CONSTANTS.EVENTS.ZOOM_UPDATED, this);
      this.psv.on(CONSTANTS.EVENTS.CLICK, this);
    }
    else {
      this.markers.on('select-marker', this);
    }

    if (this.isServerSide()) {
      if (this.config.startNodeId) {
        this.setCurrentNode(this.config.startNodeId);
      }
    }
    else if (options?.nodes) {
      this.setNodes(options.nodes, this.config.startNodeId);
    }
  }

  destroy() {
    if (this.markers) {
      this.markers.off('select-marker', this);
    }
    if (this.arrowsGroup) {
      this.psv.renderer.scene.remove(this.arrowsGroup);
    }

    this.psv.off(CONSTANTS.EVENTS.POSITION_UPDATED, this);
    this.psv.off(CONSTANTS.EVENTS.ZOOM_UPDATED, this);
    this.psv.off(CONSTANTS.EVENTS.CLICK, this);
    this.psv.container.removeEventListener('mousemove', this);

    this.datasource.destroy();

    delete this.preload;
    delete this.datasource;
    delete this.markers;
    delete this.prop;
    delete this.arrowsGroup;

    super.destroy();
  }

  handleEvent(e) {
    let nodeId;
    switch (e.type) {
      case 'select-marker':
        nodeId = e.args[0].data?.[LINK_DATA]?.nodeId;
        if (nodeId) {
          this.setCurrentNode(nodeId);
        }
        break;

      case CONSTANTS.EVENTS.POSITION_UPDATED:
      case CONSTANTS.EVENTS.ZOOM_UPDATED:
        if (this.arrowsGroup) {
          this.__positionArrows();
        }
        break;

      case CONSTANTS.EVENTS.CLICK:
        nodeId = this.prop.currentArrow?.userData?.[LINK_DATA]?.nodeId;
        if (!nodeId) {
          // on touch screens "currentArrow" may be null (no hover state)
          const arrow = this.psv.dataHelper.getIntersection({ x: e.args[0].viewerX, y: e.args[0].viewerY }, LINK_DATA)?.object;
          nodeId = arrow?.userData?.[LINK_DATA]?.nodeId;
        }
        if (nodeId) {
          this.setCurrentNode(nodeId);
        }
        break;

      case 'mousemove':
        this.__onMouseMove(e);
        break;

      default:
    }
  }

  /**
   * @summary Tests if running in server mode
   * @return {boolean}
   */
  isServerSide() {
    return this.config.dataMode === MODE_SERVER;
  }

  /**
   * @summary Tests if running in GPS mode
   * @return {boolean}
   */
  isGps() {
    return this.config.positionMode === MODE_GPS;
  }

  /**
   * @summary Tests if running in 3D mode
   * @return {boolean}
   */
  is3D() {
    return this.config.renderMode === MODE_3D;
  }

  /**
   * @summary Sets the nodes (client mode only)
   * @param {PSV.plugins.VirtualTourPlugin.Node[]} nodes
   * @param {string} [startNodeId]
   * @throws {PSV.PSVError} when the configuration is incorrect
   */
  setNodes(nodes, startNodeId) {
    if (this.isServerSide()) {
      throw new PSVError('Cannot set nodes in server side mode');
    }

    this.datasource.setNodes(nodes);

    if (!startNodeId) {
      startNodeId = nodes[0].id;
    }
    else if (!this.datasource.nodes[startNodeId]) {
      startNodeId = nodes[0].id;
      utils.logWarn(`startNodeId not found is provided nodes, resetted to ${startNodeId}`);
    }

    this.setCurrentNode(startNodeId);
  }

  /**
   * @summary Changes the current node
   * @param {string} nodeId
   * @returns {Promise<boolean>} resolves false if the loading was aborted by another call
   */
  setCurrentNode(nodeId) {
    if (nodeId === this.prop.currentNode?.id) {
      return Promise.resolve(true);
    }

    this.psv.loader.show();
    this.psv.hideError();

    this.prop.loadingNode = nodeId;

    // if this node is already preloading, wait for it
    return Promise.resolve(this.preload[nodeId])
      .then(() => {
        if (this.prop.loadingNode !== nodeId) {
          return Promise.reject(utils.getAbortError());
        }

        this.psv.textureLoader.abortLoading();
        return this.datasource.loadNode(nodeId);
      })
      .then((node) => {
        if (this.prop.loadingNode !== nodeId) {
          return Promise.reject(utils.getAbortError());
        }

        this.psv.navbar.setCaption(`<em>${this.psv.config.lang.loading}</em>`);

        this.prop.currentNode = node;

        if (this.prop.currentTooltip) {
          this.prop.currentTooltip.hide();
          this.prop.currentTooltip = null;
        }

        if (this.is3D()) {
          this.arrowsGroup.remove(...this.arrowsGroup.children.filter(o => o.type === 'Mesh'));
          this.prop.currentArrow = null;
        }

        this.markers?.clearMarkers();
        this.compass?.clearHotspots();

        return Promise.all([
          this.psv.setPanorama(node.panorama, {
            panoData        : node.panoData,
            sphereCorrection: node.sphereCorrection,
          })
            .catch((err) => {
              // the error is already displayed by the core
              return Promise.reject(utils.isAbortError(err) ? err : null);
            }),
          this.datasource.loadLinkedNodes(nodeId),
        ]);
      })
      .then(() => {
        if (this.prop.loadingNode !== nodeId) {
          return Promise.reject(utils.getAbortError());
        }

        const node = this.prop.currentNode;

        if (node.markers) {
          if (this.markers) {
            this.markers.setMarkers(node.markers);
          }
          else {
            utils.logWarn(`Node ${node.id} markers ignored because the plugin is not loaded.`);
          }
        }

        this.__renderLinks(node);
        this.__preload(node);

        this.psv.navbar.setCaption(node.caption || this.psv.config.caption);

        /**
         * @event node-changed
         * @memberof PSV.plugins.VirtualTourPlugin
         * @summary Triggered when the current node is changed
         * @param {string} nodeId
         */
        this.trigger(EVENTS.NODE_CHANGED, nodeId);

        this.prop.loadingNode = null;

        return true;
      })
      .catch((err) => {
        if (utils.isAbortError(err)) {
          return Promise.resolve(false);
        }
        else if (err) {
          this.psv.showError(this.psv.config.lang.loadError);
        }

        this.psv.loader.hide();
        this.psv.navbar.setCaption('');

        this.prop.loadingNode = null;

        return Promise.reject(err);
      });
  }

  /**
   * @summary Adds the links for the node
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @private
   */
  __renderLinks(node) {
    const positions = [];

    node.links.forEach((link) => {
      const position = this.__getLinkPosition(node, link);
      positions.push(position);

      if (this.is3D()) {
        const arrow = ARROW_GEOM.clone();
        const mat = new THREE.MeshLambertMaterial({
          transparent: true,
          opacity    : link.arrowStyle?.opacity || this.config.arrowStyle.opacity,
        });
        const mesh = new THREE.Mesh(arrow, mat);

        setMeshColor(mesh, link.arrowStyle?.color || this.config.arrowStyle.color);

        mesh.userData = { [LINK_DATA]: link, longitude  : position.longitude };
        mesh.rotation.order = 'YXZ';
        mesh.rotateY(-position.longitude);
        this.psv.dataHelper
          .sphericalCoordsToVector3({ longitude: position.longitude, latitude : 0 }, mesh.position)
          .multiplyScalar(1 / CONSTANTS.SPHERE_RADIUS);

        this.arrowsGroup.add(mesh);
      }
      else {
        if (this.isGps()) {
          position.latitude += this.config.markerLatOffset;
        }

        this.markers.addMarker({
          ...this.config.markerStyle,
          ...link.markerStyle,
          id      : `tour-link-${link.nodeId}`,
          tooltip : link.name,
          hideList: true,
          data    : { [LINK_DATA]: link },
          ...position,
        }, false);
      }
    });

    if (this.is3D()) {
      this.__positionArrows();
    }
    else {
      this.markers.renderMarkers();
    }

    if (this.config.linksOnCompass && this.compass) {
      this.compass.setHotspots(positions);
    }
  }

  /**
   * @summary Computes the marker position for a link
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @param {PSV.plugins.VirtualTourPlugin.NodeLink} link
   * @return {PSV.Position}
   * @private
   */
  __getLinkPosition(node, link) {
    if (this.isGps()) {
      const p1 = [THREE.Math.degToRad(node.position[0]), THREE.Math.degToRad(node.position[1])];
      const p2 = [THREE.Math.degToRad(link.position[0]), THREE.Math.degToRad(link.position[1])];
      const h1 = node.position[2] !== undefined ? node.position[2] : link.position[2] || 0;
      const h2 = link.position[2] !== undefined ? link.position[2] : node.position[2] || 0;

      let latitude = 0;
      if (h1 !== h2) {
        latitude = Math.atan((h2 - h1) / distance(p1, p2));
      }

      const longitude = bearing(p1, p2);

      return { longitude, latitude };
    }
    else {
      return this.psv.dataHelper.cleanPosition(link);
    }
  }

  /**
   * @summary Updates hovered arrow on mousemove
   * @param {MouseEvent} evt
   * @private
   */
  __onMouseMove(evt) {
    const viewerPos = utils.getPosition(this.psv.container);
    const viewerPoint = {
      x: evt.clientX - viewerPos.left,
      y: evt.clientY - viewerPos.top,
    };

    const mesh = this.psv.dataHelper.getIntersection(viewerPoint, LINK_DATA)?.object;

    if (mesh === this.prop.currentArrow) {
      if (this.prop.currentTooltip) {
        this.prop.currentTooltip.move({
          left: viewerPoint.x,
          top : viewerPoint.y,
        });
      }
    }
    else {
      if (this.prop.currentArrow) {
        const link = this.prop.currentArrow.userData[LINK_DATA];

        setMeshColor(this.prop.currentArrow, link.arrowStyle?.color || this.config.arrowStyle.color);

        if (this.prop.currentTooltip) {
          this.prop.currentTooltip.hide();
          this.prop.currentTooltip = null;
        }
      }

      if (mesh) {
        const link = mesh.userData[LINK_DATA];

        setMeshColor(mesh, link.arrowStyle?.hoverColor || this.config.arrowStyle.hoverColor);

        if (link.name) {
          this.prop.currentTooltip = this.psv.tooltip.create({
            left   : viewerPoint.x,
            top    : viewerPoint.y,
            content: link.name,
          });
        }
      }

      this.prop.currentArrow = mesh;

      this.psv.needsUpdate();
    }
  }

  /**
   * @summary Updates to position of the group of arrows
   * @private
   */
  __positionArrows() {
    const isBottom = this.config.arrowPosition === 'bottom';

    this.arrowsGroup.position.copy(this.psv.prop.direction).multiplyScalar(0.5);
    const s = this.config.arrowStyle.scale;
    const f = s[1] + (s[0] - s[1]) * CONSTANTS.EASINGS.linear(this.psv.getZoomLevel() / 100);
    this.arrowsGroup.position.y += isBottom ? -1.5 : 1.5;
    this.arrowsGroup.scale.set(f, f, f);

    // slightly rotates each arrow to make the center ones standing out
    const position = this.psv.getPosition();
    if (isBottom ? (position.latitude < Math.PI / 8) : (position.latitude > -Math.PI / 8)) {
      this.arrowsGroup.children
        .filter(o => o.type === 'Mesh')
        .forEach((arrow) => {
          const d = Math.abs(utils.getShortestArc(arrow.userData.longitude, position.longitude));
          const x = CONSTANTS.EASINGS.inOutSine(Math.max(0, Math.PI / 4 - d) / (Math.PI / 4)) / 3; // magic !
          arrow.rotation.x = isBottom ? -x : x;
        });
    }
    else {
      this.arrowsGroup.children
        .filter(o => o.type === 'Mesh')
        .forEach((arrow) => {
          arrow.rotation.x = 0;
        });
    }
  }

  /**
   * @summary Manage the preload of the linked panoramas
   * @param {PSV.plugins.VirtualTourPlugin.Node} node
   * @private
   */
  __preload(node) {
    if (!this.config.preload || !this.isServerSide()) {
      return;
    }

    this.preload[node.id] = true;

    this.prop.currentNode.links
      .filter(link => !this.preload[link.nodeId])
      .filter((link) => {
        if (typeof this.config.preload === 'function') {
          return this.config.preload(this.prop.currentNode, link);
        }
        else {
          return true;
        }
      })
      .forEach((link) => {
        this.preload[link.nodeId] = this.datasource.loadNode(link.nodeId)
          .then((linkNode) => {
            return this.psv.textureLoader.preloadPanorama(linkNode.panorama);
          })
          .then(() => {
            this.preload[link.nodeId] = true;
          })
          .catch(() => {
            delete this.preload[link.nodeId];
          });
      });
  }

  /**
   * @summary Toggles the visibility of the list of nodes
   */
  toggleNodesList() {
    if (this.psv.panel.prop.contentId === ID_PANEL_NODES_LIST) {
      this.hideNodesList();
    }
    else {
      this.showNodesList();
    }
  }

  /**
   * @summary Opens side panel with the list of nodes
   */
  showNodesList() {
    const nodes = this.change(EVENTS.RENDER_NODES_LIST, Object.values(this.datasource.nodes));

    this.psv.panel.show({
      id          : ID_PANEL_NODES_LIST,
      content     : NODES_LIST_TEMPLATE(
        nodes,
        this.psv.config.lang[NodesListButton.id],
        this.prop.currentNode?.id
      ),
      noMargin    : true,
      clickHandler: (e) => {
        const li = e.target ? utils.getClosest(e.target, 'li') : undefined;
        const nodeId = li ? li.dataset.nodeId : undefined;

        if (nodeId) {
          this.setCurrentNode(nodeId);
          this.hideNodesList();
        }
      },
    });
  }

  /**
   * @summary Closes side panel if it contains the list of nodes
   */
  hideNodesList() {
    this.psv.panel.hide(ID_PANEL_NODES_LIST);
  }

}
