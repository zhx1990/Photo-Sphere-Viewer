# VisibleRangePlugin

<Badges module="visible-range-plugin"/>

::: module
<ApiButton page="modules/VisibleRangePlugin.html"/>
Locks the visible area of the panorama.

This plugin is available in the [@photo-sphere-viewer/visible-range-plugin](https://www.npmjs.com/package/@photo-sphere-viewer/visible-range-plugin) package.
:::

[[toc]]

## Usage

The plugin allows to define `horizontalRange` and `verticalRange` to lock to viewable zone. It affects manual moves and automatic rotation.

```js
const viewer = new PhotoSphereViewer.Viewer({
    plugins: [
        [PhotoSphereViewer.VisibleRangePlugin, {
            horizontalRange: [-Math.PI / 2, Math.PI / 2],
            verticalRange: [-Math.PI / 3, Math.PI / 3],
        }],
    ],
});

const visibleRangePlugin = viewer.getPlugin(PhotoSphereViewer.VisibleRangePlugin);

visibleRangePlugin.setHorizontalRange(['0deg', '180deg']);
visibleRangePlugin.setVerticalRange(null);
```

Alternatively, if `usePanoData` is set to `true`, the visible range is limited to the [cropped panorama data](../guide/adapters/equirectangular.md#cropped-panorama) provided to the viewer.

## Example

::: code-demo

```yaml
title: PSV Visible Range Demo
packages:
    - name: visible-range-plugin
      imports: VisibleRangePlugin
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

let visibleRangePlugin;

const viewer = new PhotoSphereViewer.Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere-cropped.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    defaultZoomLvl: 30,

    navbar: [
        // custom buttons to clear and set the range
        {
            content: 'Clear range',
            className: 'custom-button',
            onClick: () => {
                visibleRangePlugin.setHorizontalRange(null);
                visibleRangePlugin.setVerticalRange(null);
            },
        },
        {
            content: 'Set custom range',
            className: 'custom-button',
            onClick: () => {
                visibleRangePlugin.setHorizontalRange([-Math.PI / 2, Math.PI / 2]);
                visibleRangePlugin.setVerticalRange([-Math.PI / 3, Math.PI / 3]);
            },
        },
        {
            content: 'Set range from panoData',
            className: 'custom-button',
            onClick: () => {
                visibleRangePlugin.setRangesFromPanoData();
            },
        },
        'caption',
        'fullscreen',
    ],

    plugins: [
        [PhotoSphereViewer.VisibleRangePlugin, {
            usePanoData: true,
        }],
    ],
});

visibleRangePlugin = viewer.getPlugin(PhotoSphereViewer.VisibleRangePlugin);
```

:::

## Configuration

#### `horizontalRange`

-   type: `double[]|string[]`
-   default: `null`
-   updatable: no, use `setHorizontalRange()` plugin

Visible horizontal range as two angles.

#### `verticalRange`

-   type: `double[]|string[]`
-   default: `null`
-   updatable: no, use `setVerticalRange()` plugin

Visible vertical range as two angles.

#### `usePanoData`

-   type: `boolean`
-   default: `false`
-   updatable: yes

Use cropped panorama data as visible range immediately after load.

## Methods

#### `setHorizontalRange(range)` | `setVerticalRange(range)`

Change or remove the ranges.

#### `setRangesFromPanoData()`

Use cropped panorama data as visible range.
