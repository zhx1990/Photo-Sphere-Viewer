/**
 * HUD class
 * @param {PhotoSphereViewer} psv
 * @constructor
 * @extends module:components.PSVComponent
 * @memberof module:components
 */
function PSVHUD(psv) {
  PSVComponent.call(this, psv);

  /**
   * SVG container
   * @member {SVGElement}
   * @protected
   */
  this.$svg = null;

  /**
   * @member {Object.<string, PSVMarker>}
   */
  this.markers = {};

  /**
   * @member {PSVMarker}
   * @readonly
   */
  this.currentMarker = null;

  /**
   * @member {PSVMarker}
   * @readonly
   */
  this.hoveringMarker = null;

  this.create();
}

PSVHUD.prototype = Object.create(PSVComponent.prototype);
PSVHUD.prototype.constructor = PSVHUD;

PSVHUD.className = 'psv-hud';
PSVHUD.publicMethods = [
  'addMarker',
  'removeMarker',
  'updateMarker',
  'clearMarkers',
  'getMarker',
  'getCurrentMarker',
  'gotoMarker',
  'hideMarker',
  'showMarker',
  'toggleMarker'
];

/**
 * Creates the HUD
 */
PSVHUD.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.$svg = document.createElementNS(PSVUtils.svgNS, 'svg');
  this.$svg.setAttribute('class', 'psv-hud-svg-container');
  this.container.appendChild(this.$svg);

  // Markers events via delegation
  this.container.addEventListener('mouseenter', this, true);
  this.container.addEventListener('mouseleave', this, true);
  this.container.addEventListener('mousemove', this, true);

  // Viewer events
  this.psv.on('click', this);
  this.psv.on('render', this);
};

/**
 * Destroys the HUD
 */
PSVHUD.prototype.destroy = function() {
  this.clearMarkers(false);

  this.container.removeEventListener('mouseenter', this);
  this.container.removeEventListener('mouseleave', this);
  this.container.removeEventListener('mousemove', this);

  this.psv.off('click', this);
  this.psv.off('render', this);

  delete this.$svg;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * Handles events
 * @param {Event} e
 * @private
 */
PSVHUD.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'mouseenter':  this._onMouseEnter(e);        break;
    case 'mouseleave':  this._onMouseLeave(e);        break;
    case 'mousemove':   this._onMouseMove(e);         break;
    case 'click':       this._onClick(e.args[0], e);  break;
    case 'render':      this.updatePositions();       break;
    // @formatter:on
  }
};

/**
 * Adds a new marker to HUD
 * @param {Object} properties {@link PSVMarker}
 * @param {boolean} [render=true]
 * @returns {PSVMarker}
 * @throws {PSVError} when the marker's id is missing or already exists
 */
PSVHUD.prototype.addMarker = function(properties, render) {
  if (!properties.id) {
    throw new PSVError('missing marker id');
  }

  if (this.markers[properties.id]) {
    throw new PSVError('marker "' + properties.id + '" already exists');
  }

  var marker = new PSVMarker(properties, this.psv);

  if (marker.isNormal()) {
    this.container.appendChild(marker.$el);
  }
  else {
    this.$svg.appendChild(marker.$el);
  }

  this.markers[marker.id] = marker;

  if (render !== false) {
    this.updatePositions();
  }

  return marker;
};

/**
 * Gets a marker by it's id or external object
 * @param {*} marker
 * @returns {PSVMarker}
 * @throws {PSVError} when the marker cannot be found
 */
PSVHUD.prototype.getMarker = function(marker) {
  var id = typeof marker === 'object' ? marker.id : marker;

  if (!this.markers[id]) {
    throw new PSVError('cannot find marker "' + id + '"');
  }

  return this.markers[id];
};

/**
 * Gets the current selected marker
 * @returns {PSVMarker}
 */
PSVHUD.prototype.getCurrentMarker = function() {
  return this.currentMarker;
};

/**
 * Updates a marker
 * @param {Object} properties {@link PSVMarker}
 * @param {boolean} [render=true]
 * @returns {PSVMarker}
 */
