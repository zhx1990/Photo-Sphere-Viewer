# Little planet

[![NPM version](https://img.shields.io/npm/v/@photo-sphere-viewer/little-planet-adapter?logo=npm)](https://www.npmjs.com/package/@photo-sphere-viewer/little-planet-adapter)
[![NPM Downloads](https://img.shields.io/npm/dm/@photo-sphere-viewer/little-planet-adapter?color=f86036&label=npm&logo=npm)](https://www.npmjs.com/package/@photo-sphere-viewer/little-planet-adapter)
[![jsDelivr Hits](https://img.shields.io/jsdelivr/npm/hm/@photo-sphere-viewer/little-planet-adapter?color=%23f86036&logo=jsdelivr)](https://www.jsdelivr.com/package/npm/@photo-sphere-viewer/little-planet-adapter)
[![Rate this package](https://badges.openbase.com/js/rating/@photo-sphere-viewer/little-planet-adapter.svg?)](https://openbase.com/js/@photo-sphere-viewer/little-planet-adapter)

::: module
Displays an [equirectangular](equirectangular.md) panorama with a little planet effect.

This adapter is available in the [@photo-sphere-viewer/little-planet-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/little-planet-adapter) package.
:::

::: warning
This adapter is not complatible with some options and plugins, it is provided as it just for fun.
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
