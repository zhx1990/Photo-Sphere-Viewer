/**
 * Viewer class
 * @param args (Object) Viewer settings
 * - panorama (string) Panorama URL or path (absolute or relative)
 * - container (HTMLElement) Panorama container (should be a div or equivalent)
 * - autoload (boolean) (optional) (true) true to automatically load the panorama, false to load it later (with the .load() method)
 * - usexmpdata (boolean) (optional) (true) true if Photo Sphere Viewer must read XMP data, false if it is not necessary
 * - min_fov (number) (optional) (30) The minimal field of view, in degrees, between 1 and 179
 * - max_fov (number) (optional) (90) The maximal field of view, in degrees, between 1 and 179
 * - default_fov (number) (optional) (max_fov) The default field of view, in degrees, between min_fov and max_fov
 * - default_long (number) (optional) (0) The default longitude, in radians, between 0 and 2xPI
 * - default_lat (number) (optional) (0) The default latitude, in radians, between -PI/2 and PI/2
 * - long_offset (number) (optional) (PI/360) The longitude to travel per pixel moved by mouse/touch
 * - lat_offset (number) (optional) (PI/180) The latitude to travel per pixel moved by mouse/touch
 * - time_anim (integer) (optional) (2000) Delay before automatically animating the panorama in milliseconds, false to not animate
 * - anim_speed (string) (optional) (2rpm) Animation speed in radians/degrees/revolutions per second/minute
 * - navbar (boolean) (optional) (false) Display the navigation bar if set to true
 * - loading_img (string) (optional) (null) Loading image URL or path (absolute or relative)
 * - size (Object) (optional) (null) Final size of the panorama container (e.g. {width: 500, height: 300})
 */
var PhotoSphereViewer = function(options) {
  if (options === undefined || options.panorama === undefined || options.container === undefined) {
    throw 'PhotoSphereViewer: no value given for panorama or container';
  }

  this.config = PSVUtils.deepmerge(PhotoSphereViewer.DEFAULTS, options);

  this.config.min_fov = PSVUtils.stayBetween(this.config.min_fov, 1, 179);
  this.config.max_fov = PSVUtils.stayBetween(this.config.max_fov, 1, 179);
  if (this.config.default_fov === null) this.config.default_fov = this.config.max_fov;
  else this.config.default_fov = PSVUtils.stayBetween(this.config.default_fov, this.config.min_fov, this.config.max_fov);

  this.container = this.config.container;
  this.navbar = null;
  this.root = null;
  this.canvas_container = null;
  this.renderer = null;
  this.scene = null;
  this.camera = null;

  this.prop = {
    fps: 60,
    size: null,
    phi: 0,
    theta: 0,
    theta_offset: 0,
    zoom_lvl: 0,
    mousedown: false,
    mouse_x: 0,
    mouse_y: 0,
    autorotate_timeout: null,
    anim_timeout: null,
  };

  this.prop.zoom_lvl = Math.round((this.config.default_fov - this.config.min_fov) / (this.config.max_fov - this.config.min_fov) * 100);
  this.prop.zoom_lvl-= 2* (this.prop.zoom_lvl - 50);

  this.actions = {};

  this.setAnimSpeed(this.config.anim_speed);

  this.rotate(this.config.default_long, this.config.default_lat);

  if (this.config.size !== null)
    this._setViewerSize(this.config.size);

  if (this.config.autoload)
    this.load();
};

PhotoSphereViewer.DEFAULTS = {
  panorama: null,
  container: null,
  autoload: true,
  usexmpdata: true,
  min_fov: 30,
  max_fov: 90,
  default_fov: null,
  default_long: 0,
  default_lat: 0,
  long_offset: Math.PI / 360.0,
  lat_offset: Math.PI / 180.0,
  time_anim: 2000,
  anim_speed: '2rpm',
  navbar: false,
  loading_img: null,
  size: null
};

/**
 * Starts to load the panorama
 * @return (void)
 */
