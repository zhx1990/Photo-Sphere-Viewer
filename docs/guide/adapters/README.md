# Adapters

Adapters are small pieces of code responsible to load the panorama texture(s) in the Three.js scene.

The supported adapters are:
- [equirectangular](equirectangular.md): the default adapter, used to load full or partial equirectangular panoramas
- [equirectangular tiles](equirectangular-tiles.md): used to load tiled equirectangular panoramas
- [cubemap](cubemap.md): used to load cubemaps projections (six textures)
- [cubemap tiles](cubemap-tiles.md): used to load tiled cubemap panoramas

## Import an adapter

Official adapters are available in the the main `photo-sphere-viewer` package inside the `dist/adapters` directory.

**Example for the Cubemap adapter:**

<md-tabs md-elevation="1">
<md-tab md-label="Direct import">
```html
<!-- base imports of PSV and dependencies -->

<script src="https://cdn.jsdelivr.net/npm/photo-sphere-viewer@4/dist/adapters/cubemap.min.js"></script>
```

```js
new PhotoSphereViewer.Viewer({
  adapter: [PhotoSphereViewer.CubemapAdapter, {
    // optional adapter config
  }],
  panorama: // specific to the adapter,
});
```
</md-tab>

<md-tab md-label="ES import">
```js
import { CubemapAdapter } from 'photo-sphere-viewer/dist/adapters/cubemap';

new Viewer({
  adapter: [CubemapAdapter, {
    // optional adapter config
  }],
  panorama: // specific to the adapter,
});
```
</md-tab>
</md-tabs>
