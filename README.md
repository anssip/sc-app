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

## Environment Configuration

### Twitter API Configuration

The app uses Twitter OAuth 1.0a for authentication. Credentials are configured differently for development and production:

#### Development
Environment variables are loaded from `.env`:
- `TWITTER_API_KEY` - Your Twitter API key
- `TWITTER_API_SECRET` - Your Twitter API secret
- `TWITTER_CALLBACK_URL` - OAuth callback URL (e.g., `http://localhost:5173/api/twitter-callback`)

#### Production
Credentials are stored as Firebase Secrets for security:
```bash
# Set secrets (already configured):
firebase functions:secrets:set TWITTER_API_KEY
firebase functions:secrets:set TWITTER_API_SECRET
firebase functions:secrets:set TWITTER_CALLBACK_URL
```

The production callback URL should be: `https://spotcanvas-prod.web.app/api/twitter-callback`

These secrets are automatically injected into the Cloud Functions environment at runtime via the `secrets` array in `functions/index.js`.
