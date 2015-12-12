/**
 * HUD class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVHUD = function(psv) {
  this.psv = psv;
  this.config = this.psv.config.tooltip;
  this.container = null;
  this.tooltip = null;
  this.panel = null;
  this.markers = [];
  
  this.create();
  
  this.psv.on('render', this.updatePositions.bind(this));
};

PSVHUD.leftMap = {0: 'left', 0.5: 'center', 1: 'right'};
PSVHUD.topMap = {0: 'top', 0.5: 'center', 1: 'bottom'};

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
  
  // Panel
  this.panel = document.createElement('aside');
  this.panel.className = 'psv-panel';
  this.container.appendChild(this.panel);
  
  // Markers events via delegation
  this.container.addEventListener('mouseenter', this._onMouseEnter.bind(this), true);
  this.container.addEventListener('mouseleave', this._onMouseLeave.bind(this), true);
  this.container.addEventListener('mousedown', this._onMouseClick.bind(this), true);
  
  // Prevent event bubling from panel
  var stopPropagation = function(e) {
    e.stopPropagation();
  };
  
  if (this.psv.config.mousewheel) {
    this.panel.addEventListener(PSVUtils.mouseWheelEvent(), stopPropagation);
  }
  
  if (this.psv.config.mousemove) {
    PSVUtils.addEvents(this.panel, 'mousedown touchstart mouseup touchend mousemove touchmove', stopPropagation);
  }
};

/**
 * The mouse enters a marker
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onMouseEnter = function(e) {
  if (e.target && e.target.psvMarker && e.target.psvMarker.tooltip) {
    this.showTooltip(e.target.psvMarker);
  }
};

/**
 * The mouse leaves a marker
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onMouseLeave = function(e) {
  if (e.target && e.target.psvMarker) {
    this.hideTooltip();
  }
};

/**
 * Click on a marker or outside a marker
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onMouseClick = function(e) {
  if (e.target && e.target.psvMarker && e.target.psvMarker.content) {
    this.showPanel(e.target.psvMarker);
  }
  else if (!PSVUtils.hasParent(e.target, this.panel)) {
    this.hidePanel();
  }
};

/**
 * Returns the HUD itself
 * @return (HTMLElement)
 */
PSVHUD.prototype.getHUD = function() {
  return this.container;
};

/**
 * Add a new marker to HUD
 * @param marker (Object)
 * @return (void)
 */
PSVHUD.prototype.addMarker = function(marker) {
  if (!marker.width || !marker.height) {
    throw 'PhotoSphereViewer: missing marker width and/or height';
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
  
  // save
  this.markers.push(marker);
  this.container.appendChild(marker.$el);
};

/**
 * Update visibility and position of all markers
 * @return (void)
 */
PSVHUD.prototype.updatePositions = function() {
  this.psv.camera.updateProjectionMatrix();

  this.markers.forEach(function(marker) {
    var position = this.getMarkerPosition(marker);
    
    if (this.isMarkerVisible(marker, position)) {
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
  }, this);
};

/**
 * Determine if a marker is visible
 * It tests if the point is in the general direction of the camera, then check if it's in the viewport
 * @param marker (Object)
 * @param position (Object)
 * @return (Boolean)
 */
PSVHUD.prototype.isMarkerVisible = function(marker, position) {
  return marker.position3D.dot(this.psv.prop.direction) > 0 &&
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
PSVHUD.prototype.getMarkerPosition = function(marker) {
  var vector = marker.position3D.clone();
  vector.project(this.psv.camera);

  return {
    top: (1 - vector.y) / 2 * this.psv.prop.size.height - marker.height * marker.anchor.top,
    left: (vector.x + 1) / 2 * this.psv.prop.size.width - marker.width * marker.anchor.left
  };
};

/**
 * Show the tooltip for a specific marker
 * @param marker (Object)
 * @return (void)
 */
PSVHUD.prototype.showTooltip = function(marker) {
  var t = this.tooltip;
  var c = t.querySelector('.content');
  var a = t.querySelector('.arrow');
  
  t.className = 'psv-tooltip'; // reset the class
  if (marker.tooltip.className) {
    t.classList.add(marker.tooltip.className);
  }

  c.innerHTML = marker.tooltip.content;
  t.style.top = '0px';
  t.style.left = '0px';
  
  // compute size
  var rect = t.getBoundingClientRect();
  var style = {
    posClass: marker.tooltip.position.slice(),
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

/**
 * Show the panel for a specific marker
 * @param marker (Object)
 * @return (void)
 */
PSVHUD.prototype.showPanel = function(marker) {
  var p = this.panel;
  
  p.innerHTML = marker.content;
  p.classList.add('open');
  p.scrollTop = 0;
};


/**
 * Hide the panel
 * @return (void)
 */
PSVHUD.prototype.hidePanel = function() {
  this.panel.classList.remove('open');
};