PSVHUD.prototype.updateMarker = function(properties, render) {
  var marker = this.getMarker(properties);

  marker.update(properties);

  if (render !== false) {
    this.updatePositions();
  }

  return marker;
};

/**
 * Removes a marker
 * @param {*} marker
 * @param {boolean} [render=true]
 */
PSVHUD.prototype.removeMarker = function(marker, render) {
  marker = this.getMarker(marker);

  if (marker.isNormal()) {
    this.container.removeChild(marker.$el);
  }
  else {
    this.$svg.removeChild(marker.$el);
  }

  if (this.hoveringMarker == marker) {
    this.psv.tooltip.hideTooltip();
  }

  marker.destroy();
  delete this.markers[marker.id];

  if (render !== false) {
    this.updatePositions();
  }
};

/**
 * Removes all markers
 * @param {boolean} [render=true]
 */
PSVHUD.prototype.clearMarkers = function(render) {
  Object.keys(this.markers).forEach(function(marker) {
    this.removeMarker(marker, false);
  }, this);

  if (render !== false) {
    this.updatePositions();
  }
};

/**
 * Goes to a specific marker
 * @param {*} marker
 * @param {string|int} [duration] {@link PhotoSphereViewer#animate}
 * @return {Promise}  A promise that will be resolved When the animation finis
 */
PSVHUD.prototype.gotoMarker = function(marker, duration) {
  marker = this.getMarker(marker);
  return this.psv.animate(marker, duration);
};

/**
 * Hides a marker
 * @param {*} marker
 */
PSVHUD.prototype.hideMarker = function(marker) {
  this.getMarker(marker).visible = false;
  this.updatePositions();
};

/**
 * Shows a marker
 * @param {*} marker
 */
PSVHUD.prototype.showMarker = function(marker) {
  this.getMarker(marker).visible = true;
  this.updatePositions();
};

/**
 * Toggles a marker
 * @param {*} marker
 */
PSVHUD.prototype.toggleMarker = function(marker) {
  this.getMarker(marker).visible ^= true;
  this.updatePositions();
};

/**
 * Updates the visibility and the position of all markers
 */
PSVHUD.prototype.updatePositions = function() {
  var rotation = !this.psv.isGyroscopeEnabled() ? 0 : this.psv.camera.rotation.z / Math.PI * 180;

  for (var id in this.markers) {
    var marker = this.markers[id];
    var isVisible = marker.visible;

    if (isVisible && marker.isPolygon()) {
      var positions = this._getPolygonPositions(marker);
      isVisible = positions.length > 2;

      if (isVisible) {
        marker.position2D = this._getPolygonDimensions(marker, positions);

        var points = '';
        positions.forEach(function(pos) {
          points += pos.x + ',' + pos.y + ' ';
        });

        marker.$el.setAttributeNS(null, 'points', points);
      }
    }
    else if (isVisible) {
      var position = this._getMarkerPosition(marker);
      isVisible = this._isMarkerVisible(marker, position);

      if (isVisible) {
        marker.position2D = position;

        marker.$el.style.transform = 'translate3D(' + position.x + 'px, ' + position.y + 'px, ' + '0px)' +
          (!marker.lockRotation && rotation ? ' rotateZ(' + rotation + 'deg)' : '');
      }
    }

    PSVUtils.toggleClass(marker.$el, 'psv-marker--visible', isVisible);
  }
};

/**
 * Determines if a point marker is visible<br>
 * It tests if the point is in the general direction of the camera, then check if it's in the viewport
 * @param {PSVMarker} marker
 * @param {PhotoSphereViewer.Point} position
 * @returns {boolean}
 * @private
 */
PSVHUD.prototype._isMarkerVisible = function(marker, position) {
  return marker.position3D.dot(this.psv.prop.direction) > 0 &&
    position.x + marker.width >= 0 &&
    position.x - marker.width <= this.psv.prop.size.width &&
    position.y + marker.height >= 0 &&
    position.y - marker.height <= this.psv.prop.size.height;
};

