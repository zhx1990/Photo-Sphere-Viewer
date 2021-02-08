# Notification

<ApiButton page="PSV.components.Notification.html"/>

> Display a small message above the navbar.


## Example

TODO


## Methods

### `show(config)`

Show the notification. The configuration is described bellow.

##### `content` (required)
- type: `string`

HTML content of the notification.

##### `timeout`
- type: `number`

Auto-hide delay in milliseconds.

### `hide()`

Hide the notification.


## Events

### `show-notification`

Triggered when the notification is shown.

### `hide-notification`

Triggered when the notification is hidden.
