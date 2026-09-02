import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Carrega as configurações do banco atual
const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const rawConfig = fs.readFileSync(configPath, 'utf-8');
const firebaseConfigData = JSON.parse(rawConfig);

console.log('🔄 Conectando ao Firestore atual:', firebaseConfigData.projectId, firebaseConfigData.firestoreDatabaseId || '(default)');

const app = initializeApp({
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  projectId: firebaseConfigData.projectId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
  appId: firebaseConfigData.appId,
});

const db = firebaseConfigData.firestoreDatabaseId
  ? initializeFirestore(app, { ignoreUndefinedProperties: true }, firebaseConfigData.firestoreDatabaseId)
  : initializeFirestore(app, { ignoreUndefinedProperties: true });

const COLLECTIONS_TO_EXPORT = [
  'products',
  'gigs',
  'shifts',
  'staff_members',
  'bills',
  'transactions',
  'activities',
  'app_settings',
];

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchCollectionWithRetry(colName: string, maxRetries = 6): Promise<any[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`📥 Exportando coleção: ${colName} (tentativa ${attempt}/${maxRetries})...`);
      const colRef = collection(db, colName);
      const snapshot = await getDocs(colRef);
      const docs: any[] = [];

      snapshot.forEach((docSnap) => {
        docs.push({
          id: docSnap.id,
          ...docSnap.data(),
        });
      });

      console.log(`✅ Coleção ${colName}: ${docs.length} documentos exportados com sucesso.`);
      return docs;
    } catch (err: any) {
      console.warn(`⚠️ Tentativa ${attempt} falhou para ${colName}: ${err?.message || err}`);
      if (attempt < maxRetries) {
        await sleep(1500 * attempt);
      } else {
        throw err;
      }
    }
  }
  return [];
}

async function exportAllCollections() {
  const backup: Record<string, any> = {
    exportedAt: new Date().toISOString(),
    sourceProjectId: firebaseConfigData.projectId,
    sourceDatabaseId: firebaseConfigData.firestoreDatabaseId || '(default)',
  };

  const summary: Record<string, number> = {};

  for (const colName of COLLECTIONS_TO_EXPORT) {
    try {
      const docs = await fetchCollectionWithRetry(colName);
      backup[colName] = docs;
      summary[colName] = docs.length;
    } catch (err) {
      console.error(`❌ Não foi possível exportar ${colName} após tentativas:`, err);
      backup[colName] = [];
      summary[colName] = 0;
    }
  }

  const outputPath = path.resolve(process.cwd(), 'backup_data.json');
  fs.writeFileSync(outputPath, JSON.stringify(backup, null, 2), 'utf-8');
  console.log(`\n🎉 Backup concluído com sucesso e salvo em: ${outputPath}`);
  console.log('📊 Resumo do Backup:', summary);
  process.exit(0);
}

exportAllCollections().catch((err) => {
  console.error('Erro fatal no backup:', err);
  process.exit(1);
});

