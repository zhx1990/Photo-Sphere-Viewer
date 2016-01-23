/**
 * Navigation bar fullscreen button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBarFullscreenButton(psv) {
  PSVNavBarButton.call(this, psv);

  this.create();
}

PSVNavBarFullscreenButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarFullscreenButton.prototype.constructor = PSVNavBarFullscreenButton;

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarFullscreenButton.prototype.create = function() {
  PSVNavBarButton.prototype.create.call(this);

  this.button.classList.add('fullscreen-button');
  this.button.title = this.psv.config.lang.fullscreen;

  this.button.appendChild(document.createElement('div'));
  this.button.appendChild(document.createElement('div'));

  this.button.addEventListener('click', this.psv.toggleFullscreen.bind(this.psv));

  this.psv.on('fullscreen-updated', this);
};

/**
 * Destroys the button
 */
PSVNavBarFullscreenButton.prototype.destroy = function() {
  this.psv.off('fullscreen-updated', this);

  PSVNavBarButton.prototype.destroy.call(this);
};

/**
 * Handle events
 * @param e (Event)
 */
PSVNavBarFullscreenButton.prototype.handleEvent = function(e) {
  switch (e.type) {
    case 'psv:fullscreen-updated': this.toggleActive(); break;
  }
};
