# VideoPlugin <Badge text="NEW"/>

<ApiButton page="PSV.plugins.VideoPlugin.html"/>

> Adds controls to the video [adapters](../guide/adapters).

This plugin is available in the core `photo-sphere-viewer` package in `dist/plugins/video.js` and `dist/plugins/video.css`.


## Usage

To use this plugin you must also load one of the video adapters : [equirectangular](../guide/adapters/equirectangular-video.md) or [cubemap](../guide/adapters/cubemap-video.md).

Once enabled it will add various elements to the viewer:

- Play/pause button
- Volume button
- time indicator in the navbar
- Progress bar above the navbar
- Play button in the center of the viewer

It also supports advanced autorotate with times `keypoints`.

```js
const viewer = new PhotoSphereViewer.Viewer({
  adapter: PhotoSphereViewer.EquirectangularVideoAdapter,
  panorama: {
    source: 'path/video.mp4',
  },
  plugins: [
    [PhotoSphereViewer.VideoPlugin, {}],
  ],
});
```

### Multi resolution

You can offer multiple resolutions of your video with the [ResolutionPlugin](./plugin-resolution.md).

```js
const viewer = new PhotoSphereViewer.Viewer({
  adapter: PhotoSphereViewer.EquirectangularVideoAdapter,
  panorama: {
    source: 'path/video-fhd.mp4',
  },
  plugins: [
    PhotoSphereViewer.VideoPlugin,
    PhotoSphereViewer.SettingsPlugin,
    [PhotoSphereViewer.ResolutionPlugin, {
      resolutions: [
        {
          id      : 'UHD',
          label   : 'Ultra high',
          panorama: { source: 'path/video-uhd.mp4' },
        },
        {
          id      : 'FHD',
          label   : 'High',
          panorama: { source: 'path/video-fhd.mp4' },
        },
        {
          id      : 'HD',
          label   : 'Standard',
          panorama: { source: 'path/video-hd.mp4' },
        },
      ],
    }],
  ],
});
```

## Example

<iframe style="width: 100%; height: 600px;" src="//jsfiddle.net/mistic100/47fctodr/embedded/result,js/dark" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


## Configuration

#### `keypoints`
- type: `Array<{ position, time }>`

Defines timed keypoints that will be used with by the autorotate button.

```js
keypoints: [
  { time: 0,    position: { longitude: 0,    latitude: 0 } },
  { time: 5.5,  position: { longitude: 0.25, latitude: 0 } },
  { time: 12.8, position: { longitude: 0.3,  latitude: -12 } },
]
```

#### `progressbar`
- type: `boolean`
- default: `true`

Displays a progressbar on top of the navbar.

#### `bigbutton`
- type: `boolean`
- default: `true`

Displays a big "play" button in the center of the viewer.

#### `lang`
- type: `object`
- default:
```js
lang: {
  videoPlay  : 'Play/Pause',
  videoVolume: 'Volume',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._


## Events

#### `play`

Triggered when the video starts playing.

#### `pause`

Triggered when the video is paused.

#### `volume-change(volume)`

Triggered when the video volume changes.

#### `progress({ time, duration, progress })`

Triggered when the video play progression changes.


## Buttons

This plugin adds buttons to the default navbar:
- `videoPlay` allows to play/pause the video
- `videoVolume` allows to change the volume/mute the video
- `videoTime` shows the video time and duration (not a button)

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.
