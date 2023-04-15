# Panel

::: module
<ApiButton page="classes/Core.Panel.html"/>
Display HTML content on a sidebar on the left of the viewer.
:::

## Example

This example adds a custom button to toggle a panel.

::: code-demo

```yaml
title: PSV Panel Demo
```

```js
const baseUrl = 'https://photo-sphere-viewer-data.netlify.app/assets/';
const BUTTON_ID = 'panel-button';
const PANEL_ID = 'custom-panel';

const viewer = new PhotoSphereViewer.Viewer({
    container: 'viewer',
    panorama: baseUrl + 'sphere.jpg',
    caption: 'Parc national du Mercantour <b>&copy; Damien Sorel</b>',
    loadingImg: baseUrl + 'loader.gif',
    touchmoveTwoFingers: true,
    mousewheelCtrlKey: true,
    navbar: [
        'zoom',
        {
            id: BUTTON_ID,
            title: 'Toggle panel',
            content: '🆘',
            onClick: () => {
                if (viewer.panel.isVisible(PANEL_ID)) {
                    viewer.panel.hide();
                } else {
                    viewer.panel.show({
                        id: PANEL_ID,
                        width: '60%',
                        content: document.querySelector('#panel-content').innerHTML,
                    });
                }
            },
        },
        'caption',
        'fullscreen',
    ],
});

viewer.addEventListener('show-panel', ({ panelId }) => {
    if (panelId === PANEL_ID) {
        viewer.navbar.getButton(BUTTON_ID).toggleActive(true);
    }
});

viewer.addEventListener('hide-panel', ({ panelId }) => {
    if (panelId === PANEL_ID) {
        viewer.navbar.getButton(BUTTON_ID).toggleActive(false);
    }
});
```

```html
<script type="html/template" id="panel-content">
    <h1>HTML Ipsum Presents</h1>

    <p><strong>Pellentesque habitant morbi tristique</strong> senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper. <em>Aenean ultricies mi vitae est.</em> Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, <code>commodo vitae</code>, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. <a href="#">Donec non enim</a> in turpis pulvinar facilisis. Ut felis.</p>

    <h2>Header Level 2</h2>

    <ol>
       <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>
       <li>Aliquam tincidunt mauris eu risus.</li>
    </ol>

    <blockquote><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus magna. Cras in mi at felis aliquet congue. Ut a est eget ligula molestie gravida. Curabitur massa. Donec eleifend, libero at sagittis mollis, tellus est malesuada tellus, at luctus turpis elit sit amet quam. Vivamus pretium ornare est.</p></blockquote>

    <h3>Header Level 3</h3>

    <ul>
       <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>
       <li>Aliquam tincidunt mauris eu risus.</li>
    </ul>
</script>
```

:::

## Methods

### `show(config)`

Open the side panel.

| option | type |   |
| ------ | ---- | - |
| `id` | `string` | Unique identifier of the panel, this will be used to `hide` the panel only if the content has not been replaced by something else. It will be used to store the width defined by the user when using the resize handle. |
| `content` (required) | `string` | HTML content of the panel. |
| `noMargin` (default&nbsp;`false`) | `boolean` | Remove the default margins inside the panel. |
| `width` (default&nbsp;`400px`) | `string` | Initial width of the panel (example: `100%`, `600px`). |
| `clickHandler(target)` | `function<HTMLElement>` | Function called when the user clicks inside the panel or presses the Enter key while an element focused. |

::: tip Content focus
After openning, the first focusable element (`a`, `button` or anything with `tabindex`) will be focused, allowing the user to navigate with the Tab key and activate the `clickHandler` with the `Enter` key.
:::

### `hide([id])`

Hide the panel, without condition if `id` is not provided, or only if the last `show` was called with the same `id`.

### `isVisible([id]): boolean`

Check if the panel is opened.

## Events

### `show-panel(id)`

Triggered when the panel is shown.

### `hide-panel(id)`

Triggered when the panel is hidden.
