# Cropped panorama

Display cropped panorama by reading its XMP metadata or compute the position on the fly.

::: code-demo

```yaml
autoload: true
title: PSV Cropped Demo
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere-cropped.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    adapter: [EquirectangularAdapter, {
        backgroundColor: '#77addb',
        interpolateBackground: true,
    }],
    defaultZoomLvl: 0,
});
```

:::
