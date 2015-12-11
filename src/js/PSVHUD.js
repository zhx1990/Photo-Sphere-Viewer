/**
 * HUD class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVHUD = function(psv) {
  this.psv = psv;
  this.container = null;
  this.markers = [];
  
  this.create();
  
  this.psv.on('render', this.updatePositions.bind(this));
};

/**
 * Creates the elements
 * @return (void)
 */
PSVHUD.prototype.create = function() {
  // Container
  this.container = document.createElement('div');
  this.container.className = 'psv-hud';
};

/**
 * Returns the HUD itself
 * @return (HTMLElement) The HUD
 */
PSVHUD.prototype.getHUD = function() {
  return this.container;
};

/**
 * Add a new marker to HUD
 * @param marker (Object)
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
  
  marker.$el = document.createElement('div');
  marker.$el.psvMarker = marker;
  marker.$el.className = 'marker ' + (marker.className||'');
  
  if (marker.tooltip) {
    PSVUtils.addClass(marker.$el, 'has-tooltip');
    marker.$el.setAttribute('data-tooltip', marker.tooltip);
  }
  
  var style = marker.$el.style;
  style.display = 'none';
  style.width = marker.width + 'px';
  style.height = marker.height + 'px';
  style.backgroundImage = 'url(' + marker.image + ')';
  
  marker.anchor = PSVUtils.parsePosition(marker.anchor);
  
  // convert texture coordinates to spherical coordinates
  if (marker.hasOwnProperty('x') && marker.hasOwnProperty('y')) {
    marker.latitude = Math.PI + marker.x / this.psv.prop.size.image_width * PhotoSphereViewer.TwoPI;
    marker.longitude = PhotoSphereViewer.HalfPI - marker.y / this.psv.prop.size.image_height * Math.PI;
  }
  
  marker.position = new THREE.Vector3(
    -Math.cos(marker.longitude) * Math.sin(marker.latitude),
    Math.sin(marker.longitude),
    Math.cos(marker.longitude) * Math.cos(marker.latitude)
  );
  
  this.markers.push(marker);
  this.container.appendChild(marker.$el);
};

/**
 * Update visibility and position of all markers
 */
PSVHUD.prototype.updatePositions = function() {
  this.psv.camera.updateProjectionMatrix();

  this.markers.forEach(function(marker) {
    var position = this.getMarkerPosition(marker);
    
    if (this.isMarkerVisible(marker, position)) {
      marker.$el.style.display = 'block';
      marker.$el.style.transform = 'translate3D(' + 
        (position.left - marker.width * marker.anchor.left) + 'px, ' + 
        (position.top - marker.height * marker.anchor.top) + 'px, ' +
        '0px)';
      
      // correct tooltip position
      if (marker.tooltip) {
        if (this.psv.prop.size.width - (position.left - marker.width * marker.anchor.left) < 100) {
          if (!marker.$el.classList.contains('left')) marker.$el.classList.add('left');
        }
        else {
          marker.$el.classList.remove('left');
        }
        
        if (position.top - marker.height * marker.anchor.top < 100) {
          if (!marker.$el.classList.contains('bottom')) marker.$el.classList.add('bottom');
        }
        else {
          marker.$el.classList.remove('bottom');
        }
      }
    }
    else {
      marker.$el.style.display = 'none';
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
  return marker.position.dot(this.psv.prop.direction) > 0 &&
    position.left - marker.width * marker.anchor.left >= 0 && 
    position.left + marker.width * (1-marker.anchor.left) <= this.psv.prop.size.width &&
    position.top - marker.height * marker.anchor.top >= 0 && 
    position.top + marker.height * (1-marker.anchor.top) <= this.psv.prop.size.height;
};

/**
 * Compute HUD coordinates of a marker
 * @param marker (Object)
 * @return (Object) top and left position
 */
PSVHUD.prototype.getMarkerPosition = function(marker) {
  var vector = marker.position.clone();
  vector.project(this.psv.camera);

  return {
    top: (1 - vector.y) / 2 * this.psv.prop.size.height,
    left: (vector.x + 1) / 2 * this.psv.prop.size.width
  };
};