/**
 * Computes HUD coordinates of a marker
 * @param {PSVMarker} marker
 * @returns {PhotoSphereViewer.Point}
 * @private
 */
PSVHUD.prototype._getMarkerPosition = function(marker) {
  if (marker._dynamicSize) {
    // make the marker visible to get it's size
    marker.$el.classList.add('psv-marker--transparent');
    var rect = marker.$el.getBoundingClientRect();
    marker.$el.classList.remove('psv-marker--transparent');

    marker.width = rect.right - rect.left;
    marker.height = rect.bottom - rect.top;
  }

  var position = this.psv.vector3ToViewerCoords(marker.position3D);

  position.x -= marker.width * marker.anchor.left;
  position.y -= marker.height * marker.anchor.top;

  return position;
};

/**
 * Computes HUD coordinates of each point of a polygon<br>
 * It handles points behind the camera by creating intermediary points suitable for the projector
 * @param {PSVMarker} marker
 * @returns {PhotoSphereViewer.Point[]}
 * @private
 */
PSVHUD.prototype._getPolygonPositions = function(marker) {
  var nbVectors = marker.positions3D.length;

  // compute if each vector is visible
  var positions3D = marker.positions3D.map(function(vector) {
    return {
      vector: vector,
      visible: vector.dot(this.psv.prop.direction) > 0
    };
  }, this);

  // get pairs of visible/invisible vectors for each invisible vector connected to a visible vector
  var toBeComputed = [];
  positions3D.forEach(function(pos, i) {
    if (!pos.visible) {
      var neighbours = [
        i === 0 ? positions3D[nbVectors - 1] : positions3D[i - 1],
        i === nbVectors - 1 ? positions3D[0] : positions3D[i + 1]
      ];

      neighbours.forEach(function(neighbour) {
        if (neighbour.visible) {
          toBeComputed.push({
            visible: neighbour,
            invisible: pos,
            index: i
          });
        }
      });
    }
  });

  // compute intermediary vector for each pair (the loop is reversed for splice to insert at the right place)
  toBeComputed.reverse().forEach(function(pair) {
    positions3D.splice(pair.index, 0, {
      vector: this._getPolygonIntermediaryPoint(pair.visible.vector, pair.invisible.vector),
      visible: true
    });
  }, this);

  // translate vectors to screen pos
  return positions3D
    .filter(function(pos) {
      return pos.visible;
    })
    .map(function(pos) {
      return this.psv.vector3ToViewerCoords(pos.vector);
    }, this);
};

/**
 * Given one point in the same direction of the camera and one point behind the camera,
 * computes an intermediary point on the great circle delimiting the half sphere visible by the camera.
 * The point is shifted by .01 rad because the projector cannot handle points exactly on this circle.
 * {@link http://math.stackexchange.com/a/1730410/327208}
 * @param P1 {THREE.Vector3}
 * @param P2 {THREE.Vector3}
 * @returns {THREE.Vector3}
 * @private
 */
PSVHUD.prototype._getPolygonIntermediaryPoint = function(P1, P2) {
  var C = this.psv.prop.direction.clone().normalize();
  var N = new THREE.Vector3().crossVectors(P1, P2).normalize();
  var V = new THREE.Vector3().crossVectors(N, P1).normalize();
  var H = new THREE.Vector3().addVectors(P1.clone().multiplyScalar(-C.dot(V)), V.clone().multiplyScalar(C.dot(P1))).normalize();
  var a = new THREE.Vector3().crossVectors(H, C);
  return H.applyAxisAngle(a, 0.01).multiplyScalar(PhotoSphereViewer.SPHERE_RADIUS);
};

/**
 * Computes the boundaries positions of a polygon marker
 * @param {PSVMarker} marker - alters width and height
 * @param {PhotoSphereViewer.Point[]} positions
 * @returns {PhotoSphereViewer.Point}
 * @private
 */
PSVHUD.prototype._getPolygonDimensions = function(marker, positions) {
  var minX = +Infinity;
  var minY = +Infinity;
  var maxX = -Infinity;
  var maxY = -Infinity;

  positions.forEach(function(pos) {
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x);
    maxY = Math.max(maxY, pos.y);
  });

  marker.width = maxX - minX;
  marker.height = maxY - minY;

  return {
    x: minX,
    y: minY
  };
};

