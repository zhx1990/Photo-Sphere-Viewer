/**
 * Navigation bar download button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVNavBarDownloadButton = function(psv) {
  PSVNavBarButton.call(this, psv);

  this.create();
};

PSVNavBarDownloadButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarDownloadButton.prototype.constructor = PSVNavBarDownloadButton;

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarDownloadButton.prototype.create = function() {
  this.button = document.createElement('div');
  this.button.className = 'psv-button psv-download-button';
  this.button.title = this.psv.config.lang.download;

  this.button.appendChild(document.createElement('div'));

  PSVUtils.addEvent(this.button, 'mouseenter', this.toggleActive.bind(this, true));
  PSVUtils.addEvent(this.button, 'mouseleave', this.toggleActive.bind(this, false));
  PSVUtils.addEvent(this.button, 'click', this.download.bind(this));
};

/**
 * Ask the browser to download the panorama source file
 */
PSVNavBarDownloadButton.prototype.download = function() {
  var link = document.createElement('a');
  link.href = this.psv.config.panorama;
  link.download = this.psv.config.panorama;
  this.psv.config.container.appendChild(link);
  link.click();
  this.psv.config.container.removeChild(link);
};