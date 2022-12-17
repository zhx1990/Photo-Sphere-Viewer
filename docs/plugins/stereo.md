# StereoPlugin

::: module modules/plugin__Stereo.html
Adds stereo view on mobile devices. **Requires the [Gyroscope plugin](./gyroscope.md).**

This plugin is available in the `@photo-sphere-viewer/stereo-plugin` package.
:::

## Usage

Once enabled the plugin will add a new "Stereo view" button only shown when the gyroscope API is available. It uses the WakeLock API to prevent the display from dimming or shuting down.

```js
const viewer = new PhotoSphereViewer.Viewer({
    plugins: [
        PhotoSphereViewer.GyroscopePlugin, 
        PhotoSphereViewer.StereoPlugin,
    ],
});
```

## Configuration

#### `lang`

-   type: `object`
-   default:

```js
lang: {
    stereo: 'Stereo view',
    stereoNotification: 'Click anywhere to exit stereo view.',
    pleaseRotate: 'Please rotate your device',
    tapToContinue: '(or tap to continue)',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

## Buttons

This plugin adds buttons to the default navbar:

-   `stereo` allows to start the stereo view

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.
