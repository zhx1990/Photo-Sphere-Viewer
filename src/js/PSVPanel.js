/**
 * Panel class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVPanel = function(psv) {
  this.psv = psv;
  this.container = null;
  
  this.create();
};

/**
 * Creates the elements
 * @return (void)
 */
PSVPanel.prototype.create = function() {
  this.container = document.createElement('aside');
  this.container.className = 'psv-panel';
  
  // Prevent event bubling from panel
  var stopPropagation = function(e) {
    e.stopPropagation();
  };
  
  if (this.psv.config.mousewheel) {
    this.container.addEventListener(PSVUtils.mouseWheelEvent(), stopPropagation);
  }
  
  if (this.psv.config.mousemove) {
    PSVUtils.addEvents(this.container, 'mousedown touchstart mouseup touchend mousemove touchmove', stopPropagation);
  }
};

/**
 * Show the panel for a specific marker
 * @param marker (Object)
 * @return (void)
 */
PSVPanel.prototype.showPanel = function(content) {
  var p = this.container;
  
  p.innerHTML = content;
  p.classList.add('open');
  p.scrollTop = 0;
  
  this.psv.trigger('panel-open', true);
};


/**
 * Hide the panel
 * @return (void)
 */
PSVPanel.prototype.hidePanel = function() {
  this.container.classList.remove('open');
  this.psv.trigger('panel-open', false);
};