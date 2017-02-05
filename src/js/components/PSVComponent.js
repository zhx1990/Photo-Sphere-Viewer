/**
 * Base sub-component class
 * @param {PhotoSphereViewer | PSVComponent} parent - the parent with a "container" property
 * @constructor
 */
function PSVComponent(parent) {
  /**
   * @member {PhotoSphereViewer}
   * @readonly
   */
  this.psv = parent instanceof PhotoSphereViewer ? parent : parent.psv;

  /**
   * @member {PhotoSphereViewer|PSVComponent}
   * @readonly
   */
  this.parent = parent;

  /**
   * @member {HTMLElement}
   * @readonly
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
 * @name publicMethods
 * @description List of component's methods which are bound the the main viewer
 * @memberof PSVComponent
 * @type {string[]}
 * @static
 * @readonly
 */

/**
 * @name className
 * @description CSS class added to the component's container
 * @memberof PSVComponent
 * @type {string}
 * @static
 * @readonly
 */

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
