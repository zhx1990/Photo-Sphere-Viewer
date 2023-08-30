# Cubemap video

<Badges module="cubemap-video-adapter"/>

::: module
This adapter is available in the [@photo-sphere-viewer/cubemap-video-adapter](https://www.npmjs.com/package/@photo-sphere-viewer/cubemap-video-adapter) package.
:::

```js
const viewer = new PhotoSphereViewer.Viewer({
    adapter: PhotoSphereViewer.CubemapVideoAdapter,
    panorama: {
        source: 'path/video.mp4', // also supports webm
    },
    plugins: [PhotoSphereViewer.VideoPlugin],
});
```

::: warning
This adapter requires to use the [VideoPlugin](../../plugins/video.md).
:::

## Example

::: code-demo

```yaml
title: PSV Cubemap Video Demo
packages:
    - name: cubemap-video-adapter
      imports: CubemapVideoAdapter
    - name: video-plugin
      imports: VideoPlugin
      style: true
    - name: settings-plugin
      imports: SettingsPlugin
      style: true
    - name: resolution-plugin
      imports: ResolutionPlugin
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    adapter: [CubemapVideoAdapter, {
        muted: true,
    }],
    caption: 'Dreams of Dalí <b>&copy; The Dalí Museum</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    navbar: 'video caption settings fullscreen',

    plugins: [
        VideoPlugin,
        SettingsPlugin,
        [ResolutionPlugin, {
            defaultResolution: 'HD',
            resolutions: [
                {
                    id: 'UHD',
                    label: 'Ultra high',
                    panorama: { source: baseUrl + 'cubemap-video/DreamOfDali_UHD.webm' },
                },
                {
                    id: 'FHD',
                    label: 'High',
                    panorama: { source: baseUrl + 'cubemap-video/DreamOfDali_FHD.webm' },
                },
                {
                    id: 'HD',
                    label: 'Standard',
                    panorama: { source: baseUrl + 'cubemap-video/DreamOfDali_HD.webm' },
                },
            ],
        }],
    ],
});
```

:::

## Configuration

#### `autoplay`

-   type: `boolean`
-   default: `false`

Automatically starts the video on load.

#### `muted`

-   type: `boolean`
-   default: `false`

Mute the video by default.

#### `equiangular`

-   type: `boolean`
-   default: `true`

Set to `true` when using an equiangular cubemap (EAC), which is the format used by Youtube. Set to `false` when using a standard cubemap.

## Panorama options

When using this adapter, the `panorama` option and the `setPanorama()` method accept an object to configure the video.

#### `source` (required)

-   type: `string`

Path of the video file. The video must not be larger than 4096 pixels or it won't be displayed on handled devices.

### Video format

This adapter supports video files consisting of a grid of the six faces of the cube, as used by Youtube for example.

The layout of a frame must be as follow:

![cubemap-video](../../images/cubemap-video.png)