PhotoSphereViewer.prototype.load = function() {
  // Loading indicator (text or image if given)
  if (!!this.config.loading_img) {
    var loading = document.createElement('img');
    loading.setAttribute('src', this.config.loading_img);
    loading.setAttribute('alt', 'Loading...');
    this.container.appendChild(loading);
  }
  else
    this.container.textContent = 'Loading...';

  // Adds a new container
  this.root = document.createElement('div');
  this.root.className = 'psv-container';

  // Is canvas supported?
  if (!PSVUtils.isCanvasSupported()) {
    this.container.textContent = 'Canvas is not supported, update your browser!';
    return;
  }

  // Canvas container
  this.canvas_container = document.createElement('div');
  this.canvas_container.className = 'psv-canvas';
  this.root.appendChild(this.canvas_container);

  // Navigation bar?
  if (this.config.navbar) {
    this.navbar = new PSVNavBar(this);
    this.root.appendChild(this.navbar.getBar());
  }

  // Adding events
  PSVUtils.addEvent(window, 'resize', this._onResize.bind(this));
  PSVUtils.addEvent(this.canvas_container, 'mousedown', this._onMouseDown.bind(this));
  PSVUtils.addEvent(this.canvas_container, 'touchstart', this._onTouchStart.bind(this));
  PSVUtils.addEvent(document, 'mouseup', this._onMouseUp.bind(this));
  PSVUtils.addEvent(document, 'touchend', this._onMouseUp.bind(this));
  PSVUtils.addEvent(document, 'mousemove', this._onMouseMove.bind(this));
  PSVUtils.addEvent(document, 'touchmove', this._onTouchMove.bind(this));
  PSVUtils.addEvent(this.canvas_container, 'mousewheel', this._onMouseWheel.bind(this));
  PSVUtils.addEvent(this.canvas_container, 'DOMMouseScroll', this._onMouseWheel.bind(this));
  PSVUtils.addEvent(document, 'fullscreenchange', this._fullscreenToggled.bind(this));
  PSVUtils.addEvent(document, 'mozfullscreenchange', this._fullscreenToggled.bind(this));
  PSVUtils.addEvent(document, 'webkitfullscreenchange', this._fullscreenToggled.bind(this));
  PSVUtils.addEvent(document, 'MSFullscreenChange', this._fullscreenToggled.bind(this));

  // First render
  this.container.innerHTML = '';
  this.container.appendChild(this.root);

  // Current viewer size
  this.prop.size = {
    width: 0,
    height: 0,
    ratio: 0
  };

  // XMP data?
  if (this.config.usexmpdata)
    this._loadXMP();

  else
    this._createBuffer(false);
};

/**
 * Loads the XMP data with AJAX
 * @return (void)
 */
PhotoSphereViewer.prototype._loadXMP = function() {
  var xhr = null;
  var self = this;

  if (window.XMLHttpRequest)
    xhr = new XMLHttpRequest();

  else if (window.ActiveXObject) {
    try {
      xhr = new ActiveXObject('Msxml2.XMLHTTP');
    }
    catch (e) {
      xhr = new ActiveXObject('Microsoft.XMLHTTP');
    }
  }

  else {
    this.container.textContent = 'XHR is not supported, update your browser!';
    return;
  }

  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4 && xhr.status == 200) {
      // Metadata
      var binary = xhr.responseText;
      var a = binary.indexOf('<x:xmpmeta'), b = binary.indexOf('</x:xmpmeta>');
      var data = binary.substring(a, b);

      // No data retrieved
      if (a == -1 || b == -1 || data.indexOf('GPano:') == -1) {
        self._createBuffer(false);
        return;
      }

      // Useful values
      var pano_data = {
          full_width: parseInt(PSVUtils.getAttribute(data, 'FullPanoWidthPixels')),
          full_height: parseInt(PSVUtils.getAttribute(data, 'FullPanoHeightPixels')),
          cropped_width: parseInt(PSVUtils.getAttribute(data, 'CroppedAreaImageWidthPixels')),
          cropped_height: parseInt(PSVUtils.getAttribute(data, 'CroppedAreaImageHeightPixels')),
          cropped_x: parseInt(PSVUtils.getAttribute(data, 'CroppedAreaLeftPixels')),
          cropped_y: parseInt(PSVUtils.getAttribute(data, 'CroppedAreaTopPixels')),
        };

      self._createBuffer(pano_data);
    }
  };

  xhr.open('GET', this.config.panorama, true);
  xhr.send(null);
};

/**
 * Creates an image in the right dimensions
 * @param pano_data (mixed) An object containing the panorama XMP data (false if it there is not)
 * @return (void)
 */
