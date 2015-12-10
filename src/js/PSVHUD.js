/**
 * HUD class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVHUD = function(psv) {
  this.psv = psv;
  this.container = null;
  this.markers = [];
  this.prop = {
    onEdge: false,
    hFov: 0,
    vFov: 0,
    visible: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  };
  
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
  marker.$el.style.display = 'none';
  
  marker.position = new THREE.Vector3(
    Math.cos(marker.longitude) * Math.sin(marker.latitude),
    Math.sin(marker.longitude),
    Math.cos(marker.longitude) * Math.cos(marker.latitude)
  );
  
  // TODO : clean coordinates
  
  this.container.appendChild(marker.$el);
};

/**
 * Update visibility and position of all markers
 */
PSVHUD.prototype.updatePositions = function() {
  // compute visible camera "cone"
  this.prop.onEdge = false;
  
  this.prop.vFov = this.psv.camera.fov * Math.PI / 180;
  this.prop.hFov = 2 * Math.atan(Math.tan(this.prop.vFov / 2) * this.psv.camera.aspect);
  
  this.prop.visible.top = this.psv.prop.phi + this.prop.vFov/2;
  this.prop.visible.right = this.psv.prop.theta + this.prop.hFov/2;
  this.prop.visible.bottom = this.psv.prop.phi - this.prop.vFov/2;
  this.prop.visible.left = this.psv.prop.theta - this.prop.hFov/2;
  
  if (this.prop.visible.right >= PhotoSphereViewer.TwoPI) {
    this.prop.visible.right-= PhotoSphereViewer.TwoPI;
    this.prop.onEdge = 'r';
  }
  if (this.prop.visible.left < 0) {
    this.prop.visible.left+= PhotoSphereViewer.TwoPI;
    this.prop.onEdge = 'l';
  }
  
  this.psv.camera.updateProjectionMatrix();

  // update each marker
  this.markers.forEach(function(marker) {
    if (this.isMarkerVisible(marker)) {
      var position = this.getMarkerPosition(marker);
      marker.$el.style.display = 'block';
      marker.$el.style.transform = 'translate3D(' + position.left + 'px, ' + position.top + 'px, 0px)';
    }
    else {
      marker.$el.style.display = 'none';
    }
  }, this);
};

/**
 * Determine if a marker is visible
 * @param marker (Obkect)
 * @return (Boolean)
 */
PSVHUD.prototype.isMarkerVisible = function(marker) {
  return marker.longitude >= this.prop.visible.bottom &&
    marker.longitude <= this.prop.visible.top &&
    (
      (
        this.prop.onEdge &&
        (
          marker.latitude <= this.prop.visible.right ||
          marker.latitude >= this.prop.visible.left
        )
      ) ||
      (
        !this.prop.onEdge &&
        marker.latitude <= this.prop.visible.right &&
        marker.latitude >= this.prop.visible.left
      )
    );
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