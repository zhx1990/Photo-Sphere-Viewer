/**
 * Panel class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVPanel = function(psv) {
  this.psv = psv;
  this.container = null;
  this.resizer = null;
  this.content = null;
  
  this.prop = {
    mouse_x: 0,
    mouse_y: 0,
    mousedown: false
  };
  
  this.create();
};

/**
 * Creates the elements
 * @return (void)
 */
PSVPanel.prototype.create = function() {
  this.container = document.createElement('aside');
  this.container.className = 'psv-panel';
  this.container.innerHTML = '\
<div class="resizer"></div>\
<div class="close-button"></div>\
<div class="content"></div>';
  
  this.resizer = this.container.querySelector('.resizer');
  this.content = this.container.querySelector('.content');
  
  var closeBtn = this.container.querySelector('.close-button');
  closeBtn.addEventListener('click', this.hidePanel.bind(this));
  
  // Prevent event bubling from panel
  if (this.psv.config.mousewheel) {
    this.container.addEventListener(PSVUtils.mouseWheelEvent(), function(e) {
      e.stopPropagation();
    });
  }
  
  // Event for panel resizing + stop bubling
  this.container.addEventListener('mousedown', this._onMouseDown.bind(this));
  this.container.addEventListener('touchstart', this._onTouchStart.bind(this));
  PSVUtils.addEvents(document, 'mouseup touchend', this._onMouseUp.bind(this));
  document.addEventListener('mousemove', this._onMouseMove.bind(this));
  document.addEventListener('touchmove', this._onTouchMove.bind(this));
};

/**
 * Show the panel for a specific marker
 * @param marker (Object)
 * @return (void)
 */
PSVPanel.prototype.showPanel = function(content, noMargin) {
  this.content.innerHTML = content;
  this.content.scrollTop = 0;
  this.container.classList.add('open');
  
  if (noMargin) {
    if (!this.content.classList.contains('no-margin')) {
      this.content.classList.add('no-margin');
    }
  }
  else {
    this.content.classList.remove('no-margin');
  }
  
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

/**
 * The user wants to move
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._onMouseDown = function(evt) {
  evt.stopPropagation();
  
  if (evt.target === this.resizer) {
    this._startResize(evt);
  }
};

/**
 * The user wants to move (mobile version)
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._onTouchStart = function(evt) {
  evt.stopPropagation();
  if (evt.changedTouches[0].target === this.resizer) {
    this._startResize(evt.changedTouches[0]);
  }
};

/**
 * Initializes the movement
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._startResize = function(evt) {
  this.prop.mouse_x = parseInt(evt.clientX);
  this.prop.mouse_y = parseInt(evt.clientY);
  this.prop.mousedown = true;
  this.content.classList.add('no-interaction');
};

/**
 * The user wants to stop moving
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._onMouseUp = function(evt) {
  if (this.prop.mousedown) {
    evt.stopPropagation();
    this.prop.mousedown = false;
    this.content.classList.remove('no-interaction');
  }
};

/**
 * The user resizes the panel
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._onMouseMove = function(evt) {
  if (this.prop.mousedown) {
    evt.stopPropagation();
    this._resize(evt);
  }
};

/**
 * The user resizes the panel (mobile version)
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._onTouchMove = function(evt) {
  if (this.prop.mousedown) {
    evt.stopPropagation();
    this._resize(evt.changedTouches[0]);
  }
};

/**
 * Panel resizing
 * @param evt (Event) The event
 * @return (void)
 */
PSVPanel.prototype._resize = function(evt) {
  var x = parseInt(evt.clientX);
  var y = parseInt(evt.clientY);
  
  this.container.style.width = (this.container.offsetWidth - (x - this.prop.mouse_x)) + 'px';

  this.prop.mouse_x = x;
  this.prop.mouse_y = y;
};