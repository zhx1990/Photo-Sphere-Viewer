/**
 * @module components
 */

/**
 * Base sub-component class
 * @param {PhotoSphereViewer | module:components.PSVComponent} parent
 * @constructor
 * @memberof module:components
 */
function PSVComponent(parent) {
  /**
   * @member {PhotoSphereViewer}
   * @readonly
   * @protected
   */
  this.psv = parent instanceof PhotoSphereViewer ? parent : parent.psv;

  /**
   * @member {PhotoSphereViewer|module:components.PSVComponent}
   * @readonly
   * @protected
   */
  this.parent = parent;

  /**
   * @member {HTMLElement}
   * @readonly
   * @protected
   */
  this.container = null;

  // expose some methods to the viewer
  if (this.constructor.publicMethods) {
    this.constructor.publicMethods.forEach(function(method) {
      this.psv[method] = this[method].bind(this);
    }, this);
  }
}

/**
 * CSS class added to the component's container
 * @member {string}
 * @readonly
 */
PSVComponent.className = null;

/**
 * List of component's methods which are bound the the main viewer
 * @member {string[]}
 * @readonly
 */
PSVComponent.publicMethods = [];

/**
 * Creates the component
 */
PSVComponent.prototype.create = function() {
  this.container = document.createElement('div');

  if (this.constructor.className) {
    this.container.className = this.constructor.className;
  }

  this.parent.container.appendChild(this.container);
};

/**
 * Destroys the component
 */
PSVComponent.prototype.destroy = function() {
  this.parent.container.removeChild(this.container);

  if (this.constructor.publicMethods) {
    this.constructor.publicMethods.forEach(function(method) {
      delete this.psv[method];
    }, this);
  }

  delete this.container;
  delete this.psv;
  delete this.parent;
};

/**
 * Hides the component
 */
PSVComponent.prototype.hide = function() {
  this.container.style.display = 'none';
};

/**
 * Displays the component
 */
PSVComponent.prototype.show = function() {
  this.container.style.display = null;
};
