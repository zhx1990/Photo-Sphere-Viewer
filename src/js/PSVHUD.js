/**
 * HUD class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVHUD = function(psv) {
  this.psv = psv;
  this.container = null;
  this.markers = {};
  this.currentMarker = null;
  
  this.prop = {
    mouse_x: 0,
    mouse_y: 0,
    moved: false
  };
  
  this.create();
  
  this.psv.on('render', this.updatePositions.bind(this));
  
  // expose some methods to the viewer
  PSVHUD.publicMethods.forEach(function(method) {
    this.psv[method] = this[method].bind(this);
  }, this);
};

PSVHUD.publicMethods = ['addMarker', 'removeMarker', 'getMarker', 'getCurrentMarker', 'gotoMarker', 'hideMarker', 'showMarker', 'toggleMarker'];

/**
 * Creates the elements
 * @return (void)
 */
PSVHUD.prototype.create = function() {
  // Container
  this.container = document.createElement('div');
  this.container.className = 'psv-hud';
  
  // Markers events via delegation
  this.container.addEventListener('mouseenter', this._onMouseEnter.bind(this), true);
  this.container.addEventListener('mouseleave', this._onMouseLeave.bind(this), true);
  
  // Mouse events (internal)
  this.psv.on('__mousedown', this._onMouseDown.bind(this), true);
  this.psv.on('__mousemove', this._onMouseMove.bind(this), true);
  this.psv.on('__mouseup', this._onMouseUp.bind(this), true);
};

/**
 * Add a new marker to HUD
 * @param marker (Object)
 * @param noRender (Boolean) disable immediate render
 * @return (void)
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

  marker = PSVUtils.deepmerge({}, marker); // clone
  
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
    marker.longitude = PhotoSphereViewer.PI + marker.x / this.psv.prop.size.image_width * PhotoSphereViewer.TwoPI;
    marker.latitude = PhotoSphereViewer.HalfPI - marker.y / this.psv.prop.size.image_height * PhotoSphereViewer.PI;
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
 * The mouse button is pressed : save start position
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onMouseDown = function(e) {
  this.prop.mouse_x = e.clientX;
  this.prop.mouse_y = e.clientY;
  this.prop.moved = false;
};

/**
 * The mouse moves (while button is pressed) : flag as move if threeshold reached
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onMouseMove = function(e) {
  if (Math.abs(e.clientX - this.prop.mouse_x) > 5 || Math.abs(e.clientY - this.prop.mouse_y) > 5) {
    this.prop.moved = true;
  }
};

/**
 * The mouse button is release : show/hide the panel if threeshold was not reached, or do nothing
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onMouseUp = function(e) {
  if (!this.prop.moved) {
    var clickedOnHud = !PSVUtils.hasParent(e.target, this.psv.panel.container) && (!this.psv.navbar || !PSVUtils.hasParent(e.target, this.psv.navbar.container));
    
    if (e.target && e.target.psvMarker) {
      this.currentMarker = e.target.psvMarker;
      this.psv.trigger('select-marker', e.target.psvMarker);
    }
    else if (clickedOnHud) {
      this.currentMarker = null;
      this.psv.trigger('unselect-marker');
    }
    
    if (e.target && e.target.psvMarker && e.target.psvMarker.content) {
      this.psv.panel.showPanel(e.target.psvMarker.content);
    }
    // only hide the panel if we clicked on something else than the panel itself or the navbar
    else if (clickedOnHud) {
      this.psv.panel.hidePanel();
    }
  }
};