/**
 * Navigation bar class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVNavBar = function(psv) {
  this.psv = psv;
  this.container = null;
  this.arrows = null;
  this.autorotate = null;
  this.zoom = null;
  this.fullscreen = null;

  this.create();
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
  this.autorotate = new PSVNavBarAutorotateButton(this.psv);
  this.container.appendChild(this.autorotate.getButton());

  // Zoom buttons
  this.zoom = new PSVNavBarZoomButton(this.psv);
  this.container.appendChild(this.zoom.getButton());

  // Fullscreen button
  this.fullscreen = new PSVNavBarFullscreenButton(this.psv);
  this.container.appendChild(this.fullscreen.getButton());
};

/**
 * Returns the bar itself
 * @return (HTMLElement) The bar
 */
PSVNavBar.prototype.getBar = function() {
  return this.container;
};