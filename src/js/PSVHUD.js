/**
 * HUD class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVHUD = function(psv) {
  this.psv = psv;
  this.container = null;
  this.markers = [];
  
  this.create();
  this.psv.config.markers.forEach(this.addMarker.bind(this));
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
  // Clone
  marker = PSVUtils.deepmerge({}, marker);
  this.markers.push(marker);
  
  marker.$el = document.createElement('div');
  marker.$el.className = 'marker';
  
  var style = marker.$el.style;
  style.display = 'none';
  style.width = marker.width + 'px';
  style.height = marker.height + 'px';
  style.backgroundImage = 'url(' + marker.image + ')';
  
  // TODO : texture coordinates to polar coordinates
  // TODO : get image size
  
  marker.Anchor = PSVUtils.parsePosition(marker.anchor);
  
  marker.position = new THREE.Vector3(
    -Math.cos(marker.longitude) * Math.sin(marker.latitude),
    Math.sin(marker.longitude),
    Math.cos(marker.longitude) * Math.cos(marker.latitude)
  );
  
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
        (position.left - marker.width * marker.Anchor.left) + 'px, ' + 
        (position.top - marker.height * marker.Anchor.top) + 'px, ' +
        '0px)';
    }
    else {
      marker.$el.style.display = 'none';
    }
  }, this);
};

/**
 * Determine if a marker is visible
 * @param marker (Object)
 * @param position (Object)
 * @return (Boolean)
 */
PSVHUD.prototype.isMarkerVisible = function(marker, position) {
  return position.left - marker.width * marker.Anchor.left >= 0 && 
    position.left + marker.width * (1-marker.Anchor.left) <= this.psv.prop.size.width &&
    position.top - marker.height * marker.Anchor.top >= 0 && 
    position.top + marker.height * (1-marker.Anchor.top) <= this.psv.prop.size.height;
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