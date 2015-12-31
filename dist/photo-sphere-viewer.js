/*!
 * Photo Sphere Viewer 3.0.1
 * Copyright (c) 2014-2015 Jérémy Heleine
 * Copyright (c) 2015 Damien "Mistic" Sorel
 * Licensed under MIT (http://opensource.org/licenses/MIT)
 */

(function(root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['three'], factory);
    }
    else {
        root.PhotoSphereViewer = factory(root.THREE);
    }
}(this, function(THREE) {
"use strict";

/**
 * Viewer class
 * @param options (Object) Viewer settings
 */
function PhotoSphereViewer(options) {
  if (!(this instanceof PhotoSphereViewer)) {
    return new PhotoSphereViewer(options);
  }

  if (options === undefined || options.panorama === undefined || options.container === undefined) {
    throw new PSVError('no value given for panorama or container');
  }

  this.config = PSVUtils.deepmerge(PhotoSphereViewer.DEFAULTS, options);

  // normalize config
  this.config.min_fov = PSVUtils.stayBetween(this.config.min_fov, 1, 179);
  this.config.max_fov = PSVUtils.stayBetween(this.config.max_fov, 1, 179);
  this.config.tilt_up_max = PSVUtils.stayBetween(this.config.tilt_up_max, -PhotoSphereViewer.HalfPI, PhotoSphereViewer.HalfPI);
  this.config.tilt_down_max = PSVUtils.stayBetween(this.config.tilt_down_max, -PhotoSphereViewer.HalfPI, PhotoSphereViewer.HalfPI);
  if (this.config.default_fov === null) {
    this.config.default_fov = this.config.max_fov;
  }
  else {
    this.config.default_fov = PSVUtils.stayBetween(this.config.default_fov, this.config.min_fov, this.config.max_fov);
  }
  if (this.config.anim_lat === null) {
    this.config.anim_lat = this.config.default_lat;
  }
  this.config.anim_lat = PSVUtils.stayBetween(this.config.anim_lat, -PhotoSphereViewer.HalfPI, PhotoSphereViewer.HalfPI);
  
  if (this.config.tilt_up_max < this.config.tilt_down_max) {
    throw new PSVError('tilt_up_max cannot be lower than tilt_down_max');
  }

  // references to components
  this.container = (typeof this.config.container == 'string') ? document.getElementById(this.config.container) : this.config.container;
  this.loader = null;
  this.navbar = null;
  this.hud = null;
  this.panel = null;
  this.tooltip = null;
  this.canvas_container = null;
  this.renderer = null;
  this.scene = null;
  this.camera = null;
  this.raycaster = null;
  this.actions = {};

  // local properties
  this.prop = {
    fps: 60,
    latitude: 0,
    longitude: 0,
    anim_speed: 0,
    zoom_lvl: 0,
    moving: false,
    zooming: false,
    start_mouse_x: 0,
    start_mouse_y: 0,
    mouse_x: 0,
    mouse_y: 0,
    pinch_dist: 0,
    direction: null,
    autorotate_timeout: null,
    animation_timeout: null,
    start_timeout: null,
    size: {
      width: 0,
      height: 0,
      ratio: 0,
      image_width: 0,
      image_height: 0
    }
  };

  // compute zoom level
  this.prop.zoom_lvl = Math.round((this.config.default_fov - this.config.min_fov) / (this.config.max_fov - this.config.min_fov) * 100);
  this.prop.zoom_lvl-= 2 * (this.prop.zoom_lvl - 50);

  // init
  this.setAnimSpeed(this.config.anim_speed);

  this.rotate(this.config.default_long, this.config.default_lat);

  if (this.config.size !== null) {
    this.container.style.width = this.config.size.width;
    this.container.style.height = this.config.size.height;
  }

  if (this.config.autoload) {
    this.load();
  }
}

PhotoSphereViewer.PI = Math.PI;
PhotoSphereViewer.TwoPI = Math.PI * 2.0;
PhotoSphereViewer.HalfPI = Math.PI / 2.0;

PhotoSphereViewer.MOVE_THRESHOLD = 4;

PhotoSphereViewer.ICONS = {};

/**
 * PhotoSphereViewer defaults
 */
PhotoSphereViewer.DEFAULTS = {
  panorama: null,
  container: null,
  caption: null,
  autoload: true,
  usexmpdata: true,
  min_fov: 30,
  max_fov: 90,
  default_fov: null,
  default_long: 0,
  default_lat: 0,
  tilt_up_max: PhotoSphereViewer.HalfPI,
  tilt_down_max: -PhotoSphereViewer.HalfPI,
  long_offset: Math.PI / 1440.0,
  lat_offset: Math.PI / 720.0,
  time_anim: 2000,
  anim_speed: '2rpm',
  anim_lat: null,
  navbar: false,
  tooltip: {
    offset: 5,
    arrow_size: 7
  },
  lang: {
    autorotate: 'Automatic rotation',
    zoom: 'Zoom',
    zoomOut: 'Zoom out',
    zoomIn: 'Zoom in',
    download: 'Download',
    fullscreen: 'Fullscreen',
    markers: 'Markers'
  },
  mousewheel: true,
  mousemove: true,
  loading_img: null,
  loading_txt: 'Loading...',
  size: null,
  markers: []
};

/**
 * Starts to load the panorama
 * @return (void)
 */
PhotoSphereViewer.prototype.load = function() {
  this.container.classList.add('psv-container', 'loading');

  // Is canvas supported?
  if (!PSVUtils.isCanvasSupported()) {
    this.container.textContent = 'Canvas is not supported, update your browser!';
    return;
  }

  // Loader
  this.loader = new PSVLoader(this);

  // Canvas container
  this.canvas_container = document.createElement('div');
  this.canvas_container.className = 'psv-canvas-container';
  this.container.appendChild(this.canvas_container);

  // load image
  if (this.config.usexmpdata) {
    this._loadXMP();
  }
  else {
    this._loadTexture(false, false);
  }
};

/**
 * Loads the XMP data with AJAX
 * @return (void)
 */
PhotoSphereViewer.prototype._loadXMP = function() {
  if (!window.XMLHttpRequest) {
    this.container.textContent = 'XHR is not supported, update your browser!';
    return;
  }

  var xhr = new XMLHttpRequest();
  var self = this;
  var progress = 0;

  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4) {
      if (xhr.status === 200 || xhr.status === 201 || xhr.status === 202 || xhr.status === 0) {
        self.loader.setProgress(100);

        var binary = xhr.responseText;
        var a = binary.indexOf('<x:xmpmeta'), b = binary.indexOf('</x:xmpmeta>');
        var data = binary.substring(a, b);

        // No data retrieved
        if (a === -1 || b === -1 || data.indexOf('GPano:') === -1) {
          self._loadTexture(false, true);
          return;
        }

        var pano_data = {
          full_width: parseInt(PSVUtils.getAttribute(data, 'FullPanoWidthPixels')),
          full_height: parseInt(PSVUtils.getAttribute(data, 'FullPanoHeightPixels')),
          cropped_width: parseInt(PSVUtils.getAttribute(data, 'CroppedAreaImageWidthPixels')),
          cropped_height: parseInt(PSVUtils.getAttribute(data, 'CroppedAreaImageHeightPixels')),
          cropped_x: parseInt(PSVUtils.getAttribute(data, 'CroppedAreaLeftPixels')),
          cropped_y: parseInt(PSVUtils.getAttribute(data, 'CroppedAreaTopPixels')),
        };

        self._loadTexture(pano_data, true);
      }
      else {
        self.container.textContent = 'Cannot load image';
      }
    }
    else if (xhr.readyState === 3) {
      self.loader.setProgress(progress + 10);
    }
  };

  xhr.onprogress = function(e) {
    if (e.lengthComputable) {
      var new_progress = parseInt(e.loaded / e.total * 100);
      if (new_progress > progress) {
        progress = new_progress;
        self.loader.setProgress(progress);
      }
    }
  };

  xhr.onerror = function() {
    self.container.textContent = 'Cannot load image';
  };

  xhr.open('GET', this.config.panorama, true);
  xhr.send(null);
};

/**
 * Loads the sphere texture
 * @param pano_data (mixed) An object containing the panorama XMP data (false if it there is not)
 * @param in_cache (boolean) If the image has already been loaded and should be in cache
 * @return (void)
 */
