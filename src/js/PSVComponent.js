/**
 * Base sub-component class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVComponent(psv) {
  this.psv = psv;
  this.container = null;

  // expose some methods to the viewer
  if (this.constructor.publicMethods) {
    this.constructor.publicMethods.forEach(function(method) {
      this.psv[method] = this[method].bind(this);
    }, this);
  }
}

/**
 * Creates the component
 */
PSVComponent.prototype.create = function() {
  this.container = document.createElement('div');
  this.psv.container.appendChild(this.container);
};

/**
 * Destroys the component
 */
PSVComponent.prototype.destroy = function() {
  this.psv.container.removeChild(this.container);
  this.container = null;
};
