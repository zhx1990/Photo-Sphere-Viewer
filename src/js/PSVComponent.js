/**
 * Base sub component class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
function PSVComponent(psv) {
  this.psv = psv;  
  
  // expose some methods to the viewer
  if (this.constructor.publicMethods) {
    this.constructor.publicMethods.forEach(function(method) {
      this.psv[method] = this[method].bind(this);
    }, this);
  }
}