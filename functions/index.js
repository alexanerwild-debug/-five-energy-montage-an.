const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

initializeApp();

exports.createMonteur = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Nicht angemeldet.");
  }

  const db = getFirestore();
  const projectId = request.data.projectId || "jugendamt";

  const adminDoc = await db
    .collection("projects")
    .doc(projectId)
    .collection("admins")
    .doc(request.auth.uid)
    .get();

  if (!adminDoc.exists) {
    throw new HttpsError(
      "permission-denied",
      "Nur Administratoren dürfen Monteure anlegen."
    );
  }

  const email = String(request.data.email || "").trim().toLowerCase();
  const password = String(request.data.password || "");
  const name = String(request.data.name || "").trim();

  if (!email || !password || !name) {
    throw new HttpsError(
      "invalid-argument",
      "Name, E-Mail und Passwort sind erforderlich."
    );
  }

  const user = await getAuth().createUser({
    email,
    password,
    displayName: name
  });

  await db
    .collection("projects")
    .doc(projectId)
    .collection("monteurs")
    .doc(user.uid)
    .set({
      uid: user.uid,
      name,
      email,
      role: "monteur",
      createdBy: request.auth.uid,
      createdAt: new Date()
    });

  return {
    uid: user.uid,
    name,
    email
  };
});