/**
 * Handles mouse enter events, show the tooltip
 * @param {MouseEvent} e
 * @private
 */
PSVHUD.prototype._onMouseEnter = function(e) {
  var marker;
  if (e.target && (marker = e.target.psvMarker) && marker.tooltip && !marker.isPolygon()) {
    this.hoveringMarker = marker;

    this.psv.tooltip.showTooltip({
      content: marker.tooltip.content,
      position: marker.tooltip.position,
      left: marker.position2D.x,
      top: marker.position2D.y,
      box: {
        width: marker.width,
        height: marker.height
      }
    });
  }
};

/**
 * Handles mouse leave events, hide the tooltip
 * @param {MouseEvent} e
 * @private
 */
PSVHUD.prototype._onMouseLeave = function(e) {
  var marker;
  if (e.target && (marker = e.target.psvMarker)) {
    // do not hide if we enter the tooltip itself while hovering a polygon
    if (marker.isPolygon() && e.relatedTarget && PSVUtils.hasParent(e.relatedTarget, this.psv.tooltip.container)) {
      return;
    }

    this.hoveringMarker = null;

    this.psv.tooltip.hideTooltip();
  }
};

/**
 * Handles mouse move events, refresh the tooltip for polygon markers
 * @param {MouseEvent} e
 * @private
 */
PSVHUD.prototype._onMouseMove = function(e) {
  if (!this.psv.prop.moving) {
    var marker;
    // do not hide if we enter the tooltip while hovering a polygon
    if (e.target && (marker = e.target.psvMarker) && marker.tooltip && marker.isPolygon() ||
      e.target && PSVUtils.hasParent(e.target, this.psv.tooltip.container) && (marker = this.hoveringMarker)) {

      this.hoveringMarker = marker;

      var boundingRect = this.psv.container.getBoundingClientRect();

      this.psv.tooltip.showTooltip({
        content: marker.tooltip.content,
        position: marker.tooltip.position,
        top: e.clientY - boundingRect.top - this.psv.config.tooltip.arrow_size / 2,
        left: e.clientX - boundingRect.left - this.psv.config.tooltip.arrow_size,
        box: { // separate the tooltip from the cursor
          width: this.psv.config.tooltip.arrow_size * 2,
          height: this.psv.config.tooltip.arrow_size * 2
        }
      });
    }
    else if (this.hoveringMarker && this.hoveringMarker.isPolygon()) {
      this.psv.tooltip.hideTooltip();
    }
  }
};

/**
 * Handles mouse click events, select the marker and open the panel if necessary
 * @param {Object} data
 * @param {Event} e
 * @fires module:components.PSVHUD.select-marker
 * @fires module:components.PSVHUD.unselect-marker
 * @private
 */
PSVHUD.prototype._onClick = function(data, e) {
  var marker;
  if (data.target && (marker = PSVUtils.getClosest(data.target, '.psv-marker')) && marker.psvMarker) {
    this.currentMarker = marker.psvMarker;

    /**
     * @event select-marker
     * @memberof module:components.PSVHUD
     * @param {PSVMarker} marker
     */
    this.psv.trigger('select-marker', this.currentMarker);

    if (this.psv.config.click_event_on_marker) {
      // add the marker to event data
      data.marker = marker.psvMarker;
    }
    else {
      e.stopPropagation();
    }
  }
  else if (this.currentMarker) {
    /**
     * @event unselect-marker
     * @memberof module:components.PSVHUD
     * @param {PSVMarker} marker
     */
    this.psv.trigger('unselect-marker', this.currentMarker);

    this.currentMarker = null;
  }

  if (marker && marker.psvMarker && marker.psvMarker.content) {
    this.psv.panel.showPanel(marker.psvMarker.content);
  }
  else if (this.psv.panel.prop.opened) {
    e.stopPropagation();
    this.psv.panel.hidePanel();
  }
};
