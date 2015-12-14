/**
 * Navigation bar class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVNavBar = function(psv) {
  this.psv = psv;
  this.config = this.psv.config.navbar;
  this.container = null;
  this.caption = null;

  if (this.config === true) {
    this.config = {
      autorotate: true,
      zoom: true,
      fullscreen: true,
      download: true,
      markers: true
    };
  }
  else if (typeof this.config == 'string') {
    var map = {};
    this.config.split(/[ ,:]/).forEach(function(button) {
      map[button] = true;
    });
    this.config = map;
  }

  this.create();
  
  // expose some methods to the viewer
  PSVNavBar.publicMethods.forEach(function(method) {
    this.psv[method] = this[method].bind(this);
  }, this);
};

PSVNavBar.publicMethods = ['setCaption'];

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
    this.autorotateBtn = new PSVNavBarAutorotateButton(this.psv);
    this.container.appendChild(this.autorotateBtn.getButton());
  }

  // Zoom buttons
  if (this.config.zoom) {
    this.zoomBar = new PSVNavBarZoomButton(this.psv);
    this.container.appendChild(this.zoomBar.getButton());
  }

  // Download button
  if (this.config.download) {
    this.downloadBtn = new PSVNavBarDownloadButton(this.psv);
    this.container.appendChild(this.downloadBtn.getButton());
  }

  // Markers button
  if (this.config.markers) {
    this.markersBtn = new PSVNavBarMarkersButton(this.psv);
    this.container.appendChild(this.markersBtn.getButton());
  }

  // Fullscreen button
  if (this.config.fullscreen) {
    this.fullscreenBtn = new PSVNavBarFullscreenButton(this.psv);
    this.container.appendChild(this.fullscreenBtn.getButton());
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