PhotoSphereViewer.prototype._loadTexture = function(pano_data, in_cache) {
  var loader = new THREE.ImageLoader();
  var self = this;
  var progress = in_cache ? 100 : 0;

  // CORS when the panorama is not given as a base64 string
  if (!this.config.panorama.match(/^data:image\/[a-z]+;base64/)) {
    loader.setCrossOrigin('anonymous');
  }

  var onload = function(img) {
    self.loader.setProgress(100);

    // Default XMP data
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
    var max_width = 4096;
    if (PSVUtils.isWebGLSupported()) {
      max_width = PSVUtils.getMaxTextureWidth();
    }

    var new_width = Math.min(pano_data.full_width, max_width);
    var r = new_width / pano_data.full_width;

    pano_data.full_width *= r;
    pano_data.full_height *= r;
    pano_data.cropped_width *= r;
    pano_data.cropped_height *= r;
    pano_data.cropped_x *= r;
    pano_data.cropped_y *= r;

    img.width = pano_data.cropped_width;
    img.height = pano_data.cropped_height;

    // Create buffer
    var buffer = document.createElement('canvas');
    buffer.width = pano_data.full_width;
    buffer.height = pano_data.full_height;

    var ctx = buffer.getContext('2d');
    ctx.drawImage(img, pano_data.cropped_x, pano_data.cropped_y, pano_data.cropped_width, pano_data.cropped_height);
    
    self.prop.size.image_width = pano_data.cropped_width;
    self.prop.size.image_height = pano_data.cropped_height;

    self._createScene(buffer);
  };

  var onprogress = function(e) {
    if (e.lengthComputable) {
      var new_progress = parseInt(e.loaded / e.total * 100);
      if (new_progress > progress) {
        progress = new_progress;
        self.loader.setProgress(progress);
      }
    }
  };

  var onerror = function() {
    self.container.textContent = 'Cannot load image';
  };

  loader.load(this.config.panorama, onload, onprogress, onerror);
};

/**
 * Creates the 3D scene and GUI compoents
 * @param img (Canvas) The sphere texture
 * @return (void)
 */
PhotoSphereViewer.prototype._createScene = function(img) {
  this._onResize();
  
  this.raycaster = new THREE.Raycaster();

  // Renderer depends on whether WebGL is supported or not
  this.renderer = PSVUtils.isWebGLSupported() ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();
  this.renderer.setSize(this.prop.size.width, this.prop.size.height);

  this.camera = new THREE.PerspectiveCamera(this.config.default_fov, this.prop.size.ratio, 1, 300);
  this.camera.position.set(0, 0, 0);

  this.scene = new THREE.Scene();
  this.scene.add(this.camera);

  var texture = new THREE.Texture(img);
  texture.needsUpdate = true;

  // default texture origin is at 1/4 (phiStart=0) of the panorama, I set it at 1/2 (phiStart=PI/2)
  var geometry = new THREE.SphereGeometry(200, 32, 32, -PhotoSphereViewer.HalfPI);
  var material = new THREE.MeshBasicMaterial({map: texture, overdraw: true});
  material.side = THREE.DoubleSide;
  var mesh = new THREE.Mesh(geometry, material);
  mesh.scale.x = -1;

  this.scene.add(mesh);
  this.canvas_container.appendChild(this.renderer.domElement);

  // Remove loader
  this.container.removeChild(this.loader.container);
  this.loader = null;
  this.container.classList.remove('loading');

  // Navigation bar
  if (this.config.navbar) {
    this.container.classList.add('has-navbar');
    this.navbar = new PSVNavBar(this);
    this.container.appendChild(this.navbar.container);
  }
  
  // HUD
  this.hud = new PSVHUD(this);
  this.config.markers.forEach(function(marker) {
    this.hud.addMarker(marker, true);
  }, this);
  this.container.appendChild(this.hud.container);
  
  // Panel
  this.panel = new PSVPanel(this);
  this.container.appendChild(this.panel.container);
  
  // Tooltip
  this.tooltip = new PSVTooltip(this);
  this.container.appendChild(this.tooltip.container);

  // Queue animation
  if (this.config.time_anim !== false) {
    this.prop.start_timeout = setTimeout(this.startAutorotate.bind(this), this.config.time_anim);
  }

  this._bindEvents();
  this.trigger('ready');
  this.render();
};

/**
 * Add all needed event listeners
 * @return (void)
 */
PhotoSphereViewer.prototype._bindEvents = function() {
  window.addEventListener('resize', this._onResize.bind(this));
  document.addEventListener(PSVUtils.fullscreenEvent(), this._fullscreenToggled.bind(this));
  
  // all interation events are binded to the HUD only
  if (this.config.mousemove) {
    this.hud.container.style.cursor = 'move';
    this.hud.container.addEventListener('mousedown', this._onMouseDown.bind(this));
    this.hud.container.addEventListener('touchstart', this._onTouchStart.bind(this));
    this.hud.container.addEventListener('mouseup', this._onMouseUp.bind(this));
    this.hud.container.addEventListener('touchend', this._onTouchEnd.bind(this));
    this.hud.container.addEventListener('mousemove', this._onMouseMove.bind(this));
    this.hud.container.addEventListener('touchmove', this._onTouchMove.bind(this));
  }
  
  if (this.config.mousewheel) {
    this.hud.container.addEventListener(PSVUtils.mouseWheelEvent(), this._onMouseWheel.bind(this));
  }
};

/**
 * Renders an image
 * @return (void)
 */
PhotoSphereViewer.prototype.render = function() {
  this.prop.direction = new THREE.Vector3(
    -Math.cos(this.prop.latitude) * Math.sin(this.prop.longitude),
    Math.sin(this.prop.latitude),
    Math.cos(this.prop.latitude) * Math.cos(this.prop.longitude)
  );

  this.camera.lookAt(this.prop.direction);
  this.renderer.render(this.scene, this.camera);
  this.trigger('render');
};

/**
 * Internal method for automatic infinite rotation
 * @return (void)
 */
PhotoSphereViewer.prototype._autorotate = function() {
  // Rotates the sphere && Returns to the equator (latitude = 0)
  this.rotate(
    this.prop.longitude + this.prop.anim_speed / this.prop.fps,
    this.prop.latitude - (this.prop.latitude - this.config.anim_lat) / 200
  );

  this.prop.autorotate_timeout = setTimeout(this._autorotate.bind(this), 1000 / this.prop.fps);
};

/**
 * Starts the autorotate animation
 * @return (void)
 */
PhotoSphereViewer.prototype.startAutorotate = function() {
  clearTimeout(this.prop.start_timeout);
  this.prop.start_timeout = null;
  
  this.stopAnimation();
  
  this._autorotate();
  this.trigger('autorotate', true);
};

/**
 * Stops the autorotate animation
 * @return (void)
 */
PhotoSphereViewer.prototype.stopAutorotate = function() {
  clearTimeout(this.prop.start_timeout);
  this.prop.start_timeout = null;

  clearTimeout(this.prop.autorotate_timeout);
  this.prop.autorotate_timeout = null;

  this.trigger('autorotate', false);
};

/**
 * Launches/stops the autorotate animation
 * @return (void)
 */
