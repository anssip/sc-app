
firestore-rules:
	firebase deploy --only firestore:rules --project spotcanvas-prod

firestore-indexes:
	firebase deploy --only firestore:indexes --project spotcanvas-prod