PhotoSphereViewer.prototype._createBuffer = function(pano_data) {
  var img = new Image();
  var self = this;

  img.onload = function() {
    // No XMP data?
    if (!pano_data) {
      pano_data = {
        full_width: img.width,
        full_height: img.height,
        cropped_width: img.width,
        cropped_height: img.height,
        cropped_x: 0,
        cropped_y: 0,
      };
    }

    // Size limit for mobile compatibility
    var max_width = 2048;
    if (PSVUtils.isWebGLSupported()) {
      max_width = PSVUtils.getMaxTextureWidth();
    }

    // Buffer width (not too big)
    var new_width = Math.min(pano_data.full_width, max_width);
    var r = new_width / pano_data.full_width;

    pano_data.full_width = new_width;
    pano_data.cropped_width *= r;
    pano_data.cropped_x *= r;
    img.width = pano_data.cropped_width;

    // Buffer height (proportional to the width)
    pano_data.full_height *= r;
    pano_data.cropped_height *= r;
    pano_data.cropped_y *= r;
    img.height = pano_data.cropped_height;

    // Buffer creation
    var buffer = document.createElement('canvas');
    buffer.width = pano_data.full_width;
    buffer.height = pano_data.full_height;

    var ctx = buffer.getContext('2d');
    ctx.drawImage(img, pano_data.cropped_x, pano_data.cropped_y, pano_data.cropped_width, pano_data.cropped_height);

    self._loadTexture(buffer.toDataURL('image/jpeg'));
  };

  // CORS when the panorama is not given as a base64 string
  if (!this.config.panorama.match(/^data:image\/[a-z]+;base64/))
    img.setAttribute('crossOrigin', 'anonymous');

  img.src = this.config.panorama;
};

/**
 * Loads the sphere texture
 * @param path (URL) Path to the panorama
 * @return (void)
 */
PhotoSphereViewer.prototype._loadTexture = function(path) {
  var texture = new THREE.Texture();
  var loader = new THREE.ImageLoader();
  var self = this;

  var onLoad = function(img) {
    texture.needsUpdate = true;
    texture.image = img;

    self._createScene(texture);
  };

  loader.load(path, onLoad);
};

/**
 * Creates the 3D scene
 * @param texture (THREE.Texture) The sphere texture
 * @return (void)
 */
PhotoSphereViewer.prototype._createScene = function(texture) {
  this._onResize();

  // The chosen renderer depends on whether WebGL is supported or not
  this.renderer = (PSVUtils.isWebGLSupported()) ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
  this.renderer.setSize(this.prop.size.width, this.prop.size.height);

  this.scene = new THREE.Scene();

  this.camera = new THREE.PerspectiveCamera(this.config.default_fov, this.prop.size.ratio, 1, 300);
  this.camera.position.set(0, 0, 0);
  this.scene.add(this.camera);

  // Sphere
  var geometry = new THREE.SphereGeometry(200, 32, 32);
  var material = new THREE.MeshBasicMaterial({map: texture, overdraw: true});
  var mesh = new THREE.Mesh(geometry, material);
  mesh.scale.x = -1;
  this.scene.add(mesh);

  this.canvas_container.appendChild(this.renderer.domElement);

  // Animation?
  if (this.config.time_anim !== false)
    this.prop.anim_timeout = setTimeout(this.startAutorotate.bind(this), this.config.time_anim);

  this.trigger('ready');

  this.render();
};

/**
 * Renders an image
 * @return (void)
 */
PhotoSphereViewer.prototype.render = function() {
  var point = new THREE.Vector3();
  point.setX(Math.cos(this.prop.phi) * Math.sin(this.prop.theta));
  point.setY(Math.sin(this.prop.phi));
  point.setZ(Math.cos(this.prop.phi) * Math.cos(this.prop.theta));

  this.camera.lookAt(point);
  this.renderer.render(this.scene, this.camera);
};

/**
 * Automatically rotates the panorama
 * @return (void)
 */
PhotoSphereViewer.prototype._autorotate = function() {
  // Rotates the sphere && Returns to the equator (phi = 0)
  this.rotate(
    this.prop.theta + this.prop.theta_offset - Math.floor(this.prop.theta / (2.0 * Math.PI)) * 2.0 * Math.PI,
    this.prop.phi - this.prop.phi / 200
  );

  this.prop.autorotate_timeout = setTimeout(this._autorotate.bind(this), 1000 / this.prop.fps);
};

/**
 * Starts the autorotate animation
 * @return (void)
 */
PhotoSphereViewer.prototype.startAutorotate = function() {
  this._autorotate();
  this.trigger('autorotate', true);
};

/**
 * Stops the autorotate animation
 * @return (void)
 */
PhotoSphereViewer.prototype.stopAutorotate = function() {
  clearTimeout(this.prop.anim_timeout);
  this.prop.anim_timeout = null;

  clearTimeout(this.prop.autorotate_timeout);
  this.prop.autorotate_timeout = null;

  this.trigger('autorotate', false);
};

/**
 * Launches/stops the autorotate animation
 * @return (void)
 */
PhotoSphereViewer.prototype.toggleAutorotate = function() {
  clearTimeout(this.prop.anim_timeout);

  if (!!this.prop.autorotate_timeout)
    this.stopAutorotate();

  else
    this.startAutorotate();
};

