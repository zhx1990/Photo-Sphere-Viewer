/**
 * Starts to load the panorama
 * @returns {Promise}
 * @throws {PSVError} when the panorama is not configured
 */
PhotoSphereViewer.prototype.load = function() {
  if (!this.config.panorama) {
    throw new PSVError('No value given for panorama.');
  }

  return this.setPanorama(this.config.panorama, false);
};

/**
 * Returns the current position of the camera
 * @returns {PhotoSphereViewer.Position}
 */
PhotoSphereViewer.prototype.getPosition = function() {
  return {
    longitude: this.prop.longitude,
    latitude: this.prop.latitude
  };
};

/**
 * Returns the current zoom level
 * @returns {int}
 */
PhotoSphereViewer.prototype.getZoomLevel = function() {
  return this.prop.zoom_lvl;
};

/**
 * Returns the current viewer size
 * @returns {PhotoSphereViewer.Size}
 */
PhotoSphereViewer.prototype.getSize = function() {
  return {
    width: this.prop.size.width,
    height: this.prop.size.height
  };
};

/**
 * Checks if the automatic rotation is enabled
 * @returns {boolean}
 */
PhotoSphereViewer.prototype.isAutorotateEnabled = function() {
  return !!this.prop.autorotate_reqid;
};

/**
 * Checks if the gyroscope is enabled
 * @returns {boolean}
 */
PhotoSphereViewer.prototype.isGyroscopeEnabled = function() {
  return !!this.prop.orientation_reqid;
};

/**
 * Checks if the viewer is in fullscreen
 * @returns {boolean}
 */
PhotoSphereViewer.prototype.isFullscreenEnabled = function() {
  return PSVUtils.isFullscreenEnabled(this.container);
};

/**
 * Performs a render
 * @param {boolean} [updateDirection=true] - should update camera direction
 * @fires PhotoSphereViewer.render
 */
