# Cubemap video <Badge text="NEW"/>

```js
new PhotoSphereViewer.Viewer({
  adapter: [PhotoSphereViewer.CubemapVideoAdapter, {
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

<iframe style="width: 100%; height: 600px;" src="//jsfiddle.net/mistic100/h0x58zdc/embedded/result,js/dark" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


## Configuration

#### `autoplay`
- type: `boolean`
- default: `false`

Automatically starts the video on load.

#### `muted`
- type: `boolean`
- default: `false` (`true` if `autoplay=true`)

Mute the video by default.

#### `equiangular`
- type: `boolean`
- default: `true`

Set to `true` when using an equiangular cubemap (EAC), which is the format used by Youtube. Set to `false` when using a standard cubemap.


## Panorama options

When using this adapter the `panorama` option and the `setPanorama()` method accept an object to configure the video.

#### `source` (required)
- type: `string`

Path of the video file. The video must not be larger than 4096 pixels or it won't be displayed on handled devices.


### Video format

This adapter supports video files consisting of a grid of the six faces of the cube, as used by Youtube for example.

The layout of a frame must be as follow:

![cubemap-video](/assets/cubemap-video.png)
