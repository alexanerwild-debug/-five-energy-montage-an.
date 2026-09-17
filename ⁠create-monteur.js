// Monteur-Erstellung ohne Cloud Function
window.createMonteurDirect = async function(email, password, name, projectId) {
  try {
    // 1. Sekundäre Firebase-App temporär initialisieren
    const mainApp = firebase.app();
    const config = mainApp.options;
    const tempAppName = "TempApp_" + Date.now();
    const tempApp = firebase.initializeApp(config, tempAppName);
    const tempAuth = tempApp.auth();

    // 2. Monteur-Benutzerkonto anlegen
    const userCredential = await tempAuth.createUserWithEmailAndPassword(email, password);
    const newMonteur = userCredential.user;

    // Display-Namen setzen
    if (name) {
      await newMonteur.updateProfile({ displayName: name });
    }

    // 3. Temporäre App sofort wieder trennen
    await tempApp.delete();

    // 4. Firestore-Dokument mit der Admin-Sitzung schreiben
    const db = firebase.firestore();
    const currentAdminUid = firebase.auth().currentUser ? firebase.auth().currentUser.uid : null;

    await db.collection("projects").doc(projectId).collection("monteurs").doc(newMonteur.uid).set({
      uid: newMonteur.uid,
      name: name || "",
      email: email,
      role: "monteur",
      createdBy: currentAdminUid,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      uid: newMonteur.uid,
      message: "Monteur erfolgreich angelegt!"
    };
  } catch (error) {
    console.error("Fehler beim Erstellen des Monteurs:", error);
    throw error;
  }
};