PhotoSphereViewer.prototype.render = function(updateDirection) {
  if (updateDirection !== false) {
    this.prop.direction = this.sphericalCoordsToVector3(this.prop);

    if (this.config.fisheye) {
      this.prop.direction.multiplyScalar(this.config.fisheye / 2);
      this.camera.position.copy(this.prop.direction).negate();
    }

    this.camera.lookAt(this.prop.direction);
    // this.camera.rotation.z = 0;
  }

  this.camera.aspect = this.prop.aspect;
  this.camera.fov = this.prop.vFov;
  this.camera.updateProjectionMatrix();

  if (this.composer) {
    this.composer.render();
  }
  else {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * @event render
   * @memberof PhotoSphereViewer
   */
  this.trigger('render');
};

/**
 * Destroys the viewer
 */
PhotoSphereViewer.prototype.destroy = function() {
  this.stopAll();
  this.stopKeyboardControl();

  if (this.isFullscreenEnabled()) {
    PSVUtils.exitFullscreen();
  }

  // remove listeners
  window.removeEventListener('resize', this);

  if (this.config.mousemove) {
    this.hud.container.removeEventListener('mousedown', this);
    this.hud.container.removeEventListener('touchstart', this);
    window.removeEventListener('mouseup', this);
    window.removeEventListener('touchend', this);
    this.hud.container.removeEventListener('mousemove', this);
    this.hud.container.removeEventListener('touchmove', this);
  }

  if (PhotoSphereViewer.SYSTEM.fullscreenEvent) {
    document.removeEventListener(PhotoSphereViewer.SYSTEM.fullscreenEvent, this);
  }

  if (this.config.mousewheel) {
    this.hud.container.removeEventListener(PhotoSphereViewer.SYSTEM.mouseWheelEvent, this);
  }

  // destroy components
  if (this.tooltip) this.tooltip.destroy();
  if (this.hud) this.hud.destroy();
  if (this.loader) this.loader.destroy();
  if (this.navbar) this.navbar.destroy();
  if (this.panel) this.panel.destroy();
  if (this.doControls) this.doControls.disconnect();

  // destroy ThreeJS view
  if (this.scene) {
    this.scene.remove(this.camera);
    this.scene.remove(this.mesh);
  }

  if (this.mesh) {
    this.mesh.geometry.dispose();
    this.mesh.geometry = null;
    this.mesh.material.map.dispose();
    this.mesh.material.map = null;
    this.mesh.material.dispose();
    this.mesh.material = null;
  }

  // remove container
  if (this.canvas_container) {
    this.container.removeChild(this.canvas_container);
  }
  this.parent.removeChild(this.container);

  delete this.parent.photoSphereViewer;

  // clean references
  delete this.parent;
  delete this.container;
  delete this.loader;
  delete this.navbar;
  delete this.hud;
  delete this.panel;
  delete this.tooltip;
  delete this.canvas_container;
  delete this.renderer;
  delete this.composer;
  delete this.scene;
  delete this.camera;
  delete this.mesh;
  delete this.doControls;
  delete this.raycaster;
  delete this.passes;
  delete this.config;
  this.prop.cache.length = 0;
};

/**
 * Loads a panorama file<br>
 * If the "position" is not defined, the camera will not move and the ongoing animation will continue<br>
 * "config.transition" must be configured for "transition" to be taken in account
 * @param {string} path - URL of the new panorama file
 * @param {PhotoSphereViewer.ExtendedPosition} [position]
 * @param {boolean} [transition=false]
 * @returns {Promise}
 * @throws {PSVError} when another panorama is already loading
 */
PhotoSphereViewer.prototype.setPanorama = function(path, position, transition) {
  if (this.prop.loading_promise !== null) {
    throw new PSVError('Loading already in progress');
  }

  if (typeof position == 'boolean') {
    transition = position;
    position = undefined;
  }

  if (position) {
    this.cleanPosition(position);

    this.stopAll();
  }

  this.config.panorama = path;

  var self = this;

  if (!transition || !this.config.transition || !this.scene) {
    this.loader = new PSVLoader(this);

    this.prop.loading_promise = this._loadTexture(this.config.panorama)
      .ensure(function() {
        if (self.loader) {
          self.loader.destroy();
          self.loader = null;
        }

        self.prop.loading_promise = null;
      })
      .then(function(texture) {
        self._setTexture(texture);

        if (position) {
          self.rotate(position);
        }
      })
      .rethrow();
  }
  else {
    if (this.config.transition.loader) {
      this.loader = new PSVLoader(this);
    }

    this.prop.loading_promise = this._loadTexture(this.config.panorama)
      .then(function(texture) {
        if (self.loader) {
          self.loader.destroy();
          self.loader = null;
        }

        return self._transition(texture, position);
      })
      .ensure(function() {
        if (self.loader) {
          self.loader.destroy();
          self.loader = null;
        }

        self.prop.loading_promise = null;
      })
      .rethrow();
  }

  return this.prop.loading_promise;
};

/**
 * Stops all current animations
 */
PhotoSphereViewer.prototype.stopAll = function() {
  this.stopAutorotate();
  this.stopAnimation();
  this.stopGyroscopeControl();
};

/**
 * Starts the autorotate animation
 * @fires PhotoSphereViewer.autorotate
 */
PhotoSphereViewer.prototype.startAutorotate = function() {
  this.stopAll();

  var self = this;
  var last = null;
  var elapsed = null;

  (function run(timestamp) {
    if (timestamp) {
      elapsed = last === null ? 0 : timestamp - last;
      last = timestamp;

      self.rotate({
        longitude: self.prop.longitude + self.config.anim_speed * elapsed / 1000,
        latitude: self.prop.latitude - (self.prop.latitude - self.config.anim_lat) / 200
      });
    }

    self.prop.autorotate_reqid = window.requestAnimationFrame(run);
  }(null));

  /**
   * @event autorotate
   * @memberof PhotoSphereViewer
   * @param {boolean} enabled
   */
  this.trigger('autorotate', true);
};

/**
 * Stops the autorotate animation
 * @fires PhotoSphereViewer.autorotate
 */
PhotoSphereViewer.prototype.stopAutorotate = function() {
  if (this.prop.start_timeout) {
    window.clearTimeout(this.prop.start_timeout);
    this.prop.start_timeout = null;
  }

  if (this.prop.autorotate_reqid) {
    window.cancelAnimationFrame(this.prop.autorotate_reqid);
    this.prop.autorotate_reqid = null;

    this.trigger('autorotate', false);
  }
};

/**
 * Toggles the autorotate animation
 */
PhotoSphereViewer.prototype.toggleAutorotate = function() {
  if (this.isAutorotateEnabled()) {
    this.stopAutorotate();
  }
  else {
    this.startAutorotate();
  }
};

/**
 * Starts the gyroscope interaction
 * @fires PhotoSphereViewer.gyroscope-updated
 */
PhotoSphereViewer.prototype.startGyroscopeControl = function() {
  if (!this.config.gyroscope) {
    console.warn('PhotoSphereViewer: gyroscope disabled');
    return;
  }

  this.stopAll();

  var self = this;

  (function run() {
    self.doControls.update();
    self.prop.direction = self.camera.getWorldDirection();

    var sphericalCoords = self.vector3ToSphericalCoords(self.prop.direction);
    self.prop.longitude = sphericalCoords.longitude;
    self.prop.latitude = sphericalCoords.latitude;

    self.render(false);

    self.prop.orientation_reqid = window.requestAnimationFrame(run);
  }());

  /**
   * @event gyroscope-updated
   * @memberof PhotoSphereViewer
   * @param {boolean} enabled
   */
  this.trigger('gyroscope-updated', true);
};

/**
 * Stops the gyroscope interaction
 * @fires PhotoSphereViewer.gyroscope-updated
 */
PhotoSphereViewer.prototype.stopGyroscopeControl = function() {
  if (this.prop.orientation_reqid) {
    window.cancelAnimationFrame(this.prop.orientation_reqid);
    this.prop.orientation_reqid = null;

    this.trigger('gyroscope-updated', false);

    this.render();
  }
};

/**
 * Toggles the gyroscope interaction
 */
PhotoSphereViewer.prototype.toggleGyroscopeControl = function() {
  if (this.isGyroscopeEnabled()) {
    this.stopGyroscopeControl();
  }
  else {
    this.startGyroscopeControl();
  }
};

/**
 * Rotates the camera
 * @param {PhotoSphereViewer.ExtendedPosition} position
 * @param {boolean} [render=true]
 * @fires PhotoSphereViewer._side-reached
 * @fires PhotoSphereViewer.position-updated
 */
PhotoSphereViewer.prototype.rotate = function(position, render) {
  this.cleanPosition(position);

  /**
   * @event _side-reached
   * @memberof PhotoSphereViewer
   * @param {string} side
   * @private
   */
  this.applyRanges(position).forEach(
    this.trigger.bind(this, '_side-reached')
  );

  this.prop.longitude = position.longitude;
  this.prop.latitude = position.latitude;

  if (render !== false && this.renderer) {
    this.render();

    /**
     * @event position-updated
     * @memberof PhotoSphereViewer
     * @param {PhotoSphereViewer.Position} position
     */
    this.trigger('position-updated', this.getPosition());
  }
};

/**
 * Rotates the camera with animation
 * @param {PhotoSphereViewer.ExtendedPosition} position
 * @param {string|int} duration - animation speed or duration (in milliseconds)
 * @return {Promise}
 */
PhotoSphereViewer.prototype.animate = function(position, duration) {
  this.stopAll();

  if (!duration) {
    this.rotate(position);

    return D.resolved();
  }

  this.cleanPosition(position);
  this.applyRanges(position).forEach(
    this.trigger.bind(this, '_side-reached')
  );

  if (!duration && typeof duration != 'number') {
    // desired radial speed
    duration = duration ? PSVUtils.parseSpeed(duration) : this.config.anim_speed;
    // get the angle between current position and target
    var angle = Math.acos(
      Math.cos(this.prop.latitude) * Math.cos(position.latitude) * Math.cos(this.prop.longitude - position.longitude) +
      Math.sin(this.prop.latitude) * Math.sin(position.latitude)
    );
    // compute duration
    duration = angle / duration * 1000;
  }

  // longitude offset for shortest arc
  var tOffset = PSVUtils.getShortestArc(this.prop.longitude, position.longitude);

  this.prop.animation_promise = PSVUtils.animation({
    properties: {
      longitude: { start: this.prop.longitude, end: this.prop.longitude + tOffset },
      latitude: { start: this.prop.latitude, end: position.latitude }
    },
    duration: duration,
    easing: 'inOutSine',
    onTick: this.rotate.bind(this)
  });

  return this.prop.animation_promise;
};

/**
 * Stops the ongoing animation
 */
PhotoSphereViewer.prototype.stopAnimation = function() {
  if (this.prop.animation_promise) {
    this.prop.animation_promise.cancel();
    this.prop.animation_promise = null;
  }
};

/**
 * Zooms
 * @param {int} level - new zoom level from 0 to 100
 * @param {boolean} [render=true]
 * @fires PhotoSphereViewer.zoom-updated
 */
PhotoSphereViewer.prototype.zoom = function(level, render) {
  this.prop.zoom_lvl = PSVUtils.bound(Math.round(level), 0, 100);
  this.prop.vFov = this.config.max_fov + (this.prop.zoom_lvl / 100) * (this.config.min_fov - this.config.max_fov);
  this.prop.hFov = 2 * Math.atan(Math.tan(this.prop.vFov * Math.PI / 180 / 2) * this.prop.aspect) * 180 / Math.PI;

  if (render !== false && this.renderer) {
    this.render();

    /**
     * @event zoom-updated
     * @memberof PhotoSphereViewer
     * @param {int} zoomLevel
     */
    this.trigger('zoom-updated', this.getZoomLevel());
  }
};

/**
 * Zooms in
 */
PhotoSphereViewer.prototype.zoomIn = function() {
  if (this.prop.zoom_lvl < 100) {
    this.zoom(this.prop.zoom_lvl + 1);
  }
};

/**
 * Zooms out
 */
PhotoSphereViewer.prototype.zoomOut = function() {
  if (this.prop.zoom_lvl > 0) {
    this.zoom(this.prop.zoom_lvl - 1);
  }
};

/**
 * Toggles fullscreen
 */
PhotoSphereViewer.prototype.toggleFullscreen = function() {
  if (!this.isFullscreenEnabled()) {
    PSVUtils.requestFullscreen(this.container);
  }
  else {
    PSVUtils.exitFullscreen();
  }
};

/**
 * Starts listening keyboard events
 */
PhotoSphereViewer.prototype.startKeyboardControl = function() {
  window.addEventListener('keydown', this);
};

/**
 * Stops listening keyboard events
 */
PhotoSphereViewer.prototype.stopKeyboardControl = function() {
  window.removeEventListener('keydown', this);
};

/**
 * Preload a panorama file without displaying it
 * @param {string} panorama
 * @returns {Promise}
 * @throws {PSVError} when the cache is disabled
 */
PhotoSphereViewer.prototype.preloadPanorama = function(panorama) {
  if (!this.config.cache_texture) {
    throw new PSVError('Cannot preload panorama, cache_texture is disabled');
  }

  return this._loadTexture(panorama);
};

/**
 * Removes a specific panorama from the cache or clear the entire cache
 * @param {string} [panorama]
 * @throws {PSVError} when the cache is disabled
 */
PhotoSphereViewer.prototype.clearPanoramaCache = function(panorama) {
  if (!this.config.cache_texture) {
    throw new PSVError('Cannot clear cache, cache_texture is disabled');
  }

  if (panorama) {
    for (var i = 0, l = this.prop.cache.length; i < l; i++) {
      if (this.prop.cache[i].panorama === panorama) {
        this.prop.cache.splice(i, 1);
        break;
      }
    }
  }
  else {
    this.prop.cache.length = 0;
  }
};

/**
 * Retrieves the cache for a panorama
 * @param {string} panorama
 * @returns {PhotoSphereViewer.CacheItem}
 * @throws {PSVError} when the cache is disabled
 */
PhotoSphereViewer.prototype.getPanoramaCache = function(panorama) {
  if (!this.config.cache_texture) {
    throw new PSVError('Cannot query cache, cache_texture is disabled');
  }

  return this.prop.cache.filter(function(cache) {
    return cache.panorama === panorama;
  }).shift();
};
