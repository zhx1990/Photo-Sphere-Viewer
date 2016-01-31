/**
 * Navigation bar class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBar(psv) {
  PSVComponent.call(this, psv);

  this.config = this.psv.config.navbar;
  this.caption = null;
  this.buttons = [];

  if (this.config === true) {
    this.config = PSVUtils.clone(PSVNavBar.DEFAULTS);
  }
  else if (typeof this.config == 'string') {
    var map = {};
    this.config.split(/[ ,:]/).forEach(function(button) {
      map[button] = true;
    });
    this.config = PSVUtils.deepmerge(PSVNavBar.DEFAULTS, map);
  }

  this.create();
}

PSVNavBar.prototype = Object.create(PSVComponent.prototype);
PSVNavBar.prototype.constructor = PSVNavBar;

PSVNavBar.publicMethods = ['setCaption'];

PSVNavBar.DEFAULTS = {
  autorotate: true,
  zoom: true,
  fullscreen: true,
  download: true,
  markers: true
};

/**
 * Creates the navbar
 * @return (void)
 */
PSVNavBar.prototype.create = function() {
  PSVComponent.prototype.create.call(this);

  this.container.className = 'psv-navbar';

  // Autorotate button
  if (this.config.autorotate) {
    this.buttons.push(new PSVNavBarAutorotateButton(this));
  }

  // Zoom buttons
  if (this.config.zoom) {
    this.buttons.push(new PSVNavBarZoomButton(this));
  }

  // Download button
  if (this.config.download) {
    this.buttons.push(new PSVNavBarDownloadButton(this));
  }

  // Markers button
  if (this.config.markers) {
    this.buttons.push(new PSVNavBarMarkersButton(this));
  }

  // Fullscreen button
  if (this.config.fullscreen) {
    this.buttons.push(new PSVNavBarFullscreenButton(this));
  }

  // Caption
  this.caption = document.createElement('div');
  this.caption.className = 'caption';
  this.container.appendChild(this.caption);
  this.setCaption(this.psv.config.caption);
};

/**
 * Destroys the navbar
 */
PSVNavBar.prototype.destroy = function() {
  this.buttons.forEach(function(button) {
    button.destroy();
  });

  this.buttons.length = 0;

  PSVComponent.prototype.destroy.call(this);
};

/**
 * Sets the bar caption
 * @param (string) html
 */
PSVNavBar.prototype.setCaption = function(html) {
  if (!html) {
    this.caption.style.display = 'none';
  }
  else {
    this.caption.style.display = 'block';
    this.caption.innerHTML = html;
  }
};