/**
 * Resizes the canvas when the window is resized
 * @return (void)
 */
PhotoSphereViewer.prototype._onResize = function() {
  if (this.container.clientWidth != this.prop.size.width || this.container.clientHeight != this.prop.size.height) {
    this.resize(this.container.clientWidth, this.container.clientHeight);
  }
};

/**
 * Resizes the canvas
 * @param width (integer) The new canvas width
 * @param height (integer) The new canvas height
 * @return (void)
 */
PhotoSphereViewer.prototype.resize = function (width, height) {
  this.prop.size.width = parseInt(width);
  this.prop.size.height = parseInt(height);
  this.prop.size.ratio = this.prop.size.width / this.prop.size.height;

  if (!!this.camera) {
    this.camera.aspect = this.prop.size.ratio;
    this.camera.updateProjectionMatrix();
  }

  if (!!this.renderer) {
    this.renderer.setSize(this.prop.size.width, this.prop.size.height);
    this.render();
  }

  this.trigger('size-updated', this.prop.size.width, this.prop.size.height);
};

/**
 * The user wants to move
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onMouseDown = function(evt) {
  this._startMove(parseInt(evt.clientX), parseInt(evt.clientY));
};

/**
 * The user wants to move (mobile version)
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onTouchStart = function(evt) {
  var touch = evt.changedTouches[0];
  if (touch.target.parentNode == this.canvas_container)
    this._startMove(parseInt(touch.clientX), parseInt(touch.clientY));
};

/**
 * Initializes the movement
 * @param x (integer) Horizontal coordinate
 * @param y (integer) Vertical coordinate
 * @return (void)
 */
PhotoSphereViewer.prototype._startMove = function(x, y) {
  this.prop.mouse_x = x;
  this.prop.mouse_y = y;

  this.stopAutorotate();

  this.prop.mousedown = true;
};

/**
 * The user wants to stop moving
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onMouseUp = function(evt) {
  this.prop.mousedown = false;
};

/**
 * The user moves the image
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onMouseMove = function(evt) {
  evt.preventDefault();
  this._move(parseInt(evt.clientX), parseInt(evt.clientY));
};

/**
 * The user moves the image (mobile version)
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onTouchMove = function(evt) {
  var touch = evt.changedTouches[0];
  if (touch.target.parentNode == this.canvas_container) {
    evt.preventDefault();
    this._move(parseInt(touch.clientX), parseInt(touch.clientY));
  }
};

/**
 * Movement
 * @param x (integer) Horizontal coordinate
 * @param y (integer) Vertical coordinate
 * @return (void)
 */
PhotoSphereViewer.prototype._move = function(x, y) {
  if (this.prop.mousedown) {
    this.rotate(
      this.prop.theta + (x - this.prop.mouse_x) * this.config.long_offset,
      this.prop.phi + (y - this.prop.mouse_y) * this.config.lat_offset
    );

    this.prop.mouse_x = x;
    this.prop.mouse_y = y;
  }
};

/**
 * Rotate the camera
 * @param x (integer) Horizontal angle (rad)
 * @param y (integer) Vertical angle (rad)
 * @return (void)
 */
PhotoSphereViewer.prototype.rotate = function(t, p) {
  this.prop.theta = t;
  this.prop.phi = PSVUtils.stayBetween(p, -Math.PI / 2.0, Math.PI / 2.0);

  if (this.renderer)
    this.render();

  this.trigger('position-updated', this.prop.theta, this.prop.phi);
};

/**
 * The user wants to zoom
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onMouseWheel = function(evt) {
  evt.preventDefault();
  evt.stopPropagation();

  var delta = (evt.detail) ? -evt.detail : evt.wheelDelta;

  if (delta !== 0) {
    var direction = parseInt(delta / Math.abs(delta));
    this.zoom(this.prop.zoom_lvl + direction);
  }
};

/**
 * Zoom
 * @paramlevel (integer) New zoom level
 * @return (void)
 */
PhotoSphereViewer.prototype.zoom = function(level) {
  this.prop.zoom_lvl = PSVUtils.stayBetween(parseInt(Math.round(level)), 0, 100);

  this.camera.fov = this.config.max_fov + (this.prop.zoom_lvl / 100) * (this.config.min_fov - this.config.max_fov);
  this.camera.updateProjectionMatrix();
  this.render();

  this.trigger('zoom-updated', this.prop.zoom_lvl);
};

/**
 * Zoom in
 * @return (void)
 */
PhotoSphereViewer.prototype.zoomIn = function() {
  if (this.prop.zoom_lvl < 100)
    this.zoom(this.prop.zoom_lvl + 1);
};

