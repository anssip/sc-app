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

# Account Menu

Add an AccountMenu component which allows for people to sign in and out, and for people who have not yet signed up it should show the sign up optios.

For people who have not yet signed up:

- At the top level, when not yet signed in, it should show an account icon (from lucide-react) and a label "Account"
- Clicking it opens up a menu with the singup options: Continue with google, Sign in, Create Account (like the options currently in the home page)

When logged in:

- Show the user's email address at top level together with the account icon
- Menu options: Chart Dashboard, Sign out

# Subscriptions via Stripe

Let's complete the payment-method route and commponents. We need to ask people for the payment info and have them signing up to the Pro plan trial. See docs/PRICING_PLANS.md to see how the pricing plans are defined and how the onboarding to plans works.

We should handle the trial period and subscription status in Stripe. There are two subscription products already created in Stripe sandbox: `Starter` and `Pro`. You can look this up using your MCP server.

Use Setup Intents in your frontend to authorize the payment method without charging immediately. Use Setup Intents to sign up people for the trials.

Let's create a new context and a hook for managing the user's subscription status. We can then use this in the AccountMenu and in the charts view to check the subscription status and act accordingly.

The chart should show a notification if the user is not subscribed and offer options to subscribe - we can complete this functionality later and fill in the details.

# Fonts

Change it to use the following fonts.

1.  CSS variables

    --font-primary: "Plus Jakarta Sans", serif;
    --font-secondary:
    "Lexend", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;

2.  font links to index.html

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
        <link
            href="https://fonts.googleapis.com/css2?family=Lexend:wght@100..900&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&display=swap"
            rel="stylesheet"
        />

# Home page

Make the home page look like this: https://www.spotcanvas.com/

- The top of the page should look exactly like the website.
- The image for the hero section is in public/hero-home.webp
- Use the same typography as in the website.
- Use the same copy as in the website.
- Don't include the chart component (below the hero section) in the home page
- Include the FAQ using accordion components
- Include the Features section using components
- Don't include the get in touch section
- Include the footer with contact information and navigation links

# Chart page look and feel

Change the chart dashboard look like in this attached screenshot:

- The page should be mostly black but still usable.
- The header section should not waste as much screen estate as it does currently: Combine the two horizontal bars into one and fit the controls into one area. Remove the Chart Dashboard label, and "Repository Online" should be replaced with one indicator light. Layout selector button should look more slick like in the screenshot.

# Symbol Manager

Let's add a Symbol Manager modal dialog, which allows the user to add symbols to their portfolio. It should list all the symbols from Firestore (not just the active ones which are currently shown in the symbol selector menu), and allow for the user to filter them by name or symbol. The Symbol Manager should like in the second image attached.. The addes symbols should be saved in Firestore and displayed in the symbol selector menu.

- Let's store starred symbols in Firestore for each user in the following path: /settings/{userEmail}/symbols You can use your Firebase MCP to see the Firestore schema.
- Change the symbol selector menu to only show starred symbols
- Add a Manage Symbols menu item in the settings menu (see the image)
- Make the menu look like in this image
- There should be a max height in the menu section that shows the favorited symbols plus a scroll bar if necessary. This way the "Manage Symbols" item should always be visible at the bottom of the menu.

# Trend line editing

Add a line settings toolbar like in this screenshot that is shown when a line in any of the charts. The toolbar should be a floating one that is overlaid on top of the chart area just below the chart toolbar.

You can find an example implementation of this component in GitHub and you should be able to read it with your Github MCP: https://github.com/Spot-Canvas/flaming-pricing-upgrade/blob/main/src/components/chart/ChartLineToolbar.tsx

All the tools in the toolbar buttons have a popup menu that oppens. Add these as well similarily to how the example component does.

You need to adapt the example implementation to fit with the architecture of this app.

The toolbar actions should change the line using the chart API which is documented in docs/CHART_API_REFERENCE.md in section "Trend Line Control"

# Features page

I am preparing a features page to the website of the app. For this purpose, there are three screenshot images in public/screenshots directory.

Can you prepare a markdown file that highlights the key features of the app. It should include the followin g keyfeatures:

