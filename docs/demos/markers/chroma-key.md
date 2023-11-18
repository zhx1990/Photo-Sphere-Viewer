# Chroma key video markers

Example usage of a transparent `videoLayer` marker using `chromaKey`.

::: code-demo

```yaml
autoload: true
title: PSV Marker layers Demo
version: 5.5.0-alpha.2
packages:
    - name: markers-plugin
      imports: MarkersPlugin
      style: true
```

```js{17-21}
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const viewer = new Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    navbar: 'zoom move caption fullscreen',

    plugins: [
        [MarkersPlugin, {
            markers: [
                {
                    id: 'video-greenscreen',
                    videoLayer: baseUrl + 'pictos/t-rex.mp4',
                    position: { yaw: -0.3, pitch: 0 },
                    size: { width: 500, height: 500 },
                    chromaKey: {
                        enabled: true,
                        color: '#009200',
                        similarity: 0.1,
                    },
                },
                {
                    id: 'video',
                    videoLayer: baseUrl + 'pictos/t-rex.mp4',
                    position: { yaw: 0.3, pitch: 0 },
                    size: { width: 500, height: 500 },
                },
            ],
        }],
    ],
});
```

:::
