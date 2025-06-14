# Saved Layouts

Users need to be able to save their chart layouts.

## Feature description

Users need to be able to name the layout and later on retrieve any of the saved layouts by name.

Following things will be saved:

- the layout itself (how many charts and in which order)
- the dimensions of each chart
- the layout name
- selections made for each of the charts: active indicators, symbol, time granularity
- filters applied to each of the charts

## Use cases

### Save layout

We need a button in the ChartHeader component that allows users to save the current layout. The button opens a modal where users can enter a name for the layout and confirm the action.

Let's add all "actions" to a separate file in the project. Let's call it `actions.js`. We'll have a saveLayout function there and it will save the layout to Firestore. See FIRESTORE_SCHEMA.md for details.

The save action will be instantaneous. This is achieved by creating a client side repository where all methods are quick and return immediately after storing the data locally client side. Retrieval operations load the data from the client side repository (cache).

Saving to persistent storage will be done asynchronously in the background. We can use a web worker to handle this syncing.


## Implementation order

1. create required types
2. create the repository
  2.1. make the repository load available symbols, granularities, and indicators from Firestore when it starts
  2.2. add load layout and save layout methods
  2.3. implement asynchronous syncing to Firestore
3. add a save button for the layouts
3. make symbol and granularity selection save to the repository
4. add indicator selection with storing to the repository
