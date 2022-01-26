# Equirectangular

> [Equirectangular projection](https://en.wikipedia.org/wiki/Equirectangular_projection) is one of the simplest way to create the texture of a sphere. It is the default projection used by most 360° cameras.

::: tip
There is no need to declare the equirectangular adapter as it is the default one, unless you want to change it's configuration.
:::

```js
new PhotoSphereViewer.Viewer({
  adapter: [PhotoSphereViewer.EquirectangularAdapter, {
    resolution: 64, // default
  }],
  panorama: 'path/panorama.jpg',
});
```

::: tip Cropped panoramas
If your image is not covering a full 360°×180° sphere, it will be deformed. You can fix it by providing [cropping data](../cropped-panorama.md).
:::


## Configuration

#### `resolution`
- type: `number`
- default: `64`

The number of faces of the sphere geometry used to display the panorama, higher values can reduce deformations on straight lines at the cost of performances. 

_Note: the actual number of faces is `resolution² / 2`._
