# Panel

<ApiButton page="PSV.components.Panel.html"/>

> Display HTML content on a sidebar on the left of the viewer.


## Example

TODO


## Methods

### `show(config)`

Open the side panel. The configuration is described bellow.

##### `id`
- type: `string`

Unique identifier of the panel, this will be used to `hide` the panel only if the content has not been replaced by something else. It will be used to store the width defined by the user when using the resize handle.

##### `content` (required)
- type: `string`

HTML content of the panel.

##### `noMargin`
- type: `boolean`
- default: `false`

Remove the default margins inside the panel.

##### `width`
- type: `string`
- default: `400px` (from CSS)

Initial width if the panel (example: `100%`, `600px`).

##### `clickHandler`
- type: `function`

Function called when the user clicks inside the panel.

### `hide([id])`

Hide the panel, without condition if `id` is not provided, or only if the last `show` was called with the same `id`.


## Events

### `open-panel(id)`

Triggered when the panel is opened.

### `close-panel(id)`

Triggered when the panel is closed.
