# Toolbar & header

Let's add header and toolbar components that will be shown on top of every chart in ChartPanel. These will include:

- symbol selector
- granularity selector
- chart deletion button
- buttons to split the panel vertically and horizontally

Let's leave the buttons be dummy for now and not implement the actual splitting functionality – that will follow.

Help me implement the header component and the toolbar component that will be contained in the header.

# Repository

My next step in developing this Chart App is to implement the data services strategy. First let's create the TypeScript types and the Repository service. The Repository will then be used from the react components to load the chart layout and to create and save new layouts. The layout management features will be the first feature to implement in the Repository.

# Refactor repository

Let's change the firestore schema for layouts and charts so that charts are included in the layout documents. Now the layout document contains a reference to the carts via chartId fields. The charts are stored in a separate collection now and now we should change this so that the separate collection is removed and the charts are stored embedded in the layout document.

Please refactor the Repository module to reflect this:

- The saveLayout function should save all charts also
- saveChart should save the chart inside it's parent layout
- updatechart should update the chart inside it's parent layout
- ...and so on

There is a useRepository hook that is used to access the repository function. All components should be updated to reflect this change.

[@index.ts](@file:sc-app/app/types/index.ts)