/**
 * Zoom out
 * @return (void)
 */
PhotoSphereViewer.prototype.zoomOut = function() {
  if (this.prop.zoom_lvl > 0)
    this.zoom(this.prop.zoom_lvl - 1);
};

/**
 * Fullscreen state has changed
 * @return (void)
 */
PhotoSphereViewer.prototype._fullscreenToggled = function() {
  this.trigger('fullscreen-updated', PSVUtils.isFullscreenEnabled());
};

/**
 * Enables/disables fullscreen
 * @return (void)
 */
PhotoSphereViewer.prototype.toggleFullscreen = function() {
  // Switches to fullscreen mode
  if (!PSVUtils.isFullscreenEnabled()) {
    if (!!this.container.requestFullscreen)
      this.container.requestFullscreen();

    else if (!!this.container.mozRequestFullScreen)
      this.container.mozRequestFullScreen();

    else if (!!this.container.webkitRequestFullscreen)
      this.container.webkitRequestFullscreen();

    else if (!!this.container.msRequestFullscreen)
      this.container.msRequestFullscreen();
  }

  // Switches to windowed mode
  else {
    if (!!document.exitFullscreen)
      document.exitFullscreen();

    else if (!!document.mozCancelFullScreen)
      document.mozCancelFullScreen();

    else if (!!document.webkitExitFullscreen)
      document.webkitExitFullscreen();

    else if (!!document.msExitFullscreen)
      document.msExitFullscreen();
  }
};

/**
 * Sets the animation speed
 * @param speed (string) The speed, in radians/degrees/revolutions per second/minute
 * @return (void)
 */
PhotoSphereViewer.prototype.setAnimSpeed = function(speed) {
  speed = speed.toString().trim();

  // Speed extraction
  var speed_value = parseFloat(speed.replace(/^(-?[0-9]+(?:\.[0-9]*)?).*$/, '$1'));
  var speed_unit = speed.replace(/^-?[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim();

  // "per minute" -> "per second"
  if (speed_unit.match(/(pm|per minute)$/))
    speed_value /= 60;

  var rad_per_second = 0;

  // Which unit?
  switch (speed_unit) {
    // Revolutions per minute / second
    case 'rpm':
    case 'rev per minute':
    case 'revolutions per minute':
    case 'rps':
    case 'rev per second':
    case 'revolutions per second':
      // speed * 2pi
      rad_per_second = speed_value * 2 * Math.PI;
      break;

    // Degrees per minute / second
    case 'dpm':
    case 'deg per minute':
    case 'degrees per minute':
    case 'dps':
    case 'deg per second':
    case 'degrees per second':
      // Degrees to radians (rad = deg * pi / 180)
      rad_per_second = speed_value * Math.PI / 180;
      break;

    // Radians per minute / second
    case 'rad per minute':
    case 'radians per minute':
    case 'rad per second':
    case 'radians per second':
      rad_per_second = speed_value;
      break;

    // Unknown unit
    default:
      m_anim = false;
  }

  // Theta offset
  this.prop.theta_offset = rad_per_second / this.prop.fps;
};

/**
 * Sets the viewer size
 * @param size (Object) An object containing the wanted width and height
 * @return (void)
 */
PhotoSphereViewer.prototype._setViewerSize = function(size) {
  // Checks all the values
  for (var dim in size) {
    // Only width and height matter
    if (dim == 'width' || dim == 'height') {
      // Size extraction
      var size_str = size[dim].toString().trim();

      var size_value = parseFloat(size_str.replace(/^([0-9]+(?:\.[0-9]*)?).*$/, '$1'));
      var size_unit = size_str.replace(/^[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim();

      // Only percentages and pixels are allowed
      if (size_unit != '%')
        size_unit = 'px';

      // We're good
      this.container.style[dim] = size_value + size_unit;
    }
  }
};

/**
 * Adds an action
 * @param name (string) Action name
 * @param f (Function) The handler function
 * @return (void)
 */
PhotoSphereViewer.prototype.on = function(name, f) {
  // New action?
  if (!(name in this.actions))
    this.actions[name] = [];

  this.actions[name].push(f);
};

/**
 * Triggers an action
 * @param name (string) Action name
 * @param arg (mixed) An argument to send to the handler functions
 * @return (void)
 */
PhotoSphereViewer.prototype.trigger = function(name, arg) {
  // Does the action have any function?
  if ((name in this.actions) && this.actions[name].length > 0) {
    for (var i = 0, l = this.actions[name].length; i < l; ++i)
      this.actions[name][i](arg);
  }
};