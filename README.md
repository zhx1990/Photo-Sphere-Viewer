# Photo Sphere Viewer

Photo Sphere Viewer is a JavaScript library that allows you to display 360×180 degrees panoramas on any web page. Panoramas must use the equirectangular projection and they can be taken with Photo Sphere, the camera mode brought by Android 4.2 Jelly Bean.

Photo Sphere Viewer uses the [Three.js](http://threejs.org) library, so nothing is required for your visitors except for a browser compatible with canvas or, better, WebGL.

## How To Use It

1. Include the `three.min.js` and `photo-sphere-viewer.js` files into your page.
2. Create a `div` in the size you want for your panorama.
3. In JavaScript, create a new `PhotoSphereViewer` object. You must pass it an object containing at least the two parameters `panorama` and `container`.

You can find a basic example of use in the file `example.html`. The `example1.html` is a more complete (and more interesting) example.

### Options

  * `panorama` (required): the path to the panorama.
  * `container` (required): the `div` in which the panorama will be displayed.
  * `autoload` (optional, default to `true`): `true` to automatically load the panorama, `false` to load it later (with the `.load()` method).
  * `usexmpdata` (optional, default to `true`): `true` if Photo Sphere Viewer must read XMP data, `false` if it is not necessary.
  * `min_fov` (optional, default to `30`): the minimal field of view, in degrees, between 1 and 179.
  * `max_fov` (optional, default to `90`): the maximal field of view, in degrees, between 1 and 179.
  * `default_fov` (optional, default to `max_fov`): the default field of view, in degrees, between `min_fov` and `max_fov`.
  * `default_long` (optional, default to `0`): the default longitude, in radians, between `0 and `2xPI`.
  * `default_lat` (optional, default to `0`): the default latitude, in radians, between `-PI/2` and `PI/2`.
  * `long_offset` (optional, default to `PI/360`): the longitude to travel per pixel moved by mouse/touch.
  * `lat_offset` (optional, default to `PI/180`): the latitude to travel per pixel moved by mouse/touch.
  * `time_anim` (optional, default to `2000`): the panorama will be automatically animated after `time_anim` milliseconds (indicate `false` to deactivate it).
  * `anim_speed` (optional, default to `2rpm`): animation speed in radians/degrees/revolutions per second/minute.
  * `navbar` (optional, default to `false`): set to `true`, a navigation bar will be displayed.
  * `loading_img` (optional, default to `null`): the path to the image shown during the loading.
  * `size` (optional, default to `null`): the final size of the panorama container (e.g. `{width: 500, height: 300}`).

If your panorama is taken with Google's Photo Sphere, `usexmpdata` must be set to `true`, unless it is not cropped.


### Events

You can listen to various events with the `on` method.

```js
var psv = new PhotoSphereViewer({ });

psv.on('ready', function() { });
```

Available events :

  * `ready` when the viewer is ready, before the first render
  * `autorotate` (enabled [bool]) when the autorotation state changes
  * `size-updated` (width [int], height [int]) when the viewer size changes
  * `position-updated` (long [float], lat [float]) when the view angles change
  * `zoom-updated` (level [int]) when the zoom level changes
  * `fullscreen-updated` (enabled [bool]) when the fullscreen state changes

### Methods

Available public methods :

  * `load` loads the viewer if `autoload` is `false`
  * `render` renders the scene
  * `startAutorotate`  
  * `stopAutorotate`  
  * `toggleAutorotate`
  * `resize` (width [int], height [int] in pixels)
  * `rotate` (long [float], lat [float] in radians)
  * `zoom` (level [int])
  * `zoomIn` increases zoom level by 1
  * `zoomOut` decreases zoom level by 1
  * `toggleFullscreen`
  * `setAnimSpeed`

## License

This library is available under the MIT license.