- Multi-chart layout management
- Symbol management
- Trend lines
- Indicators
- Any other features worth mentioning

Consider the files in the docs folder when prepareing this. Make the descriptions in the markdown file concise and easy to understand.

# Add the features page

Add a features page to the app. There is an example implementation of this page in GitHub and you should be able to read it with your Github MCP: https://github.com/Spot-Canvas/flaming-pricing-upgrade/blob/main/src/pages/Features.tsx

The example page is live at: https://flaming-pricing-upgrade.lovable.app/features

Use the Navigation component also in this page.

# Plan limits

Let implement plan specific limitations to the functionality of the app. These are the following:

- When the subcription is in trial mode, for both the Starter and Pro plans, the user has access to all features.
- When the subscription is active (trial expired), the Starter plan has the following limitations: Only two saved layouts can be created, and only two indicators per chart can be added.
- The existing logic applies when there is no active subscription and no trial in progress: It prompts to subscribe to a plan.

# MCP Server

Create an MCP server implemented as a Cloud function hosted in Google Cloud and called by this Firebase app.

There will be an AI chat in the user interface that can be used to interact with the chart. See LLM_ARCHITECTURE.md for details.

The MCP server should expose all the methods that the chart API has as tools. See CHART_API_REFERENCE.md for details.

The MCP also needs a tool for accessing price data from Firestore. To implement this, the server can read data directly from Firestore. See PRICE_INFO_FIRESTORE.md for details.

On the backend, you:

- Use OpenAI’s Assistants API with MCP tool support.
- Register your chart tools (get_candles, set_symbol, etc.).
- Stream responses and tool calls back to the React client.

Here is an example partial implementation:

```javascript
import express from "express";
import { OpenAI } from "openai";
import { Server } from "socket.io";

const app = express();
app.use(express.json());
const io = new Server(3001); // socket.io server for chart updates

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  // Send to OpenAI with MCP tool definitions
  const response = await openai.chat.completions.create({
    model: "gpt-4.1", // or gpt-5 when available
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: "get_candles",
          description: "Fetch OHLC candles",
          parameters: {
            type: "object",
            properties: {
              symbol: { type: "string" },
              timeframe: { type: "string" },
              limit: { type: "number" },
            },
          },
        },
      },
      {
        type: "function",
        function: {
          name: "set_symbol",
          description: "Change chart symbol",
          parameters: {
            type: "object",
            properties: { symbol: { type: "string" } },
          },
        },
      },
    ],
  });

  // If the LLM called a tool
  const choice = response.choices[0].message;
  if (choice.tool_calls) {
    for (const tool of choice.tool_calls) {
      if (tool.function.name === "set_symbol") {
        io.emit("set_symbol", tool.function.arguments); // broadcast to chart
      }
    }
  }

  res.json({ reply: choice.content });
});

app.listen(3000, () =>
  console.log("API server running on http://localhost:3000")
);
```

# chat enhancements

I think it would make sense if the AI Assistant chat client would send some context to the mcpServer. This context can be retrieved from the chart API: the visible time range, the visible price range. This makes it possible for the server to issue commands to draw trend lines, for zooming and panning the chart. What else would be necessary to make it possible to do following prompt:

"Draw a trend line that goes through three high price points, essentially this would represent a resistance level."

The MCP server should somehow know that it can fetch the price history data by fetching it from Firestore. Is it now equipped with a tool that fetches data from Firestore? See docs/PRICE_INFO_FIRESTORE.md

# trend line enhancements

It's now possible to have names and descriptions for trend lines. See docs/CHART_API_REFERENCE.md for more information.

Make this app save these properties also to Firestore, if not already done.

Then enhance the mcpServer to send these properties when the tool generates trend lines. It should make the name be of format "<confidence> <support or resistance>", for example "hight confidence support". The description should come from the explanation field that we get from OpenAI.

# Example prompts

Initially, when the chat UI is empty, show some example prompts as boxes in the chart UI. Clicking on these boxes should send the prompt to the chat UI.

Basic:

- Enable the RSI indicator.
- Enable the Moving Average indicator.
- Enable the Volume indicator.
- Switch to one day granularity.
- Switch to ETH-USD symbol.

Advanced:

