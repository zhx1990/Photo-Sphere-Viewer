/**
 * Loader class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVLoader = function(psv) {
  this.psv = psv;
  this.container = null;
  this.canvas = null;
  
  this.create();
};

/**
 * Creates the loader content
 */
PSVLoader.prototype.create = function() {
  this.container = document.createElement('div');
  this.container.className = 'psv-loader';
  
  this.psv.container.appendChild(this.container);

  this.canvas = document.createElement('canvas');
  this.canvas.className = 'loader-canvas';
  
  this.canvas.width = this.container.clientWidth;
  this.canvas.height = this.container.clientWidth;
  this.container.appendChild(this.canvas);

  this.tickness = (this.container.offsetWidth - this.container.clientWidth) / 2;

  var inner;
  if (this.psv.config.loading_img) {
    inner = document.createElement('img');
    inner.className = 'loader-image';
    inner.src = this.psv.config.loading_img;
  }
  else if (this.psv.config.loading_txt) {
    inner = document.createElement('div');
    inner.className = 'loader-text';
    inner.innerHTML = this.psv.config.loading_txt;
  }
  if (inner) {
    var a = Math.round(Math.sqrt(2 * Math.pow(this.canvas.width/2-this.tickness/2, 2)));
    inner.style.maxWidth = a + 'px';
    inner.style.maxHeight = a + 'px';
    this.container.appendChild(inner);
  }
};

/**
 * Sets the loader progression
 * @param value (int) from 0 to 100
 */
PSVLoader.prototype.setProgress = function(value) {
  var context = this.canvas.getContext('2d');

  context.clearRect(0, 0, this.canvas.width, this.canvas.height);

  context.lineWidth = this.tickness;
  context.strokeStyle = PSVUtils.getStyle(this.container, 'color');

  context.beginPath();
  context.arc(
    this.canvas.width/2, this.canvas.height/2,
    this.canvas.width/2 - this.tickness/2,
    -Math.PI/2, value/100 * 2*Math.PI - Math.PI/2
  );
  context.stroke();
};