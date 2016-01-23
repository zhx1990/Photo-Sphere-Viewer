/**
 * Navigation bar button class
 * @param navbar (PSVNavBar) A PSVNavBar object
 */
function PSVNavBarButton(navbar) {
  this.navbar = navbar;
  this.psv = navbar.psv;
  this.button = null;
}

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarButton.prototype.create = function() {
  this.button = document.createElement('div');
  this.button.className = 'psv-button';
  this.navbar.container.appendChild(this.button);
};

/**
 * Destroys the button
 */
PSVNavBarButton.prototype.destroy = function() {
  this.navbar.container.removeChild(this.button);
  this.button = null;
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
