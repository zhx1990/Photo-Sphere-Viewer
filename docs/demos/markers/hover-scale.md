# Mouse hover scalling

Enable global mouse hover scalling and customize for each marker.

::: code-demo

```yaml
autoload: true
title: PSV Marker custom tooltip Demo
packages:
    - name: markers-plugin
      imports: MarkersPlugin
      style: true
```

```js{10,27,34}
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new PhotoSphereViewer.Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',

    plugins: [
        [PhotoSphereViewer.MarkersPlugin, {
            defaultHoverScale: true,
            markers: [
                {
                    id: 'marker-1',
                    position: { pitch: 0.11, yaw: -0.35 },
                    image: baseUrl + 'pictos/pin-blue.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    tooltip: 'Default scalling',
                },
                {
                    id: 'marker-2',
                    position: { pitch: 0.32, yaw: 0.11 },
                    image: baseUrl + 'pictos/pin-red.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    tooltip: 'Disable scalling',
                    hoverScale: false,
                },
                {
                    id: 'marker-3',
                    position: { pitch: -0.05, yaw: 0.04 },
                    image: baseUrl + 'pictos/pin-red.png',
                    size: { width: 32, height: 32 },
                    anchor: 'bottom center',
                    // tooltip: 'Custom scalling',
                    hoverScale: { amount: 3, easing: 'ease-in-out', duration: 1000 },
                },
            ],
        }],
    ],
});
```

:::
