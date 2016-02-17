/**
 * Navigation bar autorotate button class
 * @param navbar (PSVNavBar) A PSVNavBar object
 */
function PSVNavBarAutorotateButton(navbar) {
  PSVNavBarButton.call(this, navbar);

  this.create();
}

PSVNavBarAutorotateButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarAutorotateButton.prototype.constructor = PSVNavBarAutorotateButton;

PSVNavBarAutorotateButton.className = 'psv-button autorotate-button';

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarAutorotateButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  this.container.title = this.psv.config.lang.autorotate;

  var autorotate_sphere = document.createElement('div');
  autorotate_sphere.className = 'sphere';
  this.container.appendChild(autorotate_sphere);

  var autorotate_equator = document.createElement('div');
  autorotate_equator.className = 'equator';
  this.container.appendChild(autorotate_equator);

  this.container.addEventListener('click', this.psv.toggleAutorotate.bind(this.psv));

  this.psv.on('autorotate', this.toggleActive.bind(this));
};
