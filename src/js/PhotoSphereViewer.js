/**
 * @typedef {Object} Point
 * @property {int} x
 * @property {int} y
 */

/**
 * @typedef {Object} Size
 * @property {int} width
 * @property {int} height
 */

/**
 * @typedef {Object} Position
 * @property {float} longitude
 * @property {float} latitude
 */

/**
 * A position that can be expressed either in spherical coordinates (radians or degrees) or in texture coordinates (pixels)
 * @typedef {Object} ExtendedPosition
 * @property {float} longitude
 * @property {float} latitude
 * @property {int} x
 * @property {int} y
 */

/**
 * @typedef {Object} CacheItem
 * @property {string} panorama
 * @property {THREE.Texture} image
 * @property {PanoData} pano_data
 */

/**
 * @typedef {Object} PanoData
 * @property {int} full_width
 * @property {int} full_height
 * @property {int} cropped_width
 * @property {int} cropped_height
 * @property {int} cropped_x
 * @property {int} cropped_y
 */

/**
 * Viewer class
 * @param {Object} options see {@link http://photo-sphere-viewer.js.org/#options}
 * @constructor
 */
function PhotoSphereViewer(options) {
  if (!(this instanceof PhotoSphereViewer)) {
    return new PhotoSphereViewer(options);
  }

  if (!PhotoSphereViewer.SYSTEM.loaded) {
    PhotoSphereViewer._loadSystem();
  }

  /**
   * Configuration object
   * @member {Object}
   * @readonly
   */
  this.config = PSVUtils.clone(PhotoSphereViewer.DEFAULTS);
  PSVUtils.deepmerge(this.config, options);

  // check system and config
  if (!options.container) {
    throw new PSVError('No value given for container.');
  }

  if (!PhotoSphereViewer.SYSTEM.isCanvasSupported) {
    throw new PSVError('Canvas is not supported.');
  }

  if ((!PhotoSphereViewer.SYSTEM.isWebGLSupported || !this.config.webgl) && !PSVUtils.checkTHREE('CanvasRenderer', 'Projector')) {
    throw new PSVError('Missing Three.js components: CanvasRenderer, Projector. Get them from three.js-examples package.');
  }

  if (this.config.transition && this.config.transition.blur) {
    if (!PhotoSphereViewer.SYSTEM.isWebGLSupported || !this.config.webgl) {
      this.config.transition.blur = false;
      console.warn('PhotoSphereViewer: Using canvas rendering, blur transition disabled.');
    }
    else if (!PSVUtils.checkTHREE('EffectComposer', 'RenderPass', 'ShaderPass', 'MaskPass', 'CopyShader')) {
      throw new PSVError('Missing Three.js components: EffectComposer, RenderPass, ShaderPass, MaskPass, CopyShader. Get them from three.js-examples package.');
    }
  }

  if (this.config.longitude_range && this.config.longitude_range.length !== 2) {
    this.config.longitude_range = null;
    console.warn('PhotoSphereViewer: longitude_range must have exactly two elements.');
  }

  if (this.config.latitude_range) {
    if (this.config.latitude_range.length !== 2) {
      this.config.latitude_range = null;
      console.warn('PhotoSphereViewer: latitude_range must have exactly two elements.');
    }
    else if (this.config.latitude_range[0] > this.config.latitude_range[1]) {
      this.config.latitude_range = [this.config.latitude_range[1], this.config.latitude_range[0]];
      console.warn('PhotoSphereViewer: latitude_range values must be ordered.');
    }
  }
  else if (this.config.tilt_up_max !== undefined || this.config.tilt_down_max !== undefined) {
    this.config.latitude_range = [
      this.config.tilt_down_max !== undefined ? this.config.tilt_down_max - Math.PI / 4 : -PSVUtils.HalfPI,
      this.config.tilt_up_max !== undefined ? this.config.tilt_up_max + Math.PI / 4 : PSVUtils.HalfPI
    ];
    console.warn('PhotoSphereViewer: tilt_up_max and tilt_down_max are deprecated, use latitude_range instead.');
  }

  if (this.config.max_fov < this.config.min_fov) {
    this.config.max_fov = PhotoSphereViewer.DEFAULTS.max_fov;
    this.config.min_fov = PhotoSphereViewer.DEFAULTS.min_fov;
    console.warn('PhotoSphereViewer: max_fov cannot be lower than min_fov.');
  }

  if (this.config.cache_texture && (!PSVUtils.isInteger(this.config.cache_texture) || this.config.cache_texture < 0)) {
    this.config.cache_texture = PhotoSphereViewer.DEFAULTS.cache_texture;
    console.warn('PhotoSphreViewer: invalid valud for cache_texture');
  }

  // normalize config
  this.config.min_fov = PSVUtils.bound(this.config.min_fov, 1, 179);
  this.config.max_fov = PSVUtils.bound(this.config.max_fov, 1, 179);
  if (this.config.default_fov === null) {
    this.config.default_fov = this.config.max_fov / 2 + this.config.min_fov / 2;
  }
  else {
    this.config.default_fov = PSVUtils.bound(this.config.default_fov, this.config.min_fov, this.config.max_fov);
  }
  this.config.default_long = PSVUtils.parseAngle(this.config.default_long);
  this.config.default_lat = PSVUtils.bound(PSVUtils.parseAngle(this.config.default_lat, -Math.PI), -PSVUtils.HalfPI, PSVUtils.HalfPI);
  if (this.config.anim_lat === null) {
    this.config.anim_lat = this.config.default_lat;
  }
  else {
    this.config.anim_lat = PSVUtils.bound(PSVUtils.parseAngle(this.config.anim_lat, -Math.PI), -PSVUtils.HalfPI, PSVUtils.HalfPI);
  }
  this.config.anim_speed = PSVUtils.parseSpeed(this.config.anim_speed);
  if (this.config.caption && !this.config.navbar) {
    this.config.navbar = ['caption'];
  }
  if (this.config.longitude_range) {
    this.config.longitude_range = this.config.longitude_range.map(function(angle) {
      return PSVUtils.parseAngle(angle);
    });
  }
  if (this.config.latitude_range) {
    this.config.latitude_range = this.config.latitude_range.map(function(angle) {
      return PSVUtils.bound(PSVUtils.parseAngle(angle, -Math.PI), -PSVUtils.HalfPI, PSVUtils.HalfPI);
    });
  }
  if (this.config.fisheye === true) {
    this.config.fisheye = 1;
  }
  else if (this.config.fisheye === false) {
    this.config.fisheye = 0;
  }

  /**
   * Top most parent
   * @member {HTMLElement}
   * @readonly
   */
  this.parent = (typeof options.container == 'string') ? document.getElementById(options.container) : options.container;

  /**
   * Main container
   * @member {HTMLElement}
   * @readonly
   */
  this.container = null;

  /**
   * @member {PSVLoader}
   * @readonly
   */
  this.loader = null;

  /**
   * @member {PSVNavBar}
   * @readonly
   */
  this.navbar = null;

  /**
   * @member {PSVHUD}
   * @readonly
   */
  this.hud = null;

  /**
   * @member {PSVPanel}
   * @readonly
   */
  this.panel = null;

  /**
   * @member {PSVTooltip}
   * @readonly
   */
  this.tooltip = null;

  /**
   * @member {HTMLElement}
   * @readonly
   */
  this.canvas_container = null;

  /**
   * @member {THREE.WebGLRenderer | THREE.CanvasRenderer}
   * @readonly
   */
  this.renderer = null;

  /**
   * @member {THREE.EffectComposer}
   * @readonly
   */
  this.composer = null;

  /**
   * @member {Object.<string, THREE.Pass>}
   * @readonly
   */
  this.passes = {};

  /**
   * @member {THREE.Scene}
   * @readonly
   */
  this.scene = null;

  /**
   * @member {THREE.PerspectiveCamera}
   * @readonly
   */
  this.camera = null;

  /**
   * @member {THREE.Mesh}
   * @readonly
   */
  this.mesh = null;

  /**
   * @member {THREE.Raycaster}
   * @readonly
   */
  this.raycaster = null;

  /**
   * @member {THREE.DeviceOrientationControls}
   * @readonly
   */
  this.doControls = null;

  /**
   * Internal properties, must not be modified externally
   * @member {Object}
   * @property {float} longitude - current longitude of the center
   * @property {float} longitude - current latitude of the center
   * @property {THREE.Vector3} direction - direction of the camera
   * @property {float} anim_speed - parsed animation speed (rad/sec)
   * @property {int} zoom_lvl - current zoom level
   * @property {float} vFov - vertical FOV
   * @property {float} hFov - horizontal FOV
   * @property {float} aspect - viewer aspect ratio
   * @property {float} move_speed - move speed (computed with pixel ratio and configuration move_speed)
   * @property {boolean} moving - is the user moving
   * @property {boolean} zooming - is the user zooming
   * @property {int} start_mouse_x - start x position of the click/touch
   * @property {int} start_mouse_y - start y position of the click/touch
   * @property {int} mouse_x - current x position of the cursor
   * @property {int} mouse_y - current y position of the cursor
   * @property {Array[]} mouse_history - list of latest positions of the cursor, [time, x, y]
   * @property {int} pinch_dist - distance between fingers when zooming
   * @property orientation_reqid - animationRequest id of the device orientation
   * @property autorotate_reqid - animationRequest id of the automatic rotation
   * @property {Promise} animation_promise - promise of the current animation (either go to position or image transition)
   * @property {Promise} loading_promise - promise of the setPanorama method
   * @property start_timeout - timeout id of the automatic rotation delay
   * @propery {CacheItem[]} cache - cached panoramas
   * @propery {Size} size - size of the container
   * @property {PanoData} pano_data - panorama metadata
   */
  this.prop = {
    longitude: 0,
    latitude: 0,
    direction: null,
    anim_speed: 0,
    zoom_lvl: 0,
    vFov: 0,
    hFov: 0,
    aspect: 0,
    move_speed: 0.1,
    moving: false,
    zooming: false,
    start_mouse_x: 0,
    start_mouse_y: 0,
    mouse_x: 0,
    mouse_y: 0,
    mouse_history: [],
    pinch_dist: 0,
    orientation_reqid: null,
    autorotate_reqid: null,
    animation_promise: null,
    loading_promise: null,
    start_timeout: null,
    cache: [],
    size: {
      width: 0,
      height: 0
    },
    pano_data: {
      full_width: 0,
      full_height: 0,
      cropped_width: 0,
      cropped_height: 0,
      cropped_x: 0,
      cropped_y: 0
    }
  };

  // init templates
  Object.keys(PhotoSphereViewer.TEMPLATES).forEach(function(tpl) {
    if (!this.config.templates[tpl]) {
      this.config.templates[tpl] = PhotoSphereViewer.TEMPLATES[tpl];
    }
    if (typeof this.config.templates[tpl] == 'string') {
      this.config.templates[tpl] = doT.template(this.config.templates[tpl]);
    }
  }, this);

  // create actual container
  this.container = document.createElement('div');
  this.container.classList.add('psv-container');
  this.parent.appendChild(this.container);

  // apply config
  if (this.config.size !== null) {
    this._setViewerSize(this.config.size);
  }

  this._onResize();

  var tempZoom = Math.round((this.config.default_fov - this.config.min_fov) / (this.config.max_fov - this.config.min_fov) * 100);
  this.zoom(tempZoom - 2 * (tempZoom - 50), false);

  this.prop.move_speed = 1 / PhotoSphereViewer.SYSTEM.pixelRatio * Math.PI / 180 * this.config.move_speed;

  this.rotate({
    longitude: this.config.default_long,
    latitude: this.config.default_lat
  }, false);

  // load components
  if (this.config.navbar) {
    this.container.classList.add('psv-container--has-navbar');
    this.navbar = new PSVNavBar(this);
    this.navbar.hide();
  }

  this.hud = new PSVHUD(this);
  this.hud.hide();

  this.panel = new PSVPanel(this);

  this.tooltip = new PSVTooltip(this.hud);

  // init
  this.parent.photoSphereViewer = this;

  this._bindEvents();

  if (this.config.autoload) {
    this.load();
  }

  // enable GUI after first render
  this.once('render', function() {
    if (this.config.navbar) {
      this.navbar.show();
    }

    this.hud.show();

    if (this.config.markers) {
      this.config.markers.forEach(function(marker) {
        this.hud.addMarker(marker, false);
      }, this);

      this.hud.updatePositions();
    }

    this.trigger('ready');
  }.bind(this));
}

uEvent.mixin(PhotoSphereViewer);
