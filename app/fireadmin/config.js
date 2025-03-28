import * as firebaseAdmin from "firebase-admin"
const serviceAccountKey = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
}
// const serviceAccountKey = {
//   "type": process.env.FIREBASE_TYPE,
//   "project_id": process.env.FIREBASE_PROJECT_ID,
//   "private_key_id": process.env.FIREBASE_PRIVATE_KEY_ID,
//   "private_key": process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
//   "client_email": process.env.FIREBASE_CLIENT_EMAIL,
//   "client_id": process.env.FIREBASE_CLIENT_ID,
//   "auth_uri": process.env.FIREBASE_AUTH_URI,
//   "token_uri": process.env.FIREBASE_TOKEN_URI,
//   "auth_provider_x509_cert_url": process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
//   "client_x509_cert_url": process.env.FIREBASE_CLIENT_X509_CERT_URL
// };


if (!firebaseAdmin.apps.length) {
  firebaseAdmin.initializeApp({
    credential: firebaseAdmin.credential.cert(serviceAccountKey),
  });
}

const db = firebaseAdmin.firestore();
const auth = firebaseAdmin.auth();
const admin = firebaseAdmin;

export { db, auth, admin };
