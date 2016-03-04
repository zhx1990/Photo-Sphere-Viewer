/**
 * Navigation bar gyroscope button class
 * @param navbar (PSVNavBar) A PSVNavBar object
 */
function PSVNavBarGyroscopeButton(navbar) {
  PSVNavBarButton.call(this, navbar);

  this.create();
}

PSVNavBarGyroscopeButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarGyroscopeButton.prototype.constructor = PSVNavBarGyroscopeButton;

PSVNavBarGyroscopeButton.className = 'psv-button hover-scale gyroscope-button';
PSVNavBarGyroscopeButton.icon = 'compass.svg';

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarGyroscopeButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  this.container.style.display = 'none';
  this.container.title = this.psv.config.lang.markers;

  PhotoSphereViewer.SYSTEM.deviceOrientationSupported.promise.then(
    this._onAvailabilityChange.bind(this, true),
    this._onAvailabilityChange.bind(this, false)
  );

  this.container.addEventListener('click', this.psv.toggleDeviceOrientation.bind(this.psv));

  this.psv.on('device-orientation-updated', this);
};

/**
 * Destroys the button
 */
PSVNavBarGyroscopeButton.prototype.destroy = function() {
  this.psv.off('device-orientation-updated', this);

  PSVNavBarButton.prototype.destroy.call(this);
};

/**
 * Handle events
 * @param e (Event)
 */
PSVNavBarGyroscopeButton.prototype.handleEvent = function(e) {
  switch (e.type) {
    // @formatter:off
    case 'psv:device-orientation-updated': this.toggleActive(e.args[0]); break;
    // @formatter:on
  }
};

PSVNavBarGyroscopeButton.prototype._onAvailabilityChange = function(available) {
  if (available) {
    this.container.style.display = 'block';
  }
  else {
    this.destroy();
  }
};
