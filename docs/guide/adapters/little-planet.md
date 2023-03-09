# Little planet

<Badges module="little-planet-adapter"/>

::: module
Displays an [equirectangular](equirectangular.md) panorama with a little planet effect.

This adapter is available in the [@photo-sphere-viewer/little-planet-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/little-planet-adapter) package.
:::

::: warning
This adapter is not compatible with some options and plugins, it is provided as it just for fun.
:::

```js
const viewer = new PhotoSphereViewer.Viewer({
    adapter: PhotoSphereViewer.LittlePlanetAdapter,
    panorama: 'path/panorama.jpg',
});
```

## Example

::: code-demo

```yaml
title: PSV Little Planet Demo
packages:
    - name: little-planet-adapter
      imports: LittlePlanetAdapter
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
    container: 'viewer',
    adapter: PhotoSphereViewer.LittlePlanetAdapter,
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
});
```

:::
