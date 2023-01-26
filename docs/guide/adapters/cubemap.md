# Cubemap

[![NPM version](https://img.shields.io/npm/v/@photo-sphere-viewer/cubemap-adapter?logo=npm)](https://www.npmjs.com/package/@photo-sphere-viewer/cubemap-adapter)
[![NPM Downloads](https://img.shields.io/npm/dm/@photo-sphere-viewer/cubemap-adapter?color=f86036&label=npm&logo=npm)](https://www.npmjs.com/package/@photo-sphere-viewer/cubemap-adapter)
[![jsDelivr Hits](https://img.shields.io/jsdelivr/npm/hm/@photo-sphere-viewer/cubemap-adapter?color=%23f86036&logo=jsdelivr)](https://www.jsdelivr.com/package/npm/@photo-sphere-viewer/cubemap-adapter)
[![Rate this package](https://badges.openbase.com/js/rating/@photo-sphere-viewer/cubemap-adapter.svg?)](https://openbase.com/js/@photo-sphere-viewer/cubemap-adapter)

::: module
[Cube mapping](https://en.wikipedia.org/wiki/Cube_mapping) is a kind of projection where the environment is mapped to the six faces of a cube around the viewer.

This adapter is available in the [@photo-sphere-viewer/cubemap-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/cubemap-adapter) package.
:::

```js
const viewer = new PhotoSphereViewer.Viewer({
    adapter: PhotoSphereViewer.CubemapAdapter,
    panorama: {
        left: 'path/to/left.jpg',
        front: 'path/to/front.jpg',
        right: 'path/to/right.jpg',
        back: 'path/to/back.jpg',
        top: 'path/to/top.jpg',
        bottom: 'path/to/bottom.jpg',
    },
});
```

## Example

::: code-demo

```yaml
title: PSV Cubemap Demo
packages:
    - name: cubemap-adapter
      imports: CubemapAdapter
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
    container: 'viewer',
    adapter: PhotoSphereViewer.CubemapAdapter,
    panorama: {
        left: baseUrl + 'cubemap/px.jpg',
        front: baseUrl + 'cubemap/nz.jpg',
        right: baseUrl + 'cubemap/nx.jpg',
        back: baseUrl + 'cubemap/pz.jpg',
        top: baseUrl + 'cubemap/py.jpg',
        bottom: baseUrl + 'cubemap/ny.jpg',
    },
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
});
```

:::

## Configuration

#### `flipTopBottom`

-   type: `boolean`
-   default: `false`

Set to `true` if the top and bottom faces are not correctly oriented.

## Panorama options

When using this adapter, the `panorama` option and the `setPanorama()` method accept an array or an object of six URLs.

```js
// Cubemap as array (order is important) :
panorama: [
  'path/to/left.jpg',
  'path/to/front.jpg',
  'path/to/right.jpg',
  'path/to/back.jpg',
  'path/to/top.jpg',
  'path/to/bottom.jpg',
]

// Cubemap as object :
panorama: {
  left:   'path/to/left.jpg',
  front:  'path/to/front.jpg',
  right:  'path/to/right.jpg',
  back:   'path/to/back.jpg',
  top:    'path/to/top.jpg',
  bottom: 'path/to/bottom.jpg',
}
```
