# Equirectangular video <Badge text="NEW"/>

```js
new PhotoSphereViewer.Viewer({
  adapter: [PhotoSphereViewer.EquirectangularVideoAdapter, {
    autoplay: false, // default
    muted: false, // default
  }],
  panorama: {
    source: 'path/video.mp4', // also supports webm
  },
  plugins: [
    PhotoSphereViewer.VideoPlugin,
  ],
});
```

::: warning
This adapter requires to use the [VideoPlugin](../../plugins/plugin-video.md).
:::


## Example

<iframe style="width: 100%; height: 600px;" src="//jsfiddle.net/mistic100/47fctodr/embedded/result,js/dark" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


## Configuration

#### `autoplay`
- type: `boolean`
- default: `false`

Automatically starts the video on load.

#### `muted`
- type: `boolean`
- default: `false` (`true` if `autoplay=true`)

Mute the video by default.

#### `resolution`
- type: `number`
- default: `64`

The number of faces of the sphere geometry used to display the panorama, higher values can reduce deformations on straight lines at the cost of performances.

_Note: the actual number of faces is `resolution² / 2`._


## Panorama options

When using this adapter the `panorama` option and the `setPanorama()` method accept an object to configure the video.

#### `source` (required)
- type: `string`

Path of the video file. The video must not be larger than 4096 pixels or it won't be displayed on handled devices.
