# VideoPlugin <Badge text="Styles"/>

<Badges module="video-plugin"/>

::: module
<ApiButton page="modules/VideoPlugin.html"/>
Adds controls to the video [adapters](../guide/adapters/).

This plugin is available in the [@photo-sphere-viewer/video-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/video-plugin) package.
:::

[[toc]]

## Usage

To use this plugin you must also load one of the video adapters : [equirectangular](../guide/adapters/equirectangular-video.md) or [cubemap](../guide/adapters/cubemap-video.md).

Once enabled it will add various elements to the viewer:

-   Play/pause button
-   Volume button
-   Time indicator in the navbar
-   Progressbar above the navbar
-   Play button in the center of the viewer

It also supports advanced video with timed `keypoints`.

```js
const viewer = new PhotoSphereViewer.Viewer({
    adapter: PhotoSphereViewer.EquirectangularVideoAdapter,
    panorama: {
        source: 'path/video.mp4',
    },
    plugins: [PhotoSphereViewer.VideoPlugin],
});
```

## Example

::: code-demo

```yaml
title: PSV Video Demo
packages:
    - name: equirectangular-video-adapter
      imports: EquirectangularVideoAdapter
    - name: video-plugin
      imports: VideoPlugin
      style: true
    - name: video-plugin
      imports: videoPlugin
    - name: settings-plugin
      imports: SettingsPlugin
      style: true
    - name: resolution-plugin
      imports: ResolutionPlugin
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
    container: 'viewer',
    adapter: [PhotoSphereViewer.EquirectangularVideoAdapter, {
        muted: true,
    }],
    caption: 'Ayutthaya <b>&copy; meetle</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    navbar: 'video video caption settings fullscreen',

    plugins: [
        [PhotoSphereViewer.VideoPlugin, {
            keypoints: [
                { time: 0, position: { yaw: 0, pitch: 0 } },
                { time: 5, position: { yaw: -Math.PI / 4, pitch: Math.PI / 8 } },
                { time: 10, position: { yaw: -Math.PI / 2, pitch: 0 } },
                { time: 15, position: { yaw: (-3 * Math.PI) / 4, pitch: -Math.PI / 8 } },
                { time: 20, position: { yaw: -Math.PI, pitch: 0 } },
                { time: 25, position: { yaw: (-5 * Math.PI) / 4, pitch: Math.PI / 8 } },
                { time: 30, position: { yaw: (-3 * Math.PI) / 2, pitch: 0 } },
                { time: 35, position: { yaw: (-7 * Math.PI) / 4, pitch: -Math.PI / 8 } },
            ],
        }],
        PhotoSphereViewer.videoPlugin,
        PhotoSphereViewer.SettingsPlugin,
        [PhotoSphereViewer.ResolutionPlugin, {
            defaultResolution: 'HD',
            resolutions: [
                {
                    id: 'UHD',
                    label: 'Ultra high',
                    panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_UHD.mp4' },
                },
                {
                    id: 'FHD',
                    label: 'High',
                    panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_FHD.mp4' },
                },
                {
                    id: 'HD',
                    label: 'Standard',
                    panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_HD.mp4' },
                },
                {
                    id: 'SD',
                    label: 'Low',
                    panorama: { source: baseUrl + 'equirectangular-video/Ayutthaya_SD.mp4' },
                },
            ],
        }],
    ],
});
```

:::

## Configuration

#### `keypoints`

-   type: `Array<{ position, time }>`
-   updatable: no, use `setKeypoints()` method

Defines timed keypoints that will be used by the video button.

```js
keypoints: [
    { time: 0, position: { yaw: 0, pitch: 0 } },
    { time: 5.5, position: { yaw: 0.25, pitch: 0 } },
    { time: 12.8, position: { yaw: 0.3, pitch: -12 } },
];
```

::: warning
The usage of keypoints requires to load the [video plugin](./video.md).
:::

#### `progressbar`

-   type: `boolean`
-   default: `true`
-   updatable: no

Displays a progressbar on top of the navbar.

#### `bigbutton`

-   type: `boolean`
-   default: `true`
-   updatable: no

Displays a big "play" button in the center of the viewer.

#### `lang`

-   type: `object`
-   default:

```js
lang: {
  videoPlay: 'Play/Pause',
  videoVolume: 'Volume',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

### Multi resolution

You can offer multiple resolutions of your video with the [ResolutionPlugin](./resolution.md).

```js
const viewer = new PhotoSphereViewer.Viewer({
    adapter: PhotoSphereViewer.EquirectangularVideoAdapter,
    plugins: [
        PhotoSphereViewer.VideoPlugin,
        PhotoSphereViewer.SettingsPlugin,
        [PhotoSphereViewer.ResolutionPlugin, {
            defaultResolution: 'FHD',
            resolutions: [
                {
                    id: 'UHD',
                    label: 'Ultra high',
                    panorama: { source: 'path/video-uhd.mp4' },
                },
                {
                    id: 'FHD',
                    label: 'High',
                    panorama: { source: 'path/video-fhd.mp4' },
                },
                {
                    id: 'HD',
                    label: 'Standard',
                    panorama: { source: 'path/video-hd.mp4' },
                },
            ],
        }],
    ],
});
```

## Methods

#### `setKeypoints(keypoints)`

Changes the keypoints.

## Events

#### `play-pause(playing)`

Triggered when the video starts playing or is paused.

#### `volume-change(volume)`

Triggered when the video volume changes.

#### `progress(time, duration, progress)`

Triggered when the video play progression changes.

## Buttons

This plugin adds buttons to the default navbar:

-   `videoPlay` allows to play/pause the video
-   `videoVolume` allows to change the volume/mute the video
-   `videoTime` shows the video time and duration (not a real button)

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.
