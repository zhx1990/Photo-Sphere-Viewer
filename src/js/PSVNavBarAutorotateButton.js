/**
 * Navigation bar autorotate button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVNavBarAutorotateButton = function(psv) {
  PSVNavBarButton.call(this, psv);
  this.create();
};

PSVNavBarAutorotateButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarAutorotateButton.prototype.constructor = PSVNavBarAutorotateButton;

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarAutorotateButton.prototype.create = function() {
  this.button = document.createElement('div');
  this.button.className = 'psv-button autorotate-button';
  this.button.title = this.psv.config.lang.autorotate;

  var autorotate_sphere = document.createElement('div');
  autorotate_sphere.className = 'sphere';
  this.button.appendChild(autorotate_sphere);

  var autorotate_equator = document.createElement('div');
  autorotate_equator.className = 'equator';
  this.button.appendChild(autorotate_equator);

  this.button.addEventListener('click', this.psv.toggleAutorotate.bind(this.psv));
  
  this.psv.on('autorotate', this.toggleActive.bind(this));
};