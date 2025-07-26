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

# Save chart dimensions

Next, I want the dimensions of the different panels to be saved in Firestore. The users are now able to resize the panels. We should make the app auto-save to Firestore when resizing is complete.

Notes for the implementation:

- Add a small timeout that is waited after resize is complete, and then save using the repository methods.
- Add necessary fields to the TypeScript types for the size related fields.
- When loading a layout from Firestore, it should load the dimensions and then apply those so that the layout is rendered using the stored dimensions.

Please add this functionality to this app.

# Layout selector changes

Let's change the layout selector like so:

- In the App it should only show the title of the currently active layout, and a button to open the Layout Selector Modal (new modal)
- The Layout Presets should be removed from the LayoutSelector
- The ... button opens the new Layout Selector Modal
- The Layout Selector Modal has two functions: to activate one of the existing layouts and to create a new layout (and then select it or some other layout as the next active layout)
- modal has a way to add a new layout: For the new layout, it should allow a way to select a layout preset like with the current Layout Presets, and it should ask a title for the new layout. The title field and the presets could be behind and accordion component that is opened when adding a new layout.

Implement this new functionality.

# Active layout persistence

Make the active layout persist across sessions. When activating a new layout in the LayoutSelector it should update the layout as active in Firestore. Then when loading the app, it should load the active layout from Firestore and set it as the active layout rendering it in the ChartPanel.

When the user has not activated a layout yet, i.e. they are using an unsaved layout, we should continue using the unsaved one when the app loads. In this case the user can only have one chart in view. To use the layouts with multiple panels, the user needs to create a saved layout first and select that.

# Chart context

there is a symbolChange listener in the SCChart component. Would it be easier to use that to know when to persist the symbol to Firestore than the current approach? the current approach relies on a onSymbolChange listener prop that is triggered by the symbol select element that is in [@ChartToolbar.tsx](@file:sc-app/app/components/ChartToolbar.tsx)

Perpahps we could use a React Context to store the chart selections we have in the toolbar: symbol and granularity. Additionally a hook to use the Context. We could use the hook in CSChart to listen to chart changes for granularity and symbol changes and store them to the context using the hook. Then we update the changes to the Repository in [@ChartContainer.tsx](@file:sc-app/app/components/ChartContainer.tsx) or in [@ChartApp.tsx](@file:sc-app/app/components/ChartApp.tsx)

There are more chart settings and events that we can handle using this similar approach in the future.

# Indicators

Let's add a menu for indicators selection. There should be a dropdown menu in ChartToolbar in the Right side section.

The indicators for this dropdown menu should be loaded from Firestore from the `indicators` collection. The documents in the indicators collection looks like this:

```
{
    id: "bollinger-bands",
    name: "Bollinger Bands",
    display: "Overlay",
    visible: false,
    params: { period: 20, stdDev: 2 },
    scale: "Price",
    className: "MarketIndicator",
}
```

this document is in path `/indicators/bollinger-bands` in Firestore.

The chart API is documented in CHART_API_REFERENCE.md

The selection of an indicator from the menu should enable the indicator in the chart. This can be done using the `showIndicator()` function. The document retrieved from Firestore should be passed to the `showIndicator()` function.

Indicator selection and deselectyion in the chart emits an `indicatorChange` event. You can find the documentation for this in CHART_API_REFERENCE.md in section #### 3. `IndicatorChangeEvent`. Add a listener for this event into SCChart and make it save the indicators state in the ChartSettingsContext. This context needs to be enhanced to handle indicators.

Implement this, please.

# Subscriptions via Stripe

There will be a trial period of 7 days to use the application. After the trial period, the user needs to have an active subscription in Stripe.

We should handle the trial period and subscription status in Stripe.

There are two subscription products already created in Stripe: `Basic` and `Pro`. You can look this up using your MCP server.

Here's how the payment method flow works:

Frontend (Web App) - Payment Method Creation

In your web app, you'd use Stripe Elements or Payment Element to securely collect payment details and create the payment method directly with Stripe:

// Example with Stripe Elements
const stripe = Stripe('pk_test_your_publishable_key');
const elements = stripe.elements();
const cardElement = elements.create('card');

// When user submits form
const {paymentMethod, error} = await stripe.createPaymentMethod({
type: 'card',
card: cardElement,
billing_details: {
email: 'user@example.com',
},
});

if (!error) {
// Use paymentMethod.id for the signup API call
const paymentMethodId = paymentMethod.id; // e.g., "pm_1234567890"
}

Backend - Uses Existing Payment Method

The create_subscription() endpoint I created expects the payment_method_id that was already created by your frontend. It then:

1. Attaches the payment method to the customer: app.py:32-35
2. Sets it as default for future invoices: app.py:27
3. Uses it for the subscription without re-creating it

Benefits of This Approach

- Security: Card details never touch your server
- PCI Compliance: Stripe handles all sensitive data
- User Experience: Real-time validation and formatting
- Flexibility: Payment method can be reused for future subscriptions

Alternative: Setup Intents

For even better UX with trials, you could also use Setup Intents in your frontend to authorize the payment method without charging immediately:

const {setupIntent, error} = await stripe.confirmSetup({
elements,
confirmParams: {
return_url: 'https://your-website.com/setup-complete',
},
});
// Use setupIntent.payment_method for signup

The current implementation supports both approaches since it just needs the payment_method_id.
