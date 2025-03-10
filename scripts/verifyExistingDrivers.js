// Script pour marquer automatiquement tous les conducteurs existants comme vérifiés
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, setDoc } = require('firebase/firestore');

// Configuration Firebase (à remplacer par vos propres valeurs)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function verifyExistingDrivers() {
  try {
    console.log('Début de la vérification des conducteurs existants...');
    
    // Récupérer tous les utilisateurs qui sont conducteurs
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('isDriver', '==', true));
    const querySnapshot = await getDocs(q);
    
    console.log(`Nombre de conducteurs trouvés: ${querySnapshot.size}`);
    
    // Pour chaque conducteur, créer ou mettre à jour son document de vérification
    let count = 0;
    for (const userDoc of querySnapshot.docs) {
      const userId = userDoc.id;
      
      // Créer un document de vérification pour ce conducteur
      await setDoc(doc(db, 'driverVerifications', userId), {
        isVerified: true,
        verifiedAt: new Date(),
        verificationMethod: 'automatic_migration',
      });
      
      count++;
      console.log(`Conducteur vérifié: ${userId} (${count}/${querySnapshot.size})`);
    }
    
    console.log(`Vérification terminée. ${count} conducteurs ont été marqués comme vérifiés.`);
  } catch (error) {
    console.error('Erreur lors de la vérification des conducteurs:', error);
  }
}

// Exécuter le script
verifyExistingDrivers()
  .then(() => {
    console.log('Script terminé avec succès.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Erreur lors de l\'exécution du script:', error);
    process.exit(1);
  }); 