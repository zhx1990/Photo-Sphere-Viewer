# Tooltip

<ApiButton page="PSV.services.TooltipRenderer.html"/>

> Add custom tooltips over the viewer.

To add a tooltip you must call `viewer.tooltip.create()`, this will a return a tooltip instance with two methods : `move()` and `hide()`. This allows to have multiple tooltips at the same time.


## Example

This example adds a persistent tooltip following the cursor.

<iframe style="width: 100%; height: 500px;" src="//jsfiddle.net/mistic100/bzmt32qL/embedded/result,js/dark" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


## Methods

### `create(config)`

Create a tooltip. The configuration is described bellow.

##### `content` (required)
- type: `string`

HTML content of the tooltip.

#### `top` | `left` (required)
- type: `integer`

Pixel coordinate of the tooltip relative to the top-left corner of the viewer.

##### `position`
- type: `string`
- default: `top center`

Tooltip position toward it's arrow tip. Accepted values are combinations of `top`, `center`, `bottom` and `left`, `center`, `right`.

##### `className`
- type: `string`

Additional CSS class added to the tooltip.

##### `data`
- type: `any`

Userdata associated to the tooltip (useful for events).

### `tooltip.move(config)`

Updates the position of the tooltip, the parameters are the same `top`, `left` and `position` as above.

### `tooltip.hide()`

Hide and destroy the tooltip.


## Events

### `show-tooltip(data)`

Triggered when the tooltip is shown.

### `hide-tooltip(data)`

Triggered when the tooltip is hidden.
