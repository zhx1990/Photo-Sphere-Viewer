# Zero config

Simple panorama with minimal options.

::: code-demo

```yaml
autoload: true
title: PSV Basic Demo
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

new PhotoSphereViewer.Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
});
```

:::
