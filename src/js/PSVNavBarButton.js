/**
 * Navigation bar button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBarButton(psv) {
  this.psv = psv;
  this.button = null;
};

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarButton.prototype.create = function() {
  throw new PSVError('Not implemented');
};

/**
 * Changes the active state of the button
 * @param active (boolean) true if the button should be active, false otherwise
 * @return (void)
 */
PSVNavBarButton.prototype.toggleActive = function(active) {
  if (active) {
    this.button.classList.add('active');
  }
  else {
    this.button.classList.remove('active');
  }
};