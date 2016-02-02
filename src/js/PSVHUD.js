/**
 * HUD class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVHUD(psv) {
  PSVComponent.call(this, psv);

  this.markers = {};
  this.currentMarker = null;

  this.create();
}

PSVHUD.prototype = Object.create(PSVComponent.prototype);
PSVHUD.prototype.constructor = PSVHUD;

PSVHUD.publicMethods = ['addMarker', 'removeMarker', 'getMarker', 'getCurrentMarker', 'gotoMarker', 'hideMarker', 'showMarker', 'toggleMarker'];

/**
 * Creates the HUD
 * @return (void)
 */
PSVHUD.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.container.className = 'psv-hud';

  // Markers events via delegation
  this.container.addEventListener('mouseenter', this, true);
  this.container.addEventListener('mouseleave', this, true);

  // Viewer events
  this.psv.on('_click', this);
  this.psv.on('render', this);
};

/**
 * Destroys the HUD
 */
PSVHUD.prototype.destroy = function() {
  this.container.removeEventListener('mouseenter', this);
  this.container.removeEventListener('mouseleave', this);

  this.psv.off('_click', this);
  this.psv.off('render', this);

  PSVComponent.prototype.destroy.call(this);
};

/**
 * Handle events
 * @param e (Event)
 */
PSVHUD.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'mouseenter': this._onMouseEnter(e); break;
    case 'mouseleave': this._onMouseLeave(e); break;
    case 'psv:_click': this._onClick(e.args[0]); break;
    case 'psv:render': this.updatePositions(); break;
    // @formatter:on
  }
};

/**
 * Add a new marker to HUD
 * @param marker (Object)
 * @param render (Boolean) "false" to disable immediate render
 * @return (Object) a modified marker object
 */
PSVHUD.prototype.addMarker = function(marker, render) {
  if (!marker.id) {
    throw new PSVError('missing marker id');
  }

  if (this.markers[marker.id]) {
    throw new PSVError('marker "' + marker.id + '" already exists');
  }

  if (!marker.width || !marker.height) {
    throw new PSVError('missing marker width/height');
  }

  if (!marker.image && !marker.text) {
    throw new PSVError('missing marker image/text');
  }

  if ((!marker.hasOwnProperty('x') || !marker.hasOwnProperty('y')) && (!marker.hasOwnProperty('latitude') || !marker.hasOwnProperty('longitude'))) {
    throw new PSVError('missing marker position, latitude/longitude or x/y');
  }

  marker = PSVUtils.clone(marker);

  // create DOM
  marker.$el = document.createElement('div');
  marker.$el.id = 'psv-marker-' + marker.id;
  marker.$el.psvMarker = marker;
  marker.$el.className = 'psv-marker';

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

  if (marker.style) {
    Object.getOwnPropertyNames(marker.style).forEach(function(prop) {
      style[prop] = marker.style[prop];
    });
  }

  if (marker.image) {
    style.backgroundImage = 'url(' + marker.image + ')';
  }
  else {
    marker.$el.innerHTML = marker.text;
  }

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

  if (render !== false) {
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
 * @param render (Boolean) "false" to disable immediate render
 * @return (void)
 */
PSVHUD.prototype.removeMarker = function(marker, render) {
  marker = this.getMarker(marker);

  marker.$el.parentNode.removeChild(marker.$el);
  delete this.markers[marker.id];

  if (render !== false) {
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
  this.getMarker(marker).visible ^= true;
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
    position.left + marker.width >= 0 &&
    position.left - marker.width <= this.psv.prop.size.width &&
    position.top + marker.height >= 0 &&
    position.top - marker.height <= this.psv.prop.size.height;
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
 * The mouse button is release : show/hide the panel if threshold was not reached, or do nothing
 * @param e (Event)
 * @return (void)
 */
PSVHUD.prototype._onClick = function(e) {
  if (!this.psv.prop.moved) {
    var marker;
    if (e.target && (marker = PSVUtils.getClosest(e.target, '.psv-marker')) && marker.psvMarker) {
      this.currentMarker = marker.psvMarker;
      this.psv.trigger('select-marker', marker.psvMarker);
      e.preventDefault(); // prevent the public "click" event
    }
    else if (this.currentMarker) {
      this.currentMarker = null;
      this.psv.trigger('unselect-marker');
    }

    if (marker && marker.psvMarker && marker.psvMarker.content) {
      this.psv.panel.showPanel(marker.psvMarker.content);
    }
    else if (this.psv.panel.prop.opened) {
      e.preventDefault(); // prevent the public "click" event
      this.psv.panel.hidePanel();
    }
  }
};
