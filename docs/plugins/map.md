# MapPlugin <Badge text="NEW"/>

<Badges module="map-plugin"/>

::: module
<ApiButton page="modules/plugin__Map.html"/>
Adds a interactive map on the viewer, with zoom/pan and optional hotspots.

This plugin is available in the [@photo-sphere-viewer/map-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/map-plugin) package. **It has a stylesheet.**
:::

[[toc]]

## Usage

The minimal configuration of this plugin contains `imageUrl` and `center` (the position of the panorama on the map, in pixels). The map rotation can be ajusted with `rotation`.

```js
const viewer = new PhotoSphereViewer.Viewer({
    plugins: [
        [PhotoSphereViewer.MapPlugin, {
            imageUrl: 'path/to/map.jpg',
            center: { x: 785, y: 421 },
            rotation: '-12deg',
        }],
    ],
});
```

## Example

::: code-demo

```yaml
title: PSV Map Demo
packages:
    - name: map-plugin
      imports: MapPlugin
      style: true
    - name: markers-plugin
      imports: MarkersPlugin
      style: true
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    defaultYaw: '-10deg',

    plugins: [
        [PhotoSphereViewer.MapPlugin, {
            imageUrl: baseUrl + 'map.jpg',
            center: { x: 807, y: 607 },
            rotation: '135deg',
            defaultZoom: 40,
            hotspots: [
                {
                    x: 450,
                    y: 450,
                    id: 'green-lake',
                    color: 'green',
                    tooltip: 'Lac vert',
                },
                {
                    yaw: '-45deg',
                    distance: 80, // pixels
                },
            ],
        }],
        [PhotoSphereViewer.MarkersPlugin, {
            markers: [
                {
                    id: 'mountain',
                    tooltip: 'A mountain',
                    position: { yaw: 0.11, pitch: 0.32 },
                    image: baseUrl + 'pictos/pin-blue.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    data: {
                        map: {
                            distance: 220,
                            size: 25,
                            image: baseUrl + 'pictos/pin-blue.png',
                        },
                    },
                },
            ],
        }],
    ],
});
```

:::

::: tip
The north of the compass is always toward the top of the map, before rotation.
:::

## Configuration

#### `imageUrl` (required)

-   type: `string`
-   updatable: no, use `setImage()` method

URL of the image to use as map.

#### `center` (required)

-   type: `{ x: number, y: number }`
-   updatable: no, use `setCenter()` method

The position of the panorama on the map, in pixels.

#### `rotation`

-   type: `number | string`
-   default: `0`
-   updatable: yes

Rotation to apply to the map to make it match with the panorama.

#### `size`

-   type: `string`
-   default: `200px`
-   updatable: yes

The size of the widget, can be declared in `px`, `rem`, `vh`, etc.

#### `position`

-   type: `string`
-   default: `bottom left`
-   updatable: yes

Position of the widget, accepted positions are combinations of `top`, `bottom` and `left`, `right`.

#### `visibleOnLoad`

-   type: `boolean`
-   default: `true`
-   updatable: no

Displays the map when loading the first panorama.

#### `overlayImage`

-   type: `string`
-   default: default SVG
-   updatable: yes

SVG or image URL drawn on top of the map, can be `null` to disable.

#### `pinImage`

-   type: `string`
-   default: default SVG
-   updatable: yes

SVG or image URL used for the central pin.

#### `pinSize`

-   type: `number`
-   default: `35`
-   updatable: yes

Size of the central pin.

#### `spotColor`

-   type: `string`
-   default: `white`
-   updatable: yes

Color used when no `spotImage` is defined. The spot is always a circle.

#### `spotImage`

-   type: `string`
-   default: `null`
-   updatable: yes

SVG or image URL used to represent hotspots.

#### `spotSize`

-   type: `number`
-   default: `15`
-   updatable: yes

Size of the hotspots.

#### `static`

-   type: `boolean`
-   default: `false`
-   updatable: yes

If `true` the map will not rotate, only the central pin will, to indicate where the panorama is oriented.

#### `defaultZoom`

-   type: `number`
-   default: `100`
-   updatable: no

Default zoom level of the map.

#### `maxZoom`

-   type: `number`
-   default: `200`
-   updatable: yes

Maximum zoom level of the map.

#### `minZoom`

-   type: `number`
-   default: `20`
-   updatable: yes

Minimum zoom level of the map.

#### `hotspots`

-   type: `MapHotspot[]`
-   default: `null`
-   updatable: no, use `setHotspots()` method

Small dots visible on the map. See bellow.

#### `lang`

-   type: `object`
-   default:

```js
lang: {
    map: 'Map',
    mapMaximize: 'Maximize',
    mapMinimize: 'Minimize',
    mapReset: 'Reset',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

### Hotspots

#### `id`

-   type: `string`
-   default: generated

Useful to react to clicks with the `select-hotspot` event.

#### `yaw`+`distance` or `x`+`y` (required)

-   type: `number`

Configure the position of the hotspot on the map, either with a angle and a distance (in pixels on the map image) or absolute x/y coordinates (also in pixels on the map image).

#### `color` / `image` / `size`

Allow to override the default `spotColor`, `spotImage` and `spotSize`.

::: tip
[Markers](./markers.md) can be displayed on the map by defining their `map` data, which must be an hotspot object (minus `yaw` which is know from the marker position).

The marker tooltip is reused if defined. The viewer will be moved to face the marker if clicked on the map.

```js{7,15}
markers: [
    {
        id: 'marker-1',
        image: 'pin.png',
        position: { yaw: '15deg', pitch: 0 },
        data: {
            map: { distance: 120, image: 'pin.png' },
        },
    },
    {
        id: 'marker-2',
        text: 'Warning',
        position: { textureX: 4500, textureY: 2100 },
        data: {
            map: { x: 150, y: 310 },
        },
    },
],
```

:::

## Methods

#### `setHotspots(hotspots)`

Changes the hotspots.

```js
mapPlugin.setHotspots([
    { id: '1', yaw: '0deg', distance: 120, tooltip: 'Hotspot one' },
    { id: '2', x: 150, y: 310, image: 'blue-dot.png' },
]);
```

#### `clearHotspots()`

Removes all hotspots.

#### `setImage(url, center?, rotation?)`

Changes the image of the map.

```js
mapPlugin.setImage('map2.jpg', { x: 500, y: 500 });
```

#### `setCenter(center)`

Changes the position of the panorama on the map.

```js
mapPlugin.setCenter({ x: 500, y: 500 });
```

#### `close()` | `open()`

Switches between closed and opened mode.

#### `maximize()` | `minimize()`

Switches between maximized and minimized views. (Has no effect if the map is closed).

## Events

#### `select-hotspot(hotspotId)`

Triggered when the user clicks on a hotspot.

```js
mapPlugin.addEventListener('select-hotspot', ({ hotspotId }) => {
    console.log(`Clicked on hotspot ${hotspotId}`);
});
```
