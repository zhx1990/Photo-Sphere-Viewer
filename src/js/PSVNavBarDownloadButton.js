/**
 * Navigation bar download button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVNavBarDownloadButton(psv) {
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
  this.button.className = 'psv-button download-button';
  this.button.title = this.psv.config.lang.download;

  this.button.appendChild(document.createElement('div'));

  this.button.addEventListener('mouseenter', this.toggleActive.bind(this, true));
  this.button.addEventListener('mouseleave', this.toggleActive.bind(this, false));
  this.button.addEventListener('click', this.download.bind(this));
};

/**
 * Ask the browser to download the panorama source file
 */
PSVNavBarDownloadButton.prototype.download = function() {
  var link = document.createElement('a');
  link.href = this.psv.config.panorama;
  link.download = this.psv.config.panorama;
  this.psv.container.appendChild(link);
  link.click();
};