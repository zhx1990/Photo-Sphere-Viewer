# PlanPlugin <Badge text="Styles"/>

<Badges module="plan-plugin"/>

::: module
<ApiButton page="modules/PlanPlugin.html"/>
Adds a [Leaflet](https://leafletjs.com) map on the viewer, showing the location of the panorama and optional hotspots. It uses OpenStreetMap by default.

This plugin is available in the [@photo-sphere-viewer/plan-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/plan-plugin) package.
:::

[[toc]]

## Usage

The minimal configuration of this plugin contains `coordinates` (the GPS position of the panorama).

```js
const viewer = new PhotoSphereViewer.Viewer({
    plugins: [
        [PhotoSphereViewer.PlanPlugin, {
            coordinates: [6.79077, 44.58041],
        }],
    ],
});
```

::: warning
Do not forget to import Leaflet JS and CSS files.
:::

## Example

::: code-demo

```yaml
title: PSV Plan Demo
version: 5.7.0-alpha.1
packages:
    - name: plan-plugin
      imports: PlanPlugin
      style: true
    - name: markers-plugin
      imports: MarkersPlugin
      style: true
    - name: leaflet
      external: true
      version: 1
      imports: TileLayer
      style: true
      js: dist/leaflet-src.esm.js
      css: dist/leaflet.css
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    defaultYaw: '-10deg',

    plugins: [
        [PlanPlugin, {
            defaultZoom: 14,
            coordinates: [6.78677, 44.58241],
            layers: [
                {
                    name: 'OpenStreetMap',
                    urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                    attribution: '&copy; OpenStreetMap',
                },
                {
                    name: 'OpenTopoMap',
                    layer: new TileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                        subdomains: ['a', 'b', 'c'],
                        maxZoom: 17,
                    }),
                    attribution: '&copy; OpenTopoMap',
                },
            ],
            hotspots: [
                {
                    coordinates: [6.7783, 44.58506],
                    id: 'green-lake',
                    tooltip: 'Lac vert',
                    color: 'green',
                },
            ],
        }],
        [MarkersPlugin, {
            markers: [
                {
                    id: 'mountain',
                    tooltip: 'A mountain',
                    position: { yaw: 0.11, pitch: 0.32 },
                    image: baseUrl + 'pictos/pin-blue.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    data: {
                        plan: {
                            coordinates: [6.79077, 44.58041],
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

## Configuration

#### `coordinates` (required)

-   type: `[number, number]`
-   updatable: yes

GPS position of the panorama (longitude, latitude). You can also use `setCoordinates()` method.

#### `layers`

-   type: `array`
-   default: OpenStreetMap
-   updatable: no

List of available base layers, if more than one is defined, a button will allow to switch between layers.

Each element is an object containing `urlTemplate` (for standard raster tiles) **OR** `layer`  (for any custom Leaflet layers), as well as `name` and `attribution`.

```js
layers: [
    {
        name: 'OpenStreetMap',
        urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '&copy; OpenStreetMap',
    },
    {
        name: 'OpenTopoMap',
        layer: new L.TileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
            subdomains: ['a', 'b', 'c'],
            maxZoom: 17,
        }),
        attribution: '&copy; OpenTopoMap',
    },
]
```

_Note: this option is ignored if `configureLeaflet` is used._

#### `configureLeaflet`

-   type: `function<map>`
-   updatable: no

Allows to configure Leaftlet yourself. This will disable the default layer.

```js
configureLeaflet(map) {
    // https://leafletjs.com/reference.html
},
```

#### `size`

-   type: `{ width: string, height: string }`
-   default: `{ width: '300px', height: '200px' }`
-   updatable: yes

The size of the widget.

#### `position`

-   type: `string`
-   default: `bottom left`
-   updatable: yes

Position of the widget, accepted positions are combinations of `top`, `bottom` and `left`, `right`.

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

#### `hotspots`

-   type: `PlanHotspot[]`
-   default: `null`
-   updatable: yes

Markers visible on the map. See bellow. You can also use `setHotspots()` method.

#### `spotStyle`

-   type: `object`
-   updatable: yes

Style of hotspots.

::: dialog "See details" "Plan hotspot style"

The hotspots are represented by a circle with configurable size and color, but can also be an image.

```ts
{
    /**
     * Size of the hotspot
     * @default 15
     */
    size?: number;
    /**
     * SVG or image URL used for hotspot
     */
    image?: string;
    /**
     * Color of the hotspot when no image is provided
     * @default 'white'
     */
    color?: string;
    /**
     * Size on mouse hover
     * @default null
     */
    hoverSize?: number;
    /**
     * SVG or image URL on mouse hover
     * @default null
     */
    hoverImage?: string;
    /**
     * Color on mouse hover
     * @default null
     */
    hoverColor?: string;
    /**
     * Size of the border shown on mouse hover
     * @default 4
     */
    hoverBorderSize?: number;
    /**
     * Color of the border shown on mouse hover
     * @default 'rgba(255, 255, 255, 0.8)'
     */
    hoverBorderColor?: string;
}
```

:::

#### `defaultZoom`

-   type: `number`
-   default: `15`
-   updatable: no

Default zoom level of the map.

#### `visibleOnLoad`

-   type: `boolean`
-   default: `true`
-   updatable: no

Displays the map when loading the first panorama.

#### `buttons`

-   type: `object`
-   default: `{ maximize: true, close: true, reset: true }`
-   updatable: no

Configure which buttons are visible around the map.

#### `lang`

-   type: `object`
-   default:

```js
lang: {
    map: 'Map',
    mapMaximize: 'Maximize',
    mapMinimize: 'Minimize',
    mapReset: 'Reset',
    mapLayers: 'Base layer',
}
```

_Note: this option is not part of the plugin but is merged with the main [`lang`](../guide/config.md#lang) object._

### Hotspots

#### `id`

-   type: `string`
-   default: generated

Useful to react to clicks with the `select-hotspot` event.

#### `coordinates` (required)

-   type: `[number, number]`

Configure the position of the hotspot on the map.

#### `style`

Allow to override the default `spotStyle`.

#### `tooltip`

-   type: `string | { content: string, className: string }`
-   default: `null`

::: tip
[Markers](./markers.md) can be displayed on the map by defining their `plan` data, which must be an hotspot object.

The marker tooltip is reused if defined. The viewer will be moved to face the marker if clicked on the map.

```js{7,15}
markers: [
    {
        id: 'marker-1',
        image: 'pin.png',
        position: { yaw: '15deg', pitch: 0 },
        data: {
            plan: { coordinates: [6.79077, 44.58041], image: 'pin.png' },
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
    { id: '1', coordinates: [6.79077, 44.58041], tooltip: 'Hotspot one' },
    { id: '2', coordinates: [6.79077, 44.58041], image: 'blue-dot.png' },
]);
```

#### `clearHotspots()`

Removes all hotspots.

#### `setCoordinates(coordinates)`

Changes the position of the panorama on the map.

```js
mapPlugin.setCoordinates([6.79077, 44.58041]);
```

#### `close()` | `open()`

Switches between closed and opened mode.

#### `maximize()` | `minimize()`

Switches between maximized and minimized views. (Has no effect if the map is closed).

#### `getLeaflet()`

Returns the Leaflet instance.

## Events

#### `select-hotspot(hotspotId)`

Triggered when the user clicks on a hotspot.

```js
planPlugin.addEventListener('select-hotspot', ({ hotspotId }) => {
    console.log(`Clicked on hotspot ${hotspotId}`);
});
```
