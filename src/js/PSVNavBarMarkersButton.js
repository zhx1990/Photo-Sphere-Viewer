/**
 * Navigation bar markers button class
 * @param psv (PhotoSphereViewer) A PhotoSphereViewer object
 */
var PSVNavBarMarkersButton = function(psv) {
  PSVNavBarButton.call(this, psv);
  
  this.prop = {
    panelOpen: false,
    panelOpening: false
  };

  this.create();
};

PSVNavBarMarkersButton.prototype = Object.create(PSVNavBarButton.prototype);
PSVNavBarMarkersButton.prototype.constructor = PSVNavBarMarkersButton;

/**
 * Creates the button
 * @return (void)
 */
PSVNavBarMarkersButton.prototype.create = function() {
  this.button = document.createElement('div');
  this.button.className = 'psv-button markers-button';
  this.button.title = this.psv.config.lang.markers;
  this.button.innerHTML = PhotoSphereViewer.ICONS['pin.svg'];
  
  this.button.addEventListener('click', this.toggleMarkers.bind(this));
  this.psv.on('panel-open', this._onPanelOpen.bind(this));
};

/**
 * Toggle the visibility of markers list
 * @return (void)
 */
PSVNavBarMarkersButton.prototype.toggleMarkers = function() {
  if (this.prop.panelOpen) {
    this.hideMarkers();
  }
  else {
    this.showMarkers();
  }
};

/**
 * Open side panel with list of markers
 * @return (void)
 */
PSVNavBarMarkersButton.prototype.showMarkers = function() {
  var html = '<div class="psv-markers-list"> \
    <h1>' + this.psv.config.lang.markers + '</h1> \
    <ul>';

    for (var id in this.hud.markers) {
      var marker = this.hud.markers[id];
      
      var name = marker.name || marker.id;
      if (marker.tooltip) {
        name = marker.tooltip.content;
      }
      
      html+= '<li data-psv-marker="' + marker.id + '"> \
        <img src="' + marker.image + '"/> \
        <p>' + name + '</p> \
      </li>';
    }
  
  html+= '</ul> \
  </div>';
  
  this.prop.panelOpening = true;
  this.psv.panel.showPanel(html, true);
  
  this.psv.panel.container.querySelector('.psv-markers-list').addEventListener('click', this._onClickItem.bind(this));
};

/**
 * Close side panel
 * @return (void)
 */
PSVNavBarMarkersButton.prototype.hideMarkers = function() {
  this.psv.panel.hidePanel();
};

/**
 * Click on an item
 * @param e (Event)
 * @return (void)
 */
PSVNavBarMarkersButton.prototype._onClickItem = function(e) {
  var li;
  if (e.target && (li = PSVUtils.getClosest(e.target, 'li')) && li.dataset.psvMarker) {
    this.psv.hud.gotoMarker(li.dataset.psvMarker, 1000);
  }
};

PSVNavBarMarkersButton.prototype._onPanelOpen = function(open) {
  if (open) {
    if (this.prop.panelOpening) {
      this.prop.panelOpening = false;
      this.prop.panelOpen = true;
    }
    else {
      this.prop.panelOpen = false;
    }
  }
  else {
    this.prop.panelOpen = false;
  }
  
  this.toggleActive(this.prop.panelOpen);
};