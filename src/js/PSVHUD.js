/**
 * HUD class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVHUD = function(psv) {
  this.psv = psv;
  this.config = this.psv.config.tooltip;
  this.container = null;
  this.tooltip = null;
  this.markers = {};
  this.currentMarker = null;
  
  this.prop = {
    mouse_x: 0,
    mouse_y: 0,
    moved: false
  };
  
  this.create();
  
  this.psv.on('render', this.updatePositions.bind(this));
  this.psv.on('render', this.hideTooltip.bind(this));
  
  // expose some methods to the viewer
  PSVHUD.publicMethods.forEach(function(method) {
    this.psv[method] = this[method].bind(this);
  }, this);
};

PSVHUD.leftMap = {0: 'left', 0.5: 'center', 1: 'right'};
PSVHUD.topMap = {0: 'top', 0.5: 'center', 1: 'bottom'};
PSVHUD.publicMethods = ['addMarker', 'removeMarker', 'getMarker', 'getCurrentMarker', 'hideMarker', 'showMarker', 'toggleMarker', 'showTooltip', 'hideTooltip'];

/**
 * Creates the elements
 * @return (void)
 */
PSVHUD.prototype.create = function() {
  // Container
  this.container = document.createElement('div');
  this.container.className = 'psv-hud';
  
  // Tooltip
  this.tooltip = document.createElement('div');
  this.tooltip.innerHTML = '<div class="arrow"></div><div class="content"></div>';
  this.tooltip.className = 'psv-tooltip';
  this.container.appendChild(this.tooltip);
  
  // Markers events via delegation
  this.container.addEventListener('mouseenter', this._onMouseEnter.bind(this), true);
  this.container.addEventListener('mouseleave', this._onMouseLeave.bind(this), true);
  
  // Mouse events (internal)
  this.psv.on('__mousedown', this._onMouseDown.bind(this), true);
  this.psv.on('__mousemove', this._onMouseMove.bind(this), true);
  this.psv.on('__mouseup', this._onMouseUp.bind(this), true);
};

/**
 * The mouse enters a marker : show the tooltip
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onMouseEnter = function(e) {
  if (e.target && e.target.psvMarker && e.target.psvMarker.tooltip) {
    this.showTooltip(e.target.psvMarker.tooltip, e.target.psvMarker);
  }
};

/**
 * The mouse leaves a marker : hide the tooltip
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onMouseLeave = function(e) {
  if (e.target && e.target.psvMarker) {
    this.hideTooltip();
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
    if (e.target && e.target.psvMarker && e.target.psvMarker.content) {
      this.psv.panel.showPanel(e.target.psvMarker.content);
    }
    // only hide the panel if we clicked on something else than the panel itself or the navbar
    else if (!PSVUtils.hasParent(e.target, this.psv.panel.container) && (!this.psv.navbar || !PSVUtils.hasParent(e.target, this.psv.navbar.container))) {
      this.psv.panel.hidePanel();
    }
  }
};

/**
 * Add a new marker to HUD
 * @param marker (Object)
 * @param noRender (Boolean) disable immediate render
 * @return (void)
 */
PSVHUD.prototype.addMarker = function(marker, noRender) {
  if (!marker.id) {
    throw 'PhotoSphereViewer: missing marker id';
  }
  
  if (this.markers[marker.id]) {
    throw 'PhotoSphereViewer: marker "' + marker.id + '" already exists';
  }
  
  if (!marker.width || !marker.height) {
    throw 'PhotoSphereViewer: missing marker width/height';
  }
  
  if (!marker.image) {
    throw 'PhotoSphereViewer: missing marker image';
  }
  
  if ((!marker.hasOwnProperty('x') || !marker.hasOwnProperty('y')) & (!marker.hasOwnProperty('latitude') || !marker.hasOwnProperty('longitude'))) {
    throw 'PhotoSphereViewer: missing marker position, latitude/longitude or x/y';
  }

  marker = PSVUtils.deepmerge({}, marker); // clone
  
  // create DOM
  marker.$el = document.createElement('div');
  marker.$el.psvMarker = marker;
  marker.$el.className = 'marker ' + (marker.className||'');
  
  var style = marker.$el.style;
  style.width = marker.width + 'px';
  style.height = marker.height + 'px';
  style.backgroundImage = 'url(' + marker.image + ')';
  
  // init tooltip config
  if (marker.tooltip) {
    if (typeof marker.tooltip === 'string') {
      marker.tooltip = {
        content: marker.tooltip
      };
    }
    
    // parse position
    if (marker.tooltip.position) {
      var tempPos = PSVUtils.parsePosition(marker.tooltip.position);
      
      if (!(tempPos.left in PSVHUD.leftMap) || !(tempPos.top in PSVHUD.topMap)) {
        throw 'PhotoSphereViewer: unable to parse tooltip position "' + marker.tooltip.position + '"';
      }
      
      marker.tooltip.position = [PSVHUD.topMap[tempPos.top], PSVHUD.leftMap[tempPos.left]];
    }
    else {
      marker.tooltip.position = ['top', 'center'];
    }
    
    marker.$el.classList.add('has-tooltip');
  }
  
  // parse anchor
  marker.anchor = PSVUtils.parsePosition(marker.anchor);
  
  // convert texture coordinates to spherical coordinates
  if (marker.hasOwnProperty('x') && marker.hasOwnProperty('y')) {
    marker.latitude = PhotoSphereViewer.PI + marker.x / this.psv.prop.size.image_width * PhotoSphereViewer.TwoPI;
    marker.longitude = PhotoSphereViewer.HalfPI - marker.y / this.psv.prop.size.image_height * PhotoSphereViewer.PI;
  }
  
  // compute x/y/z position
  marker.position3D = new THREE.Vector3(
    -Math.cos(marker.longitude) * Math.sin(marker.latitude),
    Math.sin(marker.longitude),
    Math.cos(marker.longitude) * Math.cos(marker.latitude)
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
  var id = typeof marker === 'object' ? marker.id : marker;
  
  if (!this.markers[id]) {
    throw 'PhotoSphereViewer: cannot find marker "' + id + '"';
  }
  
  delete this.markers[id];
  
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
    throw 'PhotoSphereViewer: cannot find marker "' + id + '"';
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
  this.psv.animate(marker.latitude, marker.longitude, duration);
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
 * Show the tooltip for a specific marker
 * @param tooltip (Object) content, className, position
 * @param marker (Object) target for positioning: width, height, position2D(top, left)
 * @return (void)
 */
PSVHUD.prototype.showTooltip = function(tooltip, marker) {
  var t = this.tooltip;
  var c = t.querySelector('.content');
  var a = t.querySelector('.arrow');
  
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
  setTimeout(function() {
    t.classList.add('visible');
  }, 100);
};

/**
 * Compute the position of the tooltip and its arrow
 * @param style (Object) tooltip style
 * @param marker (Object)
 * @return (void)
 */
PSVHUD.prototype._computeTooltipPosition = function(style, marker) {
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
 * Hide the tooltip
 * @return (void)
 */
PSVHUD.prototype.hideTooltip = function() {
  this.tooltip.classList.remove('visible');
};