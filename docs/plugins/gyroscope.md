# GyroscopePlugin

[![NPM version](https://img.shields.io/npm/v/@photo-sphere-viewer/gyroscope-plugin?logo=npm)](https://www.npmjs.com/package/@photo-sphere-viewer/gyroscope-plugin)
[![NPM Downloads](https://img.shields.io/npm/dm/@photo-sphere-viewer/gyroscope-plugin?color=f86036&label=npm&logo=npm)](https://www.npmjs.com/package/@photo-sphere-viewer/gyroscope-plugin)
[![jsDelivr Hits](https://img.shields.io/jsdelivr/npm/hm/@photo-sphere-viewer/gyroscope-plugin?color=%23f86036&logo=jsdelivr)](https://www.jsdelivr.com/package/npm/@photo-sphere-viewer/gyroscope-plugin)
[![Rate this package](https://badges.openbase.com/js/rating/@photo-sphere-viewer/gyroscope-plugin.svg?)](https://openbase.com/js/@photo-sphere-viewer/gyroscope-plugin)

::: module modules/plugin__Gyroscope.html
Adds gyroscope controls on mobile devices.

This plugin is available in the [@photo-sphere-viewer/gyroscope-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/gyroscope-plugin) package.
:::

## Usage

Once enabled the plugin will add a new "Gyroscope" button only shown when the gyroscope API is available.

```js
const viewer = new PhotoSphereViewer.Viewer({
    plugins: [PhotoSphereViewer.GyroscopePlugin],
});
```

::: tip
The gyroscope API only works on HTTPS domains.
:::

::: warning
There are known inconsistencies of orientation data accross devices. If the panorama is not displayed in the expected orientation, this plugin is not faulty.
:::

## Configuration

#### `touchmove`

-   type: `boolean`
-   default: `true`
-   updatable: yes

Allows to pan horizontally the camera when the gyroscope is enabled (requires global `mousemove=true`).

#### `absolutePosition`

-   type: `boolean`
-   default: `false`
-   updatable: yes

By default the camera will keep its current horizontal position when the gyroscope is enabled. Turn this option `true` to enable absolute positionning and only use the device orientation.

#### `moveMode`

-   type: `smooth` | `fast`
-   default: `smooth`
-   updatable: yes

How the gyroscope data is used to rotate the panorama.

#### `lang`

-   type: `object`
-   default:

```js
lang: {
    gyroscope: 'Gyroscope',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

## Buttons

This plugin adds buttons to the default navbar:

-   `gyroscope` allows to toggle the gyroscope control

If you use a [custom navbar](../guide/navbar.md) you will need to manually add the buttons to the list.
