# Adapters

Adapters are small pieces of code responsible to load the panorama texture(s) in the Three.js scene.

The supported adapters are:

-   [equirectangular](equirectangular.md): the default adapter, used to load full or partial equirectangular panoramas
-   [equirectangular tiles](equirectangular-tiles.md): used to load tiled equirectangular panoramas
-   [equirectangular video](equirectangular-video.md): used to load equirectangular videos
-   [cubemap](cubemap.md): used to load cubemaps projections (six textures)
-   [cubemap tiles](cubemap-tiles.md): used to load tiled cubemap panoramas
-   [cubemap video](cubemap-video.md): used to load cubemap video
-   [little planet](little-planet.md): used to display equirectangular panoramas with a little planet effect

## Import an adapter

Official adapters are available in various `@photo-sphere-viewer/***-adapter` packages.

**Example for the Cubemap adapter:**

:::: tabs

::: tab Direct import

```html
<!-- base imports of PSV and dependencies -->

<script src="https://cdn.jsdelivr.net/npm/@photo-sphere-viewer/cubemap-adapter/index.min.js"></script>
```

```js
new PhotoSphereViewer.Viewer({
    adapter: [PhotoSphereViewer.CubemapAdapter, {
        // optional adapter config
    }],
    panorama: // specific to the adapter,
});
```

:::

::: tab ES import

```js
import { CubemapAdapter } from '@photo-sphere-viewer/cubemap-adapter';

new Viewer({
    adapter: [CubemapAdapter, {
        // optional adapter config
    }],
    panorama: // specific to the adapter,
});
```

:::

::::
