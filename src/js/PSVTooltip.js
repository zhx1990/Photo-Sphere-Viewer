/**
 * Tooltip class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVTooltip(psv) {
  PSVComponent.call(this, psv);
  
  this.config = this.psv.config.tooltip;
  this.container = null;
  
  this.create();
}

PSVTooltip.prototype = Object.create(PSVComponent.prototype);
PSVTooltip.prototype.constructor = PSVTooltip;

PSVTooltip.publicMethods = ['showTooltip', 'hideTooltip'];

PSVTooltip.leftMap = {0: 'left', 0.5: 'center', 1: 'right'};
PSVTooltip.topMap = {0: 'top', 0.5: 'center', 1: 'bottom'};

/**
 * Creates the elements
 * @return (void)
 */
PSVTooltip.prototype.create = function() {
  this.container = document.createElement('div');
  this.container.innerHTML = '<div class="arrow"></div><div class="content"></div>';
  this.container.className = 'psv-tooltip';
  this.container.style.top = '-1000px';
  this.container.style.left = '-1000px';
  
  this.psv.on('render', this.hideTooltip.bind(this));
};

/**
 * Show the tooltip
 * @param tooltip (Mixed) content, className, position
 * @param marker (Object) target for positioning: width, height, position2D(top, left)
 * @return (void)
 */
PSVTooltip.prototype.showTooltip = function(tooltip, marker) {
  var t = this.container;
  var c = t.querySelector('.content');
  var a = t.querySelector('.arrow');
  
  if (typeof tooltip === 'string') {
    tooltip = {
      content: marker.tooltip,
      position: ['top', 'center']
    };
  }
  
  // parse position
  if (typeof tooltip.position === 'string') {
    var tempPos = PSVUtils.parsePosition(tooltip.position);
    
    if (!(tempPos.left in PSVTooltip.leftMap) || !(tempPos.top in PSVTooltip.topMap)) {
      throw new PSVError('unable to parse tooltip position "' + tooltip.position + '"');
    }
    
    tooltip.position = [PSVTooltip.topMap[tempPos.top], PSVTooltip.leftMap[tempPos.left]];
  }
  
  t.className = 'psv-tooltip'; // reset the class
  if (tooltip.className) {
    t.classList.add(tooltip.className);
  }

  c.innerHTML = tooltip.content;
  t.style.top = '0px';
  t.style.left = '0px';
  
  // compute size
  var rect = t.getBoundingClientRect();
  var style = {
    posClass: tooltip.position.slice(),
    width: rect.right - rect.left,
    height: rect.bottom - rect.top,
    top: 0,
    left: 0,
    arrow_top: 0,
    arrow_left: 0
  };
  
  // set initial position
  this._computeTooltipPosition(style, marker);
  
  // correct position if overflow
  var refresh = false;
  if (style.top < this.config.offset) {
    style.posClass[0] = 'bottom';
    refresh = true;
  }
  else if (style.top + style.height > this.psv.prop.size.height - this.config.offset) {
    style.posClass[0] = 'top';
    refresh = true;
  }
  if (style.left < this.config.offset) {
    style.posClass[1] = 'right';
    refresh = true;
  }
  else if (style.left + style.width > this.psv.prop.size.width - this.config.offset) {
    style.posClass[1] = 'left';
    refresh = true;
  }
  if (refresh) {
    this._computeTooltipPosition(style, marker);
  }
  
  // apply position
  t.style.top = style.top + 'px';
  t.style.left = style.left + 'px';
  
  a.style.top = style.arrow_top + 'px';
  a.style.left = style.arrow_left + 'px';
  
  t.classList.add(style.posClass.join('-'));
  
  // delay for correct transition between the two classes
  var self = this;
  setTimeout(function() {
    t.classList.add('visible');
    self.psv.trigger('show-tooltip');
  }, 100);
};

/**
 * Hide the tooltip
 * @return (void)
 */
PSVTooltip.prototype.hideTooltip = function() {
  this.container.classList.remove('visible');
  this.psv.trigger('hide-tooltip');
  
  var self = this;
  setTimeout(function() {
    self.container.style.top = '-1000px';
    self.container.style.left = '-1000px';
  }, 100);
};

/**
 * Compute the position of the tooltip and its arrow
 * @param style (Object) tooltip style
 * @param marker (Object)
 * @return (void)
 */
PSVTooltip.prototype._computeTooltipPosition = function(style, marker) {
  var topBottom = false;
  
  switch (style.posClass[0]) {
    case 'bottom':
      style.top = marker.position2D.top + marker.height + this.config.offset + this.config.arrow_size;
      style.arrow_top = - this.config.arrow_size * 2;
      topBottom = true;
      break;
    
    case 'center':
      style.top = marker.position2D.top + marker.height/2 - style.height/2;
      style.arrow_top = style.height/2 - this.config.arrow_size;
      break;
    
    case 'top':
      style.top = marker.position2D.top - style.height - this.config.offset - this.config.arrow_size;
      style.arrow_top = style.height;
      topBottom = true;
      break;
  }
  
  switch (style.posClass[1]) {
    case 'right':
      if (topBottom) {
        style.left = marker.position2D.left;
        style.arrow_left = marker.width/2 - this.config.arrow_size;
      }
      else {
        style.left = marker.position2D.left + marker.width + this.config.offset + this.config.arrow_size;
        style.arrow_left = - this.config.arrow_size * 2;
      }
      break;
    
    case 'center':
      style.left = marker.position2D.left + marker.width/2 - style.width/2;
      style.arrow_left = style.width/2 - this.config.arrow_size;
      break;
    
    case 'left':
      if (topBottom) {
        style.left = marker.position2D.left - style.width + marker.width;
        style.arrow_left = style.width - marker.width/2 - this.config.arrow_size;
      }
      else {
        style.left = marker.position2D.left - style.width - this.config.offset - this.config.arrow_size;
        style.arrow_left = style.width;
      }
      break;
  }
};