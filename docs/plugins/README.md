# Introduction to plugins

Plugins are used to add new functionalities to Photo Sphere Viewer. They can access all internal APIs of the viewer as well as the THREE.js renderer to make the viewer even more awesome.

## Import official plugins

Official plugins (listed on the left menu) are available in the the main `photo-sphere-viewer` package inside the `dist/plugins` directory. Some plugins also have an additional CSS file.

**Example for the Markers plugin:**

<md-tabs md-elevation="1">
<md-tab md-label="Direct import">
```html
<!-- base imports of PSV and dependencies -->

<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/plugins/markers.min.css"/>

<script src="https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/plugins/markers.min.js"></script>
```
</md-tab>

<md-tab md-label="ES import">
Import `photo-sphere-viewer/dist/plugins/markers.css` with the prefered way depending on your tooling.

```js
import { MarkersPlugin } from 'photo-sphere-viewer/dist/plugins/markers';
```
</md-tab>
</md-tabs>



## Using a plugin

All plugins consists of a JavaScript class which must be provided to the `plugins` array. Some plugins will also take configuration object provided in a nested array.

```js
const viewer = new PhotoSphereViewer.Viewer({
  plugins: [
    PhotoSphereViewer.GyroscopePlugin,
    [PhotoSphereViewer.MarkersPlugin, {
      option1: 'foo',
      option2: 'bar',
    }],
  ],
});
```

After initializayion the plugin instance can be obtained with the `getPlugin` method, allowing to call methods on the plugin and subscribe to events.

```js
const markersPlugin = new viewer.getPlugin(PhotoSphereViewer.MarkersPlugin);

markersPlugin.on('select-marker', () => {
  /* ... */
});
```