- Draw lines for support and resistance levels to this chart.

# Example prompts

Initially, when the chat UI is empty, show some example prompts as boxes in the chart UI. Clicking on these boxes should send the prompt to the chat UI.

Basic:

- Enable the RSI indicator.
- Enable the Moving Average indicator.
- Enable the Volume indicator.
- Switch to one day granularity.
- Switch to ETH-USD symbol.

Advanced:

- Draw lines for support and resistance levels to this chart.

# Levels using API

There is an endpoint in the market API that returns support and resistance levels for a given symbol and time range. This endpoint can be used to fetch the support and resistance levels and draw them on the chart.

Lets create a second tool for the AI assistant which fetches the support and resistance levels using the market API endpoint.

The current levels tool can be left in place too, but by default it should use the endpoint based tool when the user asks for trend lines. If he explicitly asks for AI detected lines, then it should use the old tool.

The endpoint is described in docs/MARKET_API_README.md

# Fix chat to show bold properly

Fix the AI Assistant chat to show bold text properly. It now shows like so: **bolded text** - don't show the asterix characters here but show the enclosed text as bold. Handle italic text similarily.

# AI Assistant for multi-chart

There can be several charts open in the PanelGroup and we need to make the AI Assistant to be aware of this. The AI Assistant should be able to detect which chart is currently active and use that chart's data as `chartContext` that
it sends to the chat backend. Also when the chart tools in openai-service.ts are sending commands to the chart these
need to be routed to the active chart.

Let's make it possible to activate a chart by clicking on the empty area next to the ChartHeader. The active chart should have a slightly different color in the ChartHeader area.

Additionally, the inactive charts should not have the ChartToolbar visible and the ChartHeader can be less tall.

# Saved threads in the chat

Make the AI assistant load the chat history from Firestore. It's already stored there in the chat_history collection. It should load the previous chat session thread from there when the page loads.

It should always show the chat history of the chart that is currently active. When changing the active chart, the AI assistant should load the chat history for the new active chart.

Also add chat the ability to start new chat threads using a button. Add a button for this to the top of the chat view.

We also need the ability to restore previous chat threads - add a dropdown that shows the previous 5 chats in a list. Use similar design for the dropdown as with the symbol selector and with the time granularity selector dropdown. As the last item in this dropdown list there should be a "Show all..." item that opens a dialog that can be used to restore any chat from the complete history the user has in Firestore. The modal should be styled similarily as the LayoutSelectorModal.

# Trading advice general questions

If the user asks a generic trading advice like so:

- How can i trade this chart?
- How can i trade this price action?
- etc.

It should propse the user to add support/resistance levels to the chart if the chart does not already have them.

# Use indicators extra info in trend lines

There is now a new field `indicators` in the data that the /levels endpoint in the market API returns. Store this in Firestore for each trendline and also supply this info to the user in the chat responses. This makes it possible to use the data when giving trading advice to the user, when he asks for some in later chat messages.

The "get_support_resistance_levels" should also make the chart show the indicators that are found in the levels data, if those are not currently showing. The currently showing indicators are passed to the chat backend in the chartContext.

# Levels visualization

Enhance the support/resistance levels line drawing according to docs/FRONTEND_VISUAL_GUIDE.md which describes how
  the levels returned by market API /levels endpoing should be visualized. This app has a AI Assistance that has a
  tool that uses the /levels endpoint and then draws lines to the chart based on the returned data.

# AI Usage tokens

Store the OpenAI API tokens consumed using the AI Assistant in Firestore. Save usage records in Firestore as a subcollection in path `subscriptions/<subscription_id>/usage/<chat-session-id>`. Initially the usage records should be in status "pending". There can be one record that accumulates the usage of one chat session. We can initiate the usage saving from backend module openai-service.ts but let's encaplusate the logic to a new usage-service.ts backend module.

Once there are enough pending usage records whose total quantity exceeds one million (1 000 000) we should record the usage to the billing API using it's endpoint - see docs/API_DOCS.md and section "Record Usage" for details. The quantity to be sent to this endpoint should be the accumulated pending quantity in total divided by 1000. Once successfully recorded with the billing API, update the pending records in Firestore to status "recorded".
