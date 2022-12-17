# Intro animation

Use the `Animation` helper to create a cool intro.

::: code-demo

```yaml
title: PSV Intro Animation Demo
packages:
    - name: autorotate-plugin
      imports: AutorotatePlugin
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';

const animatedValues = {
    pitch: { start: -Math.PI / 2, end: 0.2 },
    yaw: { start: Math.PI, end: 0 },
    zoom: { start: 0, end: 50 },
    fisheye: { start: 2, end: 0 },
};

const viewer = new PhotoSphereViewer.Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    defaultPitch: animatedValues.pitch.start,
    defaultYaw: animatedValues.yaw.start,
    defaultZoomLvl: animatedValues.zoom.start,
    fisheye: animatedValues.fisheye.start,
    navbar: [
        'autorotate',
        'zoom',
        {
            title: 'Rerun animation',
            content: '🔄',
            onClick: intro,
        },
        'caption',
        'fullscreen',
    ],
    plugins: [
        [PhotoSphereViewer.AutorotatePlugin, {
            autostartDelay: null,
            autostartOnIdle: false,
            autorotatePitch: animatedValues.pitch.end,
        }],
    ],
});

const autorotate = viewer.getPlugin(PhotoSphereViewer.AutorotatePlugin);

viewer.addEventListener('ready', intro, { once: true });

function intro() {
    autorotate.stop();

    new PhotoSphereViewer.utils.Animation({
        properties: animatedValues,
        duration: 2500,
        easing: 'inOutQuad',
        onTick: (properties) => {
            viewer.setOption('fisheye', properties.fisheye);
            viewer.rotate({ yaw: properties.yaw, pitch: properties.pitch });
            viewer.zoom(properties.zoom);
        },
    }).then(() => {
        autorotate.start();
    });
}
```

:::