PhotoSphereViewer.prototype.toggleAutorotate = function() {
  if (this.prop.autorotate_timeout) {
    this.stopAutorotate();
  }
  else {
    this.startAutorotate();
  }
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

  if (this.camera) {
    this.camera.aspect = this.prop.size.ratio;
    this.camera.updateProjectionMatrix();
  }

  if (this.renderer) {
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
  this._startMove(evt);
};

/**
 * The user wants to move (mobile version)
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onTouchStart = function(evt) {
  if (evt.touches.length === 1) {
    this._startMove(evt.touches[0]);
  }
  else if (evt.touches.length === 2) {
    this._startZoom(evt);
  }
};

/**
 * Initializes the movement
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._startMove = function(evt) {
  this.prop.mouse_x = this.prop.start_mouse_x = parseInt(evt.clientX);
  this.prop.mouse_y = this.prop.start_mouse_y = parseInt(evt.clientY);
  this.prop.moving = true;
  this.prop.moved = false;
  this.prop.zooming = false;

  this.stopAutorotate();
  this.stopAnimation();
};

/**
 * Initializes the zoom
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._startZoom = function(evt) {
  var t = [
    {x: parseInt(evt.touches[0].clientX), y: parseInt(evt.touches[0].clientY)},
    {x: parseInt(evt.touches[1].clientX), y: parseInt(evt.touches[1].clientY)}
  ];
  
  this.prop.pinch_dist = Math.sqrt(Math.pow(t[0].x-t[1].x, 2) + Math.pow(t[0].y-t[1].y, 2));
  this.prop.moving = false;
  this.prop.zooming = true;

  this.stopAutorotate();
  this.stopAnimation();
};

/**
 * The user wants to stop moving
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onMouseUp = function(evt) {
  this._stopMove(evt);
};

/**
 * The user wants to stop moving (mobile version)
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onTouchEnd = function(evt) {
  this._stopMove(evt.changedTouches[0]);
};

/**
 * Stops the movement
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._stopMove = function(evt) {
  if (this.prop.moving) {
    if (Math.abs(evt.clientX - this.prop.start_mouse_x) < PhotoSphereViewer.MOVE_THRESHOLD && Math.abs(evt.clientY - this.prop.start_mouse_y) < PhotoSphereViewer.MOVE_THRESHOLD) {
      this._click(evt);
    }
    else {
      this.prop.moved = true;
    }
  }
  
  this.prop.moving = false;
  this.prop.zooming = false;
};

/**
 * Trigger an event with all coordinates when a simple click is performed
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._click = function(evt) {
  this.trigger('_click', evt);
  if (evt.defaultPrevented) {
    return;
  }
  
  var boundingRect = this.container.getBoundingClientRect();
  
  var data = {
    client_x: parseInt(evt.clientX - boundingRect.left),
    client_y: parseInt(evt.clientY - boundingRect.top)
  };

  var screen = new THREE.Vector2(
    2 * data.client_x / this.prop.size.width - 1,
    - 2 * data.client_y / this.prop.size.height + 1
  );
  
  this.raycaster.setFromCamera(screen, this.camera);
  
  var intersects = this.raycaster.intersectObjects(this.scene.children);
  
  if (intersects.length === 1) {    
    var p = intersects[0].point;
    var phi = Math.acos(p.y / Math.sqrt(p.x*p.x + p.y*p.y + p.z*p.z));
    var theta = Math.atan2(p.x, p.z);
    
    data.longitude = theta < 0 ? - theta : PhotoSphereViewer.TwoPI - theta;
    data.latitude = PhotoSphereViewer.HalfPI - phi;
    
    var relativeLong = data.longitude / PhotoSphereViewer.TwoPI * this.prop.size.image_width;
    var relativeLat = data.latitude / PhotoSphereViewer.PI * this.prop.size.image_height;

    data.texture_x = parseInt(data.longitude < PhotoSphereViewer.PI ? relativeLong + this.prop.size.image_width/2 : relativeLong - this.prop.size.image_width/2);
    data.texture_y = parseInt(this.prop.size.image_height/2 - relativeLat);
  
    this.trigger('click', data);
  }
};

/**
 * The user moves the image
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onMouseMove = function(evt) {
  evt.preventDefault();
  this._move(evt);
};

/**
 * The user moves the image (mobile version)
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onTouchMove = function(evt) {
  if (evt.touches.length === 1) {
    evt.preventDefault();
    this._move(evt.touches[0]);
  }
  else if (evt.touches.length === 2) {
    evt.preventDefault();
    this._zoom(evt);
  }
};

/**
 * Movement
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._move = function(evt) {
  if (this.prop.moving) {
    var x = parseInt(evt.clientX);
    var y = parseInt(evt.clientY);
  
    this.rotate(
      this.prop.longitude - (x - this.prop.mouse_x) * this.config.long_offset,
      this.prop.latitude + (y - this.prop.mouse_y) * this.config.lat_offset
    );

    this.prop.mouse_x = x;
    this.prop.mouse_y = y;
  }
};

/**
 * Zoom
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._zoom = function(evt) {
  if (this.prop.zooming) {
    var t = [
      {x: parseInt(evt.touches[0].clientX), y: parseInt(evt.touches[0].clientY)},
      {x: parseInt(evt.touches[1].clientX), y: parseInt(evt.touches[1].clientY)}
    ];
    
    var p = Math.sqrt(Math.pow(t[0].x-t[1].x, 2) + Math.pow(t[0].y-t[1].y, 2));
    var delta = 80 * (p - this.prop.pinch_dist) / this.prop.size.width;
  
    this.zoom(this.prop.zoom_lvl + delta);

    this.prop.pinch_dist = p;
  }
};

/**
 * Rotate the camera
 * @param t (double) Horizontal angle (rad)
 * @param p (double) Vertical angle (rad)
 * @return (void)
 */
PhotoSphereViewer.prototype.rotate = function(t, p) {
  this.prop.longitude = t - Math.floor(t / PhotoSphereViewer.TwoPI) * PhotoSphereViewer.TwoPI;
  this.prop.latitude = PSVUtils.stayBetween(p, this.config.tilt_down_max, this.config.tilt_up_max);

  if (this.renderer) {
    this.render();
  }

  this.trigger('position-updated', this.prop.longitude, this.prop.latitude);
};

/**
 * Rotate the camera with animation
 * @param t (double) Horizontal angle (rad)
 * @param p (double) Vertical angle (rad)
 * @param s (mixed) Optional. Animation speed or duration (milliseconds)
 * @return (void)
 */
PhotoSphereViewer.prototype.animate = function(t, p, s) {
  if (!s) {
    this.rotate(t, p);
    return;
  }
  
  t = t - Math.floor(t / PhotoSphereViewer.TwoPI) * PhotoSphereViewer.TwoPI;
  p = PSVUtils.stayBetween(p, this.config.tilt_down_max, this.config.tilt_up_max);

  var t0 = this.prop.longitude;
  var p0 = this.prop.latitude;
  
  // get duration of animation
  var duration;
  if (s && typeof s === 'number') {
    duration = s / 1000;
  }
  else {
    // desired radial speed
    var speed = s ? this.parseAnimSpeed(s) : this.prop.anim_speed;
    // get the angle between current position and target
    var angle = Math.acos(Math.cos(p0) * Math.cos(p) * Math.cos(t0-t) + Math.sin(p0) * Math.sin(p));
    duration = angle / speed;
  }
  
  var steps = duration * this.prop.fps;
  
  // longitude offset for shortest arc
  var tCandidates = [
    t - t0, // direct
    PhotoSphereViewer.TwoPI - t0 + t, // clock-wise cross zero
    t - t0 - PhotoSphereViewer.TwoPI // counter-clock-wise cross zero
  ];
  
  var tOffset = tCandidates.reduce(function(value, candidate) {
    return Math.abs(candidate) < Math.abs(value) ? candidate : value;
  }, Infinity);
  
  // latitude offset
  var pOffset = p - p0;
  
  this.stopAutorotate();
  this.stopAnimation();
  
  this._animate(tOffset / steps, pOffset / steps, t, p);
};

/**
 * Internal method for animation
 * @param tStep (double) horizontal angle to move the view each tick
 * @param pStep (double) vertical angle to move the view each tick
 * @param tTarget (double) target horizontal angle
 * @param pTarget (double) target vertical angle
 * @return (void)
 */
PhotoSphereViewer.prototype._animate = function(tStep, pStep, tTarget, pTarget) {
  if (tStep !== 0 && Math.abs(this.prop.longitude - tTarget) <= Math.abs(tStep) * 2) {
    tStep = 0;
    this.prop.longitude = tTarget;
  }
  if (pStep !== 0 && Math.abs(this.prop.latitude - pTarget) <= Math.abs(pStep) * 2) {
    pStep = 0;
    this.prop.latitude = pTarget;
  }
  
  this.rotate(
    this.prop.longitude + tStep,
    this.prop.latitude + pStep
  );
  
  if (tStep !== 0 || pStep !== 0) {
    this.prop.animation_timeout = setTimeout(this._animate.bind(this, tStep, pStep, tTarget, pTarget), 1000 / this.prop.fps);
  }
  else {
    this.stopAnimation();
  }
};

/**
 * Stop the ongoing animation
 * @return (void)
 */
PhotoSphereViewer.prototype.stopAnimation = function() {
  clearTimeout(this.prop.animation_timeout);
  this.prop.animation_timeout = null;
};

/**
 * The user wants to zoom
 * @param evt (Event) The event
 * @return (void)
 */
PhotoSphereViewer.prototype._onMouseWheel = function(evt) {
  evt.preventDefault();
  evt.stopPropagation();

  var delta = evt.deltaY!==undefined ? -evt.deltaY : (evt.wheelDelta!==undefined ? evt.wheelDelta : -evt.detail);

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
  if (this.prop.zoom_lvl < 100) {
    this.zoom(this.prop.zoom_lvl + 1);
  }
};

/**
 * Zoom out
 * @return (void)
 */
PhotoSphereViewer.prototype.zoomOut = function() {
  if (this.prop.zoom_lvl > 0) {
    this.zoom(this.prop.zoom_lvl - 1);
  }
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
  if (!PSVUtils.isFullscreenEnabled()) {
    PSVUtils.requestFullscreen(this.container);
  }
  else {
    PSVUtils.exitFullscreen();
  }
};

/**
 * Parse the animation speed
 * @param speed (string) The speed, in radians/degrees/revolutions per second/minute
 * @return (double) radians per second
 */
PhotoSphereViewer.prototype.parseAnimSpeed = function(speed) {
  speed = speed.toString().trim();

  // Speed extraction
  var speed_value = parseFloat(speed.replace(/^(-?[0-9]+(?:\.[0-9]*)?).*$/, '$1'));
  var speed_unit = speed.replace(/^-?[0-9]+(?:\.[0-9]*)?(.*)$/, '$1').trim();

  // "per minute" -> "per second"
  if (speed_unit.match(/(pm|per minute)$/)) {
    speed_value /= 60;
  }

  var rad_per_second = 0;

  // Which unit?
  switch (speed_unit) {
    // Degrees per minute / second
    case 'dpm':
    case 'degrees per minute':
    case 'dps':
    case 'degrees per second':
      rad_per_second = speed_value * Math.PI / 180;
      break;

    // Radians per minute / second
    case 'radians per minute':
    case 'radians per second':
      rad_per_second = speed_value;
      break;

    // Revolutions per minute / second
    case 'rpm':
    case 'revolutions per minute':
    case 'rps':
    case 'revolutions per second':
      rad_per_second = speed_value * PhotoSphereViewer.TwoPI;
      break;

    // Unknown unit
    default:
      throw new PSVError('unknown speed unit "' + speed_unit + '"');
  }
  
  return rad_per_second;
};

/**
 * Sets the animation speed
 * @param speed (string) The speed, in radians/degrees/revolutions per second/minute
 * @return (void)
 */
PhotoSphereViewer.prototype.setAnimSpeed = function(speed) {
  this.prop.anim_speed = this.parseAnimSpeed(speed);
};

/**
 * Adds an action
 * @param name (string) Action name
 * @param f (Function) The handler function
 * @return (void)
 */
PhotoSphereViewer.prototype.on = function(name, f) {
  if (!(name in this.actions)) {
    this.actions[name] = [];
  }

  this.actions[name].push(f);
};

/**
 * Triggers an action
 * @param name (string) Action name
 * @param args... (mixed) Arguments to send to the handler functions
 * @return (void)
 */
PhotoSphereViewer.prototype.trigger = function(name, args) {
  args = Array.prototype.slice.call(arguments, 1);
  if ((name in this.actions) && this.actions[name].length > 0) {
    for (var i = 0, l = this.actions[name].length; i < l; ++i) {
      this.actions[name][i].apply(this, args);
    }
  }
};

/**
 * Base sub component class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVComponent(psv) {
  this.psv = psv;  
  
  // expose some methods to the viewer
  if (this.constructor.publicMethods) {
    this.constructor.publicMethods.forEach(function(method) {
      this.psv[method] = this[method].bind(this);
    }, this);
  }
}

/**
 * Loader class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVLoader(psv) {
  this.psv = psv;
  this.container = null;
  this.canvas = null;
  
  this.create();
}

/**
 * Creates the loader content
 */
PSVLoader.prototype.create = function() {
  this.container = document.createElement('div');
  this.container.className = 'psv-loader';
  
  this.psv.container.appendChild(this.container);

  this.canvas = document.createElement('canvas');
  this.canvas.className = 'loader-canvas';
  
  this.canvas.width = this.container.clientWidth;
  this.canvas.height = this.container.clientWidth;
  this.container.appendChild(this.canvas);

  this.tickness = (this.container.offsetWidth - this.container.clientWidth) / 2;

  var inner;
  if (this.psv.config.loading_img) {
    inner = document.createElement('img');
    inner.className = 'loader-image';
    inner.src = this.psv.config.loading_img;
  }
  else if (this.psv.config.loading_txt) {
    inner = document.createElement('div');
    inner.className = 'loader-text';
    inner.innerHTML = this.psv.config.loading_txt;
  }
  if (inner) {
    var a = Math.round(Math.sqrt(2 * Math.pow(this.canvas.width/2-this.tickness/2, 2)));
    inner.style.maxWidth = a + 'px';
    inner.style.maxHeight = a + 'px';
    this.container.appendChild(inner);
  }
};

/**
 * Sets the loader progression
 * @param value (int) from 0 to 100
 */
PSVLoader.prototype.setProgress = function(value) {
  var context = this.canvas.getContext('2d');

  context.clearRect(0, 0, this.canvas.width, this.canvas.height);

  context.lineWidth = this.tickness;
  context.strokeStyle = PSVUtils.getStyle(this.container, 'color');

  context.beginPath();
  context.arc(
    this.canvas.width/2, this.canvas.height/2,
    this.canvas.width/2 - this.tickness/2,
    -Math.PI/2, value/100 * 2*Math.PI - Math.PI/2
  );
  context.stroke();
};

/**
 * HUD class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVHUD(psv) {
  PSVComponent.call(this, psv);
  
  this.container = null;
  this.markers = {};
  this.currentMarker = null;
  
  this.create();
}

PSVHUD.prototype = Object.create(PSVComponent.prototype);
PSVHUD.prototype.constructor = PSVHUD;

PSVHUD.publicMethods = ['addMarker', 'removeMarker', 'getMarker', 'getCurrentMarker', 'gotoMarker', 'hideMarker', 'showMarker', 'toggleMarker'];

/**
 * Creates the elements
 * @return (void)
 */
PSVHUD.prototype.create = function() {
  this.container = document.createElement('div');
  this.container.className = 'psv-hud';
  
  // Markers events via delegation
  this.container.addEventListener('mouseenter', this._onMouseEnter.bind(this), true);
  this.container.addEventListener('mouseleave', this._onMouseLeave.bind(this), true);
  
  this.psv.on('_click', this._onClick.bind(this), true);
  
  this.psv.on('render', this.updatePositions.bind(this));
};

/**
 * Add a new marker to HUD
 * @param marker (Object)
 * @param noRender (Boolean) disable immediate render
 * @return (Object) a modified marker object
 */
PSVHUD.prototype.addMarker = function(marker, noRender) {
  if (!marker.id) {
    throw new PSVError('missing marker id');
  }
  
  if (this.markers[marker.id]) {
    throw new PSVError('marker "' + marker.id + '" already exists');
  }
  
  if (!marker.width || !marker.height) {
    throw new PSVError('missing marker width/height');
  }
  
  if (!marker.image) {
    throw new PSVError('missing marker image');
  }
  
  if ((!marker.hasOwnProperty('x') || !marker.hasOwnProperty('y')) & (!marker.hasOwnProperty('latitude') || !marker.hasOwnProperty('longitude'))) {
    throw new PSVError('missing marker position, latitude/longitude or x/y');
  }

  marker = PSVUtils.clone(marker);
  
  // create DOM
  marker.$el = document.createElement('div');
  marker.$el.psvMarker = marker;
  marker.$el.className = 'marker';
  
  if (marker.className) {
    marker.$el.classList.add(marker.className);
  }
  if (marker.tooltip) {
    marker.$el.classList.add('has-tooltip');
  }
  
  // set image
  var style = marker.$el.style;
  style.width = marker.width + 'px';
  style.height = marker.height + 'px';
  style.backgroundImage = 'url(' + marker.image + ')';
  
  // parse anchor
  marker.anchor = PSVUtils.parsePosition(marker.anchor);
  
  // convert texture coordinates to spherical coordinates
  if (marker.hasOwnProperty('x') && marker.hasOwnProperty('y')) {
    var relativeX = marker.x / this.psv.prop.size.image_width * PhotoSphereViewer.TwoPI;
    var relativeY = marker.y / this.psv.prop.size.image_height * PhotoSphereViewer.PI;
    
    marker.longitude = relativeX >= PhotoSphereViewer.PI ? relativeX - PhotoSphereViewer.PI : relativeX + PhotoSphereViewer.PI;
    marker.latitude = PhotoSphereViewer.HalfPI - relativeY;
  }
  
  // compute x/y/z position
  marker.position3D = new THREE.Vector3(
    -Math.cos(marker.latitude) * Math.sin(marker.longitude),
    Math.sin(marker.latitude),
    Math.cos(marker.latitude) * Math.cos(marker.longitude)
  );
  
  if (!marker.hasOwnProperty('visible')) {
    marker.visible = true;
  }
  
  // save
  this.markers[marker.id] = marker;
  this.container.appendChild(marker.$el);
  
  if (!noRender) {
    this.updatePositions();
  }
  
  return marker;
};

/**
 * Get a marker by it's id or external object
 * @param marker (Mixed)
 * @return (Object)
 */
PSVHUD.prototype.getMarker = function(marker) {
  var id = typeof marker === 'object' ? marker.id : marker;
  
  if (!this.markers[id]) {
    throw new PSVError('cannot find marker "' + id + '"');
  }
  
  return this.markers[id];
};

/**
 * Get the current selected marker
 * @return (Object)
 */
PSVHUD.prototype.getCurrentMarker = function() {
  return this.currentMarker;
};

/**
 * Remove a marker
 * @param marker (Mixed)
 * @param noRender (Boolean)
 * @return (void)
 */
PSVHUD.prototype.removeMarker = function(marker, noRender) {
  marker = this.getMarker(marker);
  delete this.markers[marker.id];
  
  if (!noRender) {
    this.updatePositions();
  }
};

/**
 * Go to a specific marker
 * @param marker (Mixed)
 * @param duration (Mixed)
 * @return (void)
 */
PSVHUD.prototype.gotoMarker = function(marker, duration) {
  marker = this.getMarker(marker);
  this.psv.animate(marker.longitude, marker.latitude, duration);
};

/**
 * Hide a marker
 * @param marker (Mixed)
 * @return (void)
 */
PSVHUD.prototype.hideMarker = function(marker) {
  this.getMarker(marker).visible = false;
  this.updatePositions();
};

/**
 * Show a marker
 * @param marker (Mixed)
 * @return (void)
 */
PSVHUD.prototype.showMarker = function(marker) {
  this.getMarker(marker).visible = true;
  this.updatePositions();
};

/**
 * Toggle a marker
 * @param marker (Mixed)
 * @return (void)
 */
PSVHUD.prototype.toggleMarker = function(marker) {
  this.getMarker(marker).visible^= true;
  this.updatePositions();
};

/**
 * Update visibility and position of all markers
 * @return (void)
 */
PSVHUD.prototype.updatePositions = function() {
  this.psv.camera.updateProjectionMatrix();

  for (var id in this.markers) {
    var marker = this.markers[id];
    var position = this._getMarkerPosition(marker);
    
    if (this._isMarkerVisible(marker, position)) {
      marker.position2D = position;
      
      marker.$el.style.transform = 'translate3D(' + 
        position.left + 'px, ' + 
        position.top + 'px, ' +
        '0px)';
      
      if (!marker.$el.classList.contains('visible')) {
        marker.$el.classList.add('visible');
      }
    }
    else {
      marker.position2D = null;
      marker.$el.classList.remove('visible');
    }
  }
};

/**
 * Determine if a marker is visible
 * It tests if the point is in the general direction of the camera, then check if it's in the viewport
 * @param marker (Object)
 * @param position (Object)
 * @return (Boolean)
 */
PSVHUD.prototype._isMarkerVisible = function(marker, position) {
  return marker.visible &&
    marker.position3D.dot(this.psv.prop.direction) > 0 &&
    position.left >= 0 && 
    position.left + marker.width <= this.psv.prop.size.width &&
    position.top >= 0 && 
    position.top + marker.height <= this.psv.prop.size.height;
};

/**
 * Compute HUD coordinates of a marker
 * @param marker (Object)
 * @return (Object) top and left position
 */
PSVHUD.prototype._getMarkerPosition = function(marker) {
  var vector = marker.position3D.clone();
  vector.project(this.psv.camera);

  return {
    top: (1 - vector.y) / 2 * this.psv.prop.size.height - marker.height * marker.anchor.top,
    left: (vector.x + 1) / 2 * this.psv.prop.size.width - marker.width * marker.anchor.left
  };
};

/**
 * The mouse enters a marker : show the tooltip
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onMouseEnter = function(e) {
  if (e.target && e.target.psvMarker && e.target.psvMarker.tooltip) {
    this.psv.tooltip.showTooltip(e.target.psvMarker.tooltip, e.target.psvMarker);
  }
};

/**
 * The mouse leaves a marker : hide the tooltip
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onMouseLeave = function(e) {
  if (e.target && e.target.psvMarker) {
    this.psv.tooltip.hideTooltip();
  }
};

/**
 * The mouse button is release : show/hide the panel if threeshold was not reached, or do nothing
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onClick = function(e) {
  if (!this.psv.prop.moved) {
    if (e.target && e.target.psvMarker) {
      this.currentMarker = e.target.psvMarker;
      this.psv.trigger('select-marker', e.target.psvMarker);
      e.preventDefault(); // prevent the public "click" event
    }
    else {
      this.currentMarker = null;
      this.psv.trigger('unselect-marker');
    }
    
    if (e.target && e.target.psvMarker && e.target.psvMarker.content) {
      this.psv.panel.showPanel(e.target.psvMarker.content);
    }
    else if (this.psv.panel.prop.opened) {
      e.preventDefault(); // prevent the public "click" event
      this.psv.panel.hidePanel();
    }
  }
};

/*jshint multistr: true */

/**
 * Panel class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVPanel(psv) {
  PSVComponent.call(this, psv);
  
  this.container = null;
  this.content = null;
  
  this.prop = {
    mouse_x: 0,
    mouse_y: 0,
    mousedown: false,
    opened: false
  };
  
  this.create();
}

PSVPanel.prototype = Object.create(PSVComponent.prototype);
PSVPanel.prototype.constructor = PSVPanel;

PSVPanel.publicMethods = ['showPanel', 'hidePanel'];

/**
 * Creates the elements
 * @return (void)
 */
PSVPanel.prototype.create = function() {
  this.container = document.createElement('aside');
  this.container.className = 'psv-panel';
  this.container.innerHTML = '\
<div class="resizer"></div>\
<div class="close-button"></div>\
<div class="content"></div>';
  
  this.content = this.container.querySelector('.content');
  
  var closeBtn = this.container.querySelector('.close-button');
  closeBtn.addEventListener('click', this.hidePanel.bind(this));
  
  // Stop event bubling from panel
  if (this.psv.config.mousewheel) {
    this.container.addEventListener(PSVUtils.mouseWheelEvent(), function(e) {
      e.stopPropagation();
    });
  }
  
  // Event for panel resizing + stop bubling
  var resizer = this.container.querySelector('.resizer');
  resizer.addEventListener('mousedown', this._onMouseDown.bind(this));
  resizer.addEventListener('touchstart', this._onTouchStart.bind(this));
  this.psv.container.addEventListener('mouseup', this._onMouseUp.bind(this));
  this.psv.container.addEventListener('touchend', this._onMouseUp.bind(this));
  this.psv.container.addEventListener('mousemove', this._onMouseMove.bind(this));
  this.psv.container.addEventListener('touchmove', this._onTouchMove.bind(this));
};

/**
 * Show the panel
 * @param marker (Object)
 * @param noMargin (Boolean)
 * @return (void)
 */
PSVPanel.prototype.showPanel = function(content, noMargin) {
  this.content.innerHTML = content;
  this.content.scrollTop = 0;
  this.container.classList.add('open');
  
  if (noMargin) {
    if (!this.content.classList.contains('no-margin')) {
      this.content.classList.add('no-margin');
    }
  }
  else {
    this.content.classList.remove('no-margin');
  }
  
  this.prop.opened = true;
  this.psv.trigger('open-panel');
};


/**
 * Hide the panel
 * @return (void)
 */
PSVPanel.prototype.hidePanel = function() {
  this.prop.opened = false;
  this.container.classList.remove('open');
  this.psv.trigger('close-panel');
};

/**
 * The user wants to move
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._onMouseDown = function(evt) {
  evt.stopPropagation();
  this._startResize(evt);
};

/**
 * The user wants to move (mobile version)
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._onTouchStart = function(evt) {
  evt.stopPropagation();
  this._startResize(evt.changedTouches[0]);
};

/**
 * Initializes the movement
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._startResize = function(evt) {
  this.prop.mouse_x = parseInt(evt.clientX);
  this.prop.mouse_y = parseInt(evt.clientY);
  this.prop.mousedown = true;
  this.content.classList.add('no-interaction');
};

/**
 * The user wants to stop moving
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._onMouseUp = function(evt) {
  if (this.prop.mousedown) {
    evt.stopPropagation();
    this.prop.mousedown = false;
    this.content.classList.remove('no-interaction');
  }
};

/**
 * The user resizes the panel
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._onMouseMove = function(evt) {
  if (this.prop.mousedown) {
    evt.stopPropagation();
    this._resize(evt);
  }
};

/**
 * The user resizes the panel (mobile version)
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._onTouchMove = function(evt) {
  if (this.prop.mousedown) {
    evt.stopPropagation();
    this._resize(evt.changedTouches[0]);
  }
};

/**
 * Panel resizing
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._resize = function(evt) {
  var x = parseInt(evt.clientX);
  var y = parseInt(evt.clientY);
  
  this.container.style.width = (this.container.offsetWidth - (x - this.prop.mouse_x)) + 'px';

  this.prop.mouse_x = x;
  this.prop.mouse_y = y;
};

/**
 * Tooltip class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVTooltip(psv) {
  PSVComponent.call(this, psv);
  
  this.config = this.psv.config.tooltip;
  this.container = null;
  
  this.create();
}

PSVTooltip.prototype = Object.create(PSVComponent.prototype);
PSVTooltip.prototype.constructor = PSVTooltip;

PSVTooltip.publicMethods = ['showTooltip', 'hideTooltip'];

PSVTooltip.leftMap = {0: 'left', 0.5: 'center', 1: 'right'};
PSVTooltip.topMap = {0: 'top', 0.5: 'center', 1: 'bottom'};

/**
 * Creates the elements
 * @return (void)
 */
PSVTooltip.prototype.create = function() {
  this.container = document.createElement('div');
  this.container.innerHTML = '<div class="arrow"></div><div class="content"></div>';
  this.container.className = 'psv-tooltip';
  this.container.style.top = '-1000px';
  this.container.style.left = '-1000px';
  
  this.psv.on('render', this.hideTooltip.bind(this));
};

/**
 * Show the tooltip
 * @param tooltip (Mixed) content, className, position
 * @param marker (Object) target for positioning: width, height, position2D(top, left)
 * @return (void)
 */
PSVTooltip.prototype.showTooltip = function(tooltip, marker) {
  var t = this.container;
  var c = t.querySelector('.content');
  var a = t.querySelector('.arrow');
  
  if (typeof tooltip === 'string') {
    tooltip = {
      content: marker.tooltip,
      position: ['top', 'center']
    };
  }
  
  // parse position
  if (typeof tooltip.position === 'string') {
    var tempPos = PSVUtils.parsePosition(tooltip.position);
    
    if (!(tempPos.left in PSVTooltip.leftMap) || !(tempPos.top in PSVTooltip.topMap)) {
      throw new PSVError('unable to parse tooltip position "' + tooltip.position + '"');
    }
    
    tooltip.position = [PSVTooltip.topMap[tempPos.top], PSVTooltip.leftMap[tempPos.left]];
  }
  
  t.className = 'psv-tooltip'; // reset the class
  if (tooltip.className) {
    t.classList.add(tooltip.className);
  }

  c.innerHTML = tooltip.content;
  t.style.top = '0px';
  t.style.left = '0px';
  
  // compute size
  var rect = t.getBoundingClientRect();
  var style = {
    posClass: tooltip.position.slice(),
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    top: 0,
    left: 0,
    arrow_top: 0,
    arrow_left: 0
  };
  
  // set initial position
  this._computeTooltipPosition(style, marker);
  
  // correct position if overflow
  var refresh = false;
  if (style.top < this.config.offset) {
    style.posClass[0] = 'bottom';
    refresh = true;
  }
  else if (style.top + style.height > this.psv.prop.size.height - this.config.offset) {
    style.posClass[0] = 'top';
    refresh = true;
  }
  if (style.left < this.config.offset) {
    style.posClass[1] = 'right';
    refresh = true;
  }
  else if (style.left + style.width > this.psv.prop.size.width - this.config.offset) {
    style.posClass[1] = 'left';
    refresh = true;
  }
  if (refresh) {
    this._computeTooltipPosition(style, marker);
  }
  
  // apply position
  t.style.top = style.top + 'px';
  t.style.left = style.left + 'px';
  
  a.style.top = style.arrow_top + 'px';
  a.style.left = style.arrow_left + 'px';
  
  t.classList.add(style.posClass.join('-'));
  
  // delay for correct transition between the two classes
  var self = this;
  setTimeout(function() {
    t.classList.add('visible');
    self.psv.trigger('show-tooltip');
  }, 100);
};

/**
 * Hide the tooltip
 * @return (void)
 */
PSVTooltip.prototype.hideTooltip = function() {
  this.container.classList.remove('visible');
  this.psv.trigger('hide-tooltip');
  
  var self = this;
  setTimeout(function() {
    self.container.style.top = '-1000px';
    self.container.style.left = '-1000px';
  }, 100);
};

/**
 * Compute the position of the tooltip and its arrow
 * @param style (Object) tooltip style
 * @param marker (Object)
 * @return (void)
 */
PSVTooltip.prototype._computeTooltipPosition = function(style, marker) {
  var topBottom = false;
  
  switch (style.posClass[0]) {
    case 'bottom':
      style.top = marker.position2D.top + marker.height + this.config.offset + this.config.arrow_size;
      style.arrow_top = - this.config.arrow_size * 2;
      topBottom = true;
      break;
    
    case 'center':
      style.top = marker.position2D.top + marker.height/2 - style.height/2;
      style.arrow_top = style.height/2 - this.config.arrow_size;
      break;
    
    case 'top':
      style.top = marker.position2D.top - style.height - this.config.offset - this.config.arrow_size;
      style.arrow_top = style.height;
      topBottom = true;
      break;
  }
  
  switch (style.posClass[1]) {
    case 'right':
      if (topBottom) {
        style.left = marker.position2D.left;
        style.arrow_left = marker.width/2 - this.config.arrow_size;
      }
      else {
        style.left = marker.position2D.left + marker.width + this.config.offset + this.config.arrow_size;
        style.arrow_left = - this.config.arrow_size * 2;
      }
      break;
    
    case 'center':
      style.left = marker.position2D.left + marker.width/2 - style.width/2;
      style.arrow_left = style.width/2 - this.config.arrow_size;
      break;
    
    case 'left':
      if (topBottom) {
        style.left = marker.position2D.left - style.width + marker.width;
        style.arrow_left = style.width - marker.width/2 - this.config.arrow_size;
      }
      else {
        style.left = marker.position2D.left - style.width - this.config.offset - this.config.arrow_size;
        style.arrow_left = style.width;
      }
      break;
  }
};

/**
 * Navigation bar class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBar(psv) {
  PSVComponent.call(this, psv);

  this.config = this.psv.config.navbar;
  this.container = null;
  this.caption = null;

  if (this.config === true) {
    this.config = PSVUtils.clone(PSVNavBar.DEFAULTS);
  }
  else if (typeof this.config == 'string') {
    var map = {};
    this.config.split(/[ ,:]/).forEach(function(button) {
      map[button] = true;
    });
    this.config = PSVUtils.deepmerge(PSVNavBar.DEFAULTS, map);
  }

  this.create();
}

PSVNavBar.prototype = Object.create(PSVComponent.prototype);
PSVNavBar.prototype.constructor = PSVNavBar;

PSVNavBar.publicMethods = ['setCaption'];

PSVNavBar.DEFAULTS = {
  autorotate: true,
  zoom: true,
  fullscreen: true,
  download: true,
  markers: true
};

/**
 * Creates the elements
 * @return (void)
 */
PSVNavBar.prototype.create = function() {
  // Container
  this.container = document.createElement('div');
  this.container.className = 'psv-navbar';

  // Autorotate button
  if (this.config.autorotate) {
    var autorotateBtn = new PSVNavBarAutorotateButton(this.psv);
    this.container.appendChild(autorotateBtn.button);
  }

  // Zoom buttons
  if (this.config.zoom) {
    var zoomBar = new PSVNavBarZoomButton(this.psv);
    this.container.appendChild(zoomBar.button);
  }

  // Download button
  if (this.config.download) {
    var downloadBtn = new PSVNavBarDownloadButton(this.psv);
    this.container.appendChild(downloadBtn.button);
  }

  // Markers button
  if (this.config.markers) {
    var markersBtn = new PSVNavBarMarkersButton(this.psv);
    this.container.appendChild(markersBtn.button);
  }

  // Fullscreen button
  if (this.config.fullscreen) {
    var fullscreenBtn = new PSVNavBarFullscreenButton(this.psv);
    this.container.appendChild(fullscreenBtn.button);
  }

  // Caption
  this.caption = document.createElement('div');
  this.caption.className = 'caption';
  this.container.appendChild(this.caption);
  this.setCaption(this.psv.config.caption);
};

/**
 * Sets the bar caption
 * @param (string) html
 */
PSVNavBar.prototype.setCaption = function(html) {
  if (!html) {
    this.caption.style.display = 'none';
  }
  else {
    this.caption.style.display = 'block';
    this.caption.innerHTML = html;
  }
};

/**
 * Navigation bar button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBarButton(psv) {
  this.psv = psv;
  this.button = null;
}

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarButton.prototype.create = function() {
  throw new PSVError('Not implemented');
};

/**
 * Changes the active state of the button
 * @param active (boolean) true if the button should be active, false otherwise
 * @return (void)
 */
PSVNavBarButton.prototype.toggleActive = function(active) {
  if (active) {
    this.button.classList.add('active');
  }
  else {
    this.button.classList.remove('active');
  }
};

/**
 * Navigation bar autorotate button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBarAutorotateButton(psv) {
  PSVNavBarButton.call(this, psv);
  
  this.create();
}

PSVNavBarAutorotateButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarAutorotateButton.prototype.constructor = PSVNavBarAutorotateButton;

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarAutorotateButton.prototype.create = function() {
  this.button = document.createElement('div');
  this.button.className = 'psv-button autorotate-button';
  this.button.title = this.psv.config.lang.autorotate;

  var autorotate_sphere = document.createElement('div');
  autorotate_sphere.className = 'sphere';
  this.button.appendChild(autorotate_sphere);

  var autorotate_equator = document.createElement('div');
  autorotate_equator.className = 'equator';
  this.button.appendChild(autorotate_equator);

  this.button.addEventListener('click', this.psv.toggleAutorotate.bind(this.psv));
  
  this.psv.on('autorotate', this.toggleActive.bind(this));
};

/**
 * Navigation bar fullscreen button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBarFullscreenButton(psv) {
  PSVNavBarButton.call(this, psv);
  
  this.create();
}

PSVNavBarFullscreenButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarFullscreenButton.prototype.constructor = PSVNavBarFullscreenButton;

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarFullscreenButton.prototype.create = function() {
  this.button = document.createElement('div');
  this.button.className = 'psv-button fullscreen-button';
  this.button.title = this.psv.config.lang.fullscreen;

  this.button.appendChild(document.createElement('div'));
  this.button.appendChild(document.createElement('div'));

  this.button.addEventListener('click', this.psv.toggleFullscreen.bind(this.psv));
  
  this.psv.on('fullscreen-updated', this.toggleActive.bind(this));
};

/**
 * Navigation bar zoom button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBarZoomButton(psv) {
  PSVNavBarButton.call(this, psv);

  this.zoom_range = null;
  this.zoom_value = null;
  
  this.prop = {
    mousedown: false
  };

  this.create();
}

PSVNavBarZoomButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarZoomButton.prototype.constructor = PSVNavBarZoomButton;

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarZoomButton.prototype.create = function() {
  this.button = document.createElement('div');
  this.button.className = 'psv-button zoom-button';

  var zoom_minus = document.createElement('div');
  zoom_minus.className = 'minus';
  zoom_minus.title = this.psv.config.lang.zoomOut;
  zoom_minus.innerHTML = PhotoSphereViewer.ICONS['zoom-out.svg'];
  this.button.appendChild(zoom_minus);

  var zoom_range_bg = document.createElement('div');
  zoom_range_bg.className = 'range';
  this.button.appendChild(zoom_range_bg);

  this.zoom_range = document.createElement('div');
  this.zoom_range.className = 'line';
  this.zoom_range.title = this.psv.config.lang.zoom;
  zoom_range_bg.appendChild(this.zoom_range);

  this.zoom_value = document.createElement('div');
  this.zoom_value.className = 'handle';
  this.zoom_value.title = this.psv.config.lang.zoom;
  this.zoom_range.appendChild(this.zoom_value);

  var zoom_plus = document.createElement('div');
  zoom_plus.className = 'plus';
  zoom_plus.title = this.psv.config.lang.zoomIn;
  zoom_plus.innerHTML = PhotoSphereViewer.ICONS['zoom-in.svg'];
  this.button.appendChild(zoom_plus);

  this.zoom_range.addEventListener('mousedown', this._initZoomChangeWithMouse.bind(this));
  this.zoom_range.addEventListener('touchstart', this._initZoomChangeByTouch.bind(this));
  this.psv.container.addEventListener('mousemove', this._changeZoomWithMouse.bind(this));
  this.psv.container.addEventListener('touchmove', this._changeZoomByTouch.bind(this));
  this.psv.container.addEventListener('mouseup', this._stopZoomChange.bind(this));
  this.psv.container.addEventListener('touchend', this._stopZoomChange.bind(this));
  zoom_minus.addEventListener('click', this.psv.zoomOut.bind(this.psv));
  zoom_plus.addEventListener('click', this.psv.zoomIn.bind(this.psv));
  
  this.psv.on('zoom-updated', this._moveZoomValue.bind(this));

  var self = this;
  setTimeout(function() {
    self._moveZoomValue(self.psv.prop.zoom_lvl);
  }, 0);
};

/**
 * Moves the zoom cursor
 * @param level (integer) Zoom level (between 0 and 100)
 * @return (void)
 */
PSVNavBarZoomButton.prototype._moveZoomValue = function(level) {
  this.zoom_value.style.left = (level / 100 * this.zoom_range.offsetWidth - this.zoom_value.offsetWidth / 2) + 'px';
};

/**
 * The user wants to zoom
 * @param evt (Event) The event
 * @return (void)
 */
PSVNavBarZoomButton.prototype._initZoomChangeWithMouse = function(evt) {
  this.prop.mousedown = true;
  this._changeZoom(evt.clientX);
};

/**
 * The user wants to zoom (mobile version)
 * @param evt (Event) The event
 * @return (void)
 */
PSVNavBarZoomButton.prototype._initZoomChangeByTouch = function(evt) {
  this.prop.mousedown = true;
  this._changeZoom(evt.changedTouches[0].clientX);
};

/**
 * The user wants to stop zooming
 * @param evt (Event) The event
 * @return (void)
 */
PSVNavBarZoomButton.prototype._stopZoomChange = function(evt) {
  this.prop.mousedown = false;
};

/**
 * The user moves the zoom cursor
 * @param evt (Event) The event
 * @return (void)
 */
PSVNavBarZoomButton.prototype._changeZoomWithMouse = function(evt) {
  evt.preventDefault();
  this._changeZoom(evt.clientX);
};

/**
 * The user moves the zoom cursor (mobile version)
 * @param evt (Event) The event
 * @return (void)
 */
PSVNavBarZoomButton.prototype._changeZoomByTouch = function(evt) {
  evt.preventDefault();
  this._changeZoom(evt.changedTouches[0].clientX);
};

/**
 * Zoom change
 * @param x (integer) Horizontal coordinate
 * @return (void)
 */
PSVNavBarZoomButton.prototype._changeZoom = function(x) {
  if (this.prop.mousedown) {
    var user_input = parseInt(x) - this.zoom_range.getBoundingClientRect().left;
    var zoom_level = user_input / this.zoom_range.offsetWidth * 100;
    this.psv.zoom(zoom_level);
  }
};

/**
 * Navigation bar download button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBarDownloadButton(psv) {
  PSVNavBarButton.call(this, psv);
  
  this.create();
}

PSVNavBarDownloadButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarDownloadButton.prototype.constructor = PSVNavBarDownloadButton;

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarDownloadButton.prototype.create = function() {
  this.button = document.createElement('div');
  this.button.className = 'psv-button download-button';
  this.button.title = this.psv.config.lang.download;

  this.button.appendChild(document.createElement('div'));

  this.button.addEventListener('mouseenter', this.toggleActive.bind(this, true));
  this.button.addEventListener('mouseleave', this.toggleActive.bind(this, false));
  this.button.addEventListener('click', this.download.bind(this));
};

/**
 * Ask the browser to download the panorama source file
 */
PSVNavBarDownloadButton.prototype.download = function() {
  var link = document.createElement('a');
  link.href = this.psv.config.panorama;
  link.download = this.psv.config.panorama;
  this.psv.container.appendChild(link);
  link.click();
};

/*jshint multistr: true */

/**
 * Navigation bar markers button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBarMarkersButton(psv) {
  PSVNavBarButton.call(this, psv);
  
  this.prop = {
    panelOpened: false,
    panelOpening: false
  };

  this.create();
}

PSVNavBarMarkersButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarMarkersButton.prototype.constructor = PSVNavBarMarkersButton;

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarMarkersButton.prototype.create = function() {
  this.button = document.createElement('div');
  this.button.className = 'psv-button markers-button';
  this.button.title = this.psv.config.lang.markers;
  this.button.innerHTML = PhotoSphereViewer.ICONS['pin.svg'];
  
  this.button.addEventListener('click', this.toggleMarkers.bind(this));
  
  this.psv.on('open-panel', this._onPanelOpened.bind(this));
  this.psv.on('close-panel', this._onPanelClosed.bind(this));
};

/**
 * Toggle the visibility of markers list
 * @return (void)
 */
PSVNavBarMarkersButton.prototype.toggleMarkers = function() {
  if (this.prop.panelOpened) {
    this.hideMarkers();
  }
  else {
    this.showMarkers();
  }
};

/**
 * Open side panel with list of markers
 * @return (void)
 */
PSVNavBarMarkersButton.prototype.showMarkers = function() {
  var html = '<div class="psv-markers-list"> \
    <h1>' + this.psv.config.lang.markers + '</h1> \
    <ul>';

    for (var id in this.psv.hud.markers) {
      var marker = this.psv.hud.markers[id];
      
      var name = marker.name || marker.id;
      if (marker.tooltip) {
        name = typeof marker.tooltip === 'string' ? marker.tooltip : marker.tooltip.content;
      }
      
      html+= '<li data-psv-marker="' + marker.id + '"> \
        <img src="' + marker.image + '"/> \
        <p>' + name + '</p> \
      </li>';
    }
  
  html+= '</ul> \
  </div>';
  
  this.prop.panelOpening = true;
  this.psv.panel.showPanel(html, true);
  
  this.psv.panel.container.querySelector('.psv-markers-list').addEventListener('click', this._onClickItem.bind(this));
};

/**
 * Close side panel
 * @return (void)
 */
PSVNavBarMarkersButton.prototype.hideMarkers = function() {
  this.psv.panel.hidePanel();
};

/**
 * Click on an item
 * @param e (Event)
 * @return (void)
 */
PSVNavBarMarkersButton.prototype._onClickItem = function(e) {
  var li;
  if (e.target && (li = PSVUtils.getClosest(e.target, 'li')) && li.dataset.psvMarker) {
    this.psv.hud.gotoMarker(li.dataset.psvMarker, 1000);
  }
};

/**
 * Update status when the panel is updated
 * @return (void)
 */
PSVNavBarMarkersButton.prototype._onPanelOpened = function() {
  if (this.prop.panelOpening) {
    this.prop.panelOpening = false;
    this.prop.panelOpened = true;
  }
  else {
    this.prop.panelOpened = false;
  }
  
  this.toggleActive(this.prop.panelOpened);
};

/**
 * Update status when the panel is updated
 * @return (void)
 */
PSVNavBarMarkersButton.prototype._onPanelClosed = function() {
  this.prop.panelOpened = false;
  this.prop.panelOpening = false;
  
  this.toggleActive(this.prop.panelOpened);
};

/**
 * Custom error used in the lib
 * http://stackoverflow.com/a/27724419/1207670
 * @param message (Mixed)
 */
function PSVError(message) {
  this.message = message;
  
  // Use V8's native method if available, otherwise fallback
  if ('captureStackTrace' in Error) {
    Error.captureStackTrace(this, PSVError);
  }
  else {
    this.stack = (new Error()).stack;
  }
}

PSVError.prototype = Object.create(Error.prototype);
PSVError.prototype.name = 'PSVError';
PSVError.prototype.constructor = PSVError;

/**
 * Static utilities for PSV
 */
var PSVUtils = {};

/**
 * Detects whether canvas is supported
 * @return (boolean) true if canvas is supported, false otherwise
 */
PSVUtils.isCanvasSupported = function() {
  var canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
};

/**
 * Detects whether WebGL is supported
 * @return (boolean) true if WebGL is supported, false otherwise
 */
PSVUtils.isWebGLSupported = function() {
  var canvas = document.createElement('canvas');
  return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
};

/**
 * Get max texture width in WebGL context
 * @return (int)
 */
PSVUtils.getMaxTextureWidth = function() {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('webgl');
  return ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
};

/**
 * Search if an element has a particular, at any level including itself
 * @param el (HTMLElement)
 * @param parent (HTMLElement)
 * @return (Boolean)
 */
PSVUtils.hasParent = function(el, parent) {
  do {
    if (el === parent) {
      return true;
    }
  } while (!!(el = el.parentNode));

  return false;
};

/**
 * Get closest parent (can by itself)
 * @param el (HTMLElement)
 * @param selector (String)
 * @return (HTMLElement)
 */
PSVUtils.getClosest = function(el, selector) {
  var matches = el.matches || el.msMatchesSelector;
  
  do {
    if (matches.bind(el)(selector)) {
      return el;
    }
  } while (!!(el = el.parentElement));

  return null;
};

/**
 * Get the event name for mouse wheel
 * @return (string)
 */
PSVUtils.mouseWheelEvent = function() {
  return "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
    document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
    "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
};

/**
 * Get the event name for fullscreen event
 * @return (string)
 */
PSVUtils.fullscreenEvent = function() {
  var map = {'exitFullscreen': 'fullscreenchange', 'webkitExitFullscreen': 'webkitfullscreenchange', 'mozCancelFullScreen': 'mozfullscreenchange', 'msExitFullscreen': 'msFullscreenEnabled'};
  for (var exit in map) if (exit in document) return map[exit];
  return 'fullscreenchange';
};

/**
 * Ensures that a number is in a given interval
 * @param x (number) The number to check
 * @param min (number) First endpoint
 * @param max (number) Second endpoint
 * @return (number) The checked number
 */
PSVUtils.stayBetween = function(x, min, max) {
  return Math.max(min, Math.min(max, x));
};

/**
 * Returns the value of a given attribute in the panorama metadata
 * @param data (string) The panorama metadata
 * @param attr (string) The wanted attribute
 * @return (string) The value of the attribute
 */
PSVUtils.getAttribute = function(data, attr) {
  var a = data.indexOf('GPano:' + attr) + attr.length + 8, b = data.indexOf('"', a);
  return data.substring(a, b);
};

/**
 * Detects whether fullscreen is enabled or not
 * @return (boolean) true if fullscreen is enabled, false otherwise
 */
PSVUtils.isFullscreenEnabled = function() {
  return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
};

/**
 * Enters fullscreen mode
 * @param elt (HTMLElement)
 */
PSVUtils.requestFullscreen = function(elt) {
  (elt.requestFullscreen || elt.mozRequestFullScreen || elt.webkitRequestFullscreen || elt.msRequestFullscreen).call(elt);
};

/**
 * Exits fullscreen mode
 * @param elt (HTMLElement)
 */
PSVUtils.exitFullscreen = function(elt) {
  (document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
};

/**
 * Gets an element style
 * @param elt (HTMLElement)
 * @param prop (string)
 * @return mixed
 */
PSVUtils.getStyle = function(elt, prop) {
  return window.getComputedStyle(elt, null)[prop];
};

/**
 * Translate CSS values like "top center" or "10% 50%" as top and left positions
 * @param value (String)
 * @return Object
 */
PSVUtils.parsePosition = function(value) {
  if (!value) {
    return {top: 0.5, left: 0.5};
  }
  
  var e = document.createElement('div');
  document.body.appendChild(e);
  e.style.backgroundPosition = value;
  var parsed = PSVUtils.getStyle(e, 'background-position').match(/^([0-9.]+)% ([0-9.]+)%$/);
  document.body.removeChild(e);
  
  return {
    left: parsed[1]/100,
    top: parsed[2]/100
  };
};

/**
 * Merge the enumerable attributes of two objects.
 * @copyright Nicholas Fisher <nfisher110@gmail.com>"
 * @license MIT
 * @param object
 * @param object
 * @return object
 */
PSVUtils.deepmerge = function(target, src) {
  var array = Array.isArray(src);
  var dst = array && [] || {};

  if (array) {
    target = target || [];
    dst = dst.concat(target);
    src.forEach(function(e, i) {
      if (typeof dst[i] === 'undefined') {
        dst[i] = e;
      } else if (typeof e === 'object') {
        dst[i] = PSVUtils.deepmerge(target[i], e);
      } else {
        if (target.indexOf(e) === -1) {
          dst.push(e);
        }
      }
    });
  } else {
    if (target && typeof target === 'object') {
      Object.keys(target).forEach(function (key) {
        dst[key] = target[key];
      });
    }
    Object.keys(src).forEach(function (key) {
      if (typeof src[key] !== 'object' || !src[key]) {
        dst[key] = src[key];
      }
      else {
        if (!target[key]) {
          dst[key] = src[key];
        } else {
          dst[key] = PSVUtils.deepmerge(target[key], src[key]);
        }
      }
    });
  }

  return dst;
};

/**
 * Clone an object
 * @param object
 * @return object
 */
PSVUtils.clone = function(src) {
  return PSVUtils.deepmerge({}, src);
};

PhotoSphereViewer.ICONS['pin.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 48 48" enable-background="new 0 0 48 48" xml:space="preserve"><g><path d="M24,0C13.798,0,5.499,8.3,5.499,18.501c0,10.065,17.57,28.635,18.318,29.421C23.865,47.972,23.931,48,24,48   s0.135-0.028,0.183-0.078c0.748-0.786,18.318-19.355,18.318-29.421C42.501,8.3,34.202,0,24,0z M24,7.139   c5.703,0,10.342,4.64,10.342,10.343c0,5.702-4.639,10.342-10.342,10.342c-5.702,0-10.34-4.64-10.34-10.342   C13.66,11.778,18.298,7.139,24,7.139z"/></g></svg>';

PhotoSphereViewer.ICONS['zoom-in.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 19.407 19.407" enable-background="new 0 0 19.407 19.406" xml:space="preserve"><path d="M14.043,12.22c2.476-3.483,1.659-8.313-1.823-10.789C8.736-1.044,3.907-0.228,1.431,3.255  c-2.475,3.482-1.66,8.312,1.824,10.787c2.684,1.908,6.281,1.908,8.965,0l4.985,4.985c0.503,0.504,1.32,0.504,1.822,0  c0.505-0.503,0.505-1.319,0-1.822L14.043,12.22z M7.738,13.263c-3.053,0-5.527-2.475-5.527-5.525c0-3.053,2.475-5.527,5.527-5.527  c3.05,0,5.524,2.474,5.524,5.527C13.262,10.789,10.788,13.263,7.738,13.263z"/><polygon points="8.728,4.009 6.744,4.009 6.744,6.746 4.006,6.746 4.006,8.73 6.744,8.73 6.744,11.466 8.728,11.466 8.728,8.73   11.465,8.73 11.465,6.746 8.728,6.746 "/></svg>';

PhotoSphereViewer.ICONS['zoom-out.svg'] = '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" x="0px" y="0px" viewBox="0 0 19.407 19.407" enable-background="new 0 0 19.407 19.406" xml:space="preserve"><path d="M14.043,12.22c2.476-3.483,1.659-8.313-1.823-10.789C8.736-1.044,3.907-0.228,1.431,3.255  c-2.475,3.482-1.66,8.312,1.824,10.787c2.684,1.908,6.281,1.908,8.965,0l4.985,4.985c0.503,0.504,1.32,0.504,1.822,0  c0.505-0.503,0.505-1.319,0-1.822L14.043,12.22z M7.738,13.263c-3.053,0-5.527-2.475-5.527-5.525c0-3.053,2.475-5.527,5.527-5.527  c3.05,0,5.524,2.474,5.524,5.527C13.262,10.789,10.788,13.263,7.738,13.263z"/><rect x="4.006" y="6.746" width="7.459" height="1.984"/></svg>';

return PhotoSphereViewer;
}));