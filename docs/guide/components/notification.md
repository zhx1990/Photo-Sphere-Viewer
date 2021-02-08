# Notification

<ApiButton page="PSV.components.Notification.html"/>

> Display a small message above the navbar.


## Example

This example consistently displays new notifications.

<iframe style="width: 100%; height: 500px;" src="//jsfiddle.net/mistic100/m8nxryc4/embedded/result,js/dark" allowfullscreen="allowfullscreen" frameborder="0"></iframe>


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

### `isVisible(): boolean`

Check if the notification is visible.


## Events

### `show-notification`

Triggered when the notification is shown.

### `hide-notification`

Triggered when the notification is hidden.
