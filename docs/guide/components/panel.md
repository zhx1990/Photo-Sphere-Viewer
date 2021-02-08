# Panel

<ApiButton page="PSV.components.Panel.html"/>

> Display HTML content on a sidebar on the left of the viewer.


## Example

This example adds a custom button to toggle a panel.

<iframe style="width: 100%; height: 500px;" src="//jsfiddle.net/mistic100/9170wgfk/embedded/result,js/dark" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


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

### `isVisible([id]): boolean`

Check if the panel is opened.


## Events

### `open-panel(id)`

Triggered when the panel is opened.

### `close-panel(id)`

Triggered when the panel is closed.
