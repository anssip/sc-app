# Spot Canvas App

This is a Remix application that is used to manage and show financial charts using the sc-charts module.

All charting functionality is provided by the sc-charts module. This app interfaces with sc-charts module via it's API.

## Main Features

- **Chart Management**: Easily create, edit, and delete charts.
- **Chart Layout**: Arrange charts in various layouts for optimal viewing.
- **Drawing tools**: Offers toolbars for drawing on charts. The toolbars themselves are components from the sc-charts module.
- **User Management**: Sign up, log in, and manage the user account.
- **Subscription Management**: Manage subscriptions for users.

## Backlog

TODO next:

- [ ] Refactor trend lines stuff out of ChartContainer

The initial features;

1. Show a chart inside the application
2. Split the view to show 2 charts side by side
3. Split one view to show charts on top of each other
4. Sign up & login
5. Add a feature to allow users to save their chart layouts (should be autosave)

## The charts module

The chart module is available in npmjs.com as @anssip/rs-charts
