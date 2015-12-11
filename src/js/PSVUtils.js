/**
 * Static utilities for PSV
 */
var PSVUtils = {};

/**
 * Adds a CSS class to an element
 * @param elt (HTMLElement)
 * @param clazz (string)
 */
PSVUtils.addClass = function(elt, clazz) {
  if (elt.className.length) {
    elt.className+= ' ' + clazz;
  }
  else {
    elt.className = clazz;
  }
};

/**
 * Removes a CSS class from an element
 * @param elt (HTMLElement)
 * @param clazz (string)
 */
PSVUtils.removeClass = function(elt, clazz) {
  if (elt.className.length) {
    elt.className = elt.className.replace(new RegExp('\\b' + clazz + '\\b'), '').trim();
  }
};

/**
 * Detects whether canvas is supported
 * @return (boolean) true if canvas is supported, false otherwise
 */
PSVUtils.isCanvasSupported = function() {
  var canvas = document.createElement('canvas');
  return !!(canvas.getContext && canvas.getContext('2d'));
};

/**
 * Detects whether WebGL is supported
 * @return (boolean) true if WebGL is supported, false otherwise
 */
PSVUtils.isWebGLSupported = function() {
  var canvas = document.createElement('canvas');
  return !!(window.WebGLRenderingContext && canvas.getContext('webgl'));
};

/**
 * Get max texture width in WebGL context
 * @return (int)
 */
PSVUtils.getMaxTextureWidth = function() {
  var canvas = document.createElement('canvas');
  var ctx = canvas.getContext('webgl');
  return ctx.getParameter(ctx.MAX_TEXTURE_SIZE);
};

/**
 * Attaches an event handler function to an elemnt
 * @param elt (HTMLElement) The element
 * @param evt (string) The event name
 * @param f (Function) The handler function
 * @return (void)
 */
PSVUtils.addEvent = function(elt, evt, f) {
  if (!!elt.addEventListener) {
    elt.addEventListener(evt, f, false);
  }
  else {
    elt.attachEvent('on' + evt, f);
  }
};

/**
 * Get the event name for mouse wheel
 * @return (string)
 */
PSVUtils.mouseWheelEvent = function() {
  return "onwheel" in document.createElement("div") ? "wheel" : // Modern browsers support "wheel"
    document.onmousewheel !== undefined ? "mousewheel" : // Webkit and IE support at least "mousewheel"
    "DOMMouseScroll"; // let's assume that remaining browsers are older Firefox
};

/**
 * Get the event name for fullscreen event
 * @return (string)
 */
PSVUtils.fullscreenEvent = function() {
  var map = {'exitFullscreen': 'fullscreenchange', 'webkitExitFullscreen': 'webkitfullscreenchange', 'mozCancelFullScreen': 'mozfullscreenchange', 'msExitFullscreen': 'msFullscreenEnabled'};
  for (var exit in map) if (exit in document) return map[exit];
  return 'fullscreenchange';
};

/**
 * Ensures that a number is in a given interval
 * @param x (number) The number to check
 * @param min (number) First endpoint
 * @param max (number) Second endpoint
 * @return (number) The checked number
 */
PSVUtils.stayBetween = function(x, min, max) {
  return Math.max(min, Math.min(max, x));
};

/**
 * Returns the value of a given attribute in the panorama metadata
 * @param data (string) The panorama metadata
 * @param attr (string) The wanted attribute
 * @return (string) The value of the attribute
 */
PSVUtils.getAttribute = function(data, attr) {
  var a = data.indexOf('GPano:' + attr) + attr.length + 8, b = data.indexOf('"', a);
  return data.substring(a, b);
};

/**
 * Detects whether fullscreen is enabled or not
 * @return (boolean) true if fullscreen is enabled, false otherwise
 */
PSVUtils.isFullscreenEnabled = function() {
  return (document.fullscreenElement || document.mozFullScreenElement || document.webkitFullscreenElement || document.msFullscreenElement);
};

/**
 * Enters fullscreen mode
 * @param elt (HTMLElement)
 */
PSVUtils.requestFullscreen = function(elt) {
  (elt.requestFullscreen || elt.mozRequestFullScreen || elt.webkitRequestFullscreen || elt.msRequestFullscreen).call(elt);
};

/**
 * Exits fullscreen mode
 * @param elt (HTMLElement)
 */
PSVUtils.exitFullscreen = function(elt) {
  (document.exitFullscreen || document.mozCancelFullScreen || document.webkitExitFullscreen || document.msExitFullscreen).call(document);
};

/**
 * Gets an element style
 * @param elt (HTMLElement)
 * @param prop (string)
 * @return mixed
 */
PSVUtils.getStyle = function(elt, prop) {
  return window.getComputedStyle(elt, null)[prop];
};

/**
 * Translate CSS values like "top center" or "10% 50%" as top and left positions
 * @param value (String)
 * @return Object
 */
PSVUtils.parsePosition = function(value) {
  if (!value) {
    return {top: 0.5, left: 0.5};
  }
  
  var e = document.createElement('div');
  e.style.backgroundPosition = value;
  var parsed = PSVUtils.getStyle(e, 'background-position').match(/^([0-9.]+)% ([0-9.]+)%$/);
  
  return {
    left: parsed[1]/100,
    top: parsed[2]/100
  };
};

/**
 * Merge the enumerable attributes of two objects.
 * @copyright Nicholas Fisher <nfisher110@gmail.com>"
 * @license MIT
 * @param object
 * @param object
 * @return object
 */
PSVUtils.deepmerge = function(target, src) {
  var array = Array.isArray(src);
  var dst = array && [] || {};

  if (array) {
    target = target || [];
    dst = dst.concat(target);
    src.forEach(function(e, i) {
      if (typeof dst[i] === 'undefined') {
        dst[i] = e;
      } else if (typeof e === 'object') {
        dst[i] = PSVUtils.deepmerge(target[i], e);
      } else {
        if (target.indexOf(e) === -1) {
          dst.push(e);
        }
      }
    });
  } else {
    if (target && typeof target === 'object') {
      Object.keys(target).forEach(function (key) {
        dst[key] = target[key];
      });
    }
    Object.keys(src).forEach(function (key) {
      if (typeof src[key] !== 'object' || !src[key]) {
        dst[key] = src[key];
      }
      else {
        if (!target[key]) {
          dst[key] = src[key];
        } else {
          dst[key] = PSVUtils.deepmerge(target[key], src[key]);
        }
      }
    });
  }

  return dst;
};