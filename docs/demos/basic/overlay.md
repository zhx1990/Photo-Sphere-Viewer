# Overlay

Display a secondary image above the panorama.

::: code-demo

```yaml
autoload: true
title: PSV Overlay Demo
```

```js{7-8}
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    overlay: baseUrl + 'sphere-overlay.png',
    overlayOpacity: 0.8,
});
```

:::
