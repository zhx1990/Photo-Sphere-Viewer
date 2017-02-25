/**
 * @module components/buttons
 */

/**
 * Navigation bar button class
 * @param {module:components.PSVNavBar} navbar
 * @constructor
 * @extends module:components.PSVComponent
 * @memberof module:components/buttons
 */
function PSVNavBarButton(navbar) {
  PSVComponent.call(this, navbar);

  /**
   * @member {string}
   * @readonly
   */
  this.id = undefined;

  if (this.constructor.id) {
    this.id = this.constructor.id;
  }

  /**
   * @member {boolean}
   * @readonly
   */
  this.enabled = true;
}

PSVNavBarButton.prototype = Object.create(PSVComponent.prototype);
PSVNavBarButton.prototype.constructor = PSVNavBarButton;

/**
 * Unique identifier of the button
 * @member {string}
 */
PSVNavBarButton.id = null;

/**
 * SVG icon name injected in the button
 * @member {string}
 */
PSVNavBarButton.icon = null;

/**
 * SVG icon name injected in the button when it is active
 * @member {string}
 */
PSVNavBarButton.iconActive = null;

/**
 * Creates the button
 */
PSVNavBarButton.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  if (this.constructor.icon) {
    this._setIcon(this.constructor.icon);
  }

  this.container.addEventListener('click', function() {
    if (this.enabled) {
      this._onClick();
    }
  }.bind(this));
};

/**
 * Changes the active state of the button
 * @param {boolean} [active] - forced state
 */
PSVNavBarButton.prototype.toggleActive = function(active) {
  PSVUtils.toggleClass(this.container, 'psv-button--active', active);

  if (this.constructor.iconActive) {
    this._setIcon(active ? this.constructor.iconActive : this.constructor.icon);
  }
};

/**
 * Disables the button
 */
PSVNavBarButton.prototype.disable = function() {
  this.container.classList.add('psv-button--disabled');

  this.enabled = false;
};

/**
 * Enables the button
 */
PSVNavBarButton.prototype.enable = function() {
  this.container.classList.remove('psv-button--disabled');

  this.enabled = true;
};

/**
 * Set the button icon (from {@link PhotoSphereViewer.ICONS})
 * @param {string} icon
 * @param {HTMLElement} [container] - default is the main button container
 * @private
 */
PSVNavBarButton.prototype._setIcon = function(icon, container) {
  if (!container) {
    container = this.container;
  }
  if (icon) {
    container.innerHTML = PhotoSphereViewer.ICONS[icon];
    // classList not supported on IE11, className is read-only !!!!
    container.querySelector('svg').setAttribute('class', 'psv-button-svg');
  }
  else {
    container.innerHTML = '';
  }
};

/**
 * Action when the button is clicked
 * @private
 * @abstract
 */
PSVNavBarButton.prototype._onClick = function() {

};
