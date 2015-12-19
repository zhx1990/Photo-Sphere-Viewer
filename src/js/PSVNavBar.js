/**
 * Navigation bar class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBar(psv) {
  PSVComponent.call(this, psv);

  this.config = this.psv.config.navbar;
  this.container = null;
  this.caption = null;

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
};

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
 * Creates the elements
 * @return (void)
 */
PSVNavBar.prototype.create = function() {
  // Container
  this.container = document.createElement('div');
  this.container.className = 'psv-navbar';

  // Autorotate button
  if (this.config.autorotate) {
    var autorotateBtn = new PSVNavBarAutorotateButton(this.psv);
    this.container.appendChild(autorotateBtn.button);
  }

  // Zoom buttons
  if (this.config.zoom) {
    var zoomBar = new PSVNavBarZoomButton(this.psv);
    this.container.appendChild(zoomBar.button);
  }

  // Download button
  if (this.config.download) {
    var downloadBtn = new PSVNavBarDownloadButton(this.psv);
    this.container.appendChild(downloadBtn.button);
  }

  // Markers button
  if (this.config.markers) {
    var markersBtn = new PSVNavBarMarkersButton(this.psv);
    this.container.appendChild(markersBtn.button);
  }

  // Fullscreen button
  if (this.config.fullscreen) {
    var fullscreenBtn = new PSVNavBarFullscreenButton(this.psv);
    this.container.appendChild(fullscreenBtn.button);
  }

  // Caption
  this.caption = document.createElement('div');
  this.caption.className = 'caption';
  this.container.appendChild(this.caption);
  this.setCaption(this.psv.config.caption);
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