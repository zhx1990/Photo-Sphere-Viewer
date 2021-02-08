# Overlay

<ApiButton page="PSV.components.Overlay.html"/>

> Display a message with an illustration on top of the viewer.


## Example

TODO


## Methods

### `show(config)`

Show the overlay. The configuration is described bellow.

##### `id`
- type: `string`

Unique identifier of the overlay, this will be used to `hide` the overlay only if the content has not been replaced by something else.

##### `text` (required)
- type: `string`

Main message of the overlay.

##### `subtext`
- type: `string`

Secondary message of the overlay.

##### `image`
- type: `string`

SVG image/icon displayed above the text.


### `hide([id])`

Hide the overlay, without condition if `id` is not provided, or only if the last `show` was called with the same `id`.


## Events

### `show-overlay(id)`

Triggered when the overlay is shown.

### `hide-overlay(id)`

Triggered when the overlay is hidden.
