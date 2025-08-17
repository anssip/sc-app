#!/bin/bash

# Set permissions for Cloud Function to be publicly accessible
echo "Setting Cloud Function permissions..."

# Make the function publicly accessible
gcloud functions add-iam-policy-binding remix \
  --region=us-central1 \
  --member="allUsers" \
  --role="roles/cloudfunctions.invoker" \
  --project=spotcanvas-prod

echo "Permissions set successfully!"
echo "The function should now be publicly accessible."