import { initializeApp } from 'firebase/app';
import { initializeFirestore, doc, writeBatch } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

const firebaseConfig = {
  apiKey: "AIzaSyB4CPbEz5Ppt5ooP7XMx5GC7V-M-2ts-7Y",
  authDomain: "bardatenda-gestao.firebaseapp.com",
  projectId: "bardatenda-gestao",
  storageBucket: "bardatenda-gestao.firebasestorage.app",
  messagingSenderId: "143249175796",
  appId: "1:143249175796:web:915766d19ab0d40da85aa1"
};

console.log('🚀 Conectando ao NOVO Firebase Firestore:', firebaseConfig.projectId);

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

function sanitizeDocData(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue; // ID é usado como identificador do doc
    if (value === undefined) continue;
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      result[key] = sanitizeDocData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

async function importBackupToNewFirestore() {
  const backupPath = path.resolve(process.cwd(), 'backup_data.json');

  if (!fs.existsSync(backupPath)) {
    console.error(`❌ Arquivo de backup não encontrado em: ${backupPath}`);
    process.exit(1);
  }

  console.log(`📖 Lendo dados do arquivo: ${backupPath}...`);
  const rawData = fs.readFileSync(backupPath, 'utf-8');
  const backup = JSON.parse(rawData);

  const collectionsToImport = [
    'products',
    'gigs',
    'shifts',
    'staff_members',
    'bills',
    'transactions',
    'activities',
    'app_settings',
  ];

  const totalImported: Record<string, number> = {};

  for (const colName of collectionsToImport) {
    const items = backup[colName] || [];
    console.log(`\n📦 Importando coleção: ${colName} (${items.length} itens)...`);

    if (items.length === 0) {
      console.log(`ℹ️ Nenhum item para importar em ${colName}.`);
      totalImported[colName] = 0;
      continue;
    }

    // Dividir em lotes de 450 (Firestore permite até 500 por lote)
    const BATCH_SIZE = 450;
    let count = 0;

    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const batch = writeBatch(db);
      const chunk = items.slice(i, i + BATCH_SIZE);

      for (const item of chunk) {
        const docId = item.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const docRef = doc(db, colName, docId);
        const cleanData = sanitizeDocData(item);
        batch.set(docRef, cleanData, { merge: true });
        count++;
      }

      await batch.commit();
      console.log(`  ↪ Lote salvo: ${count}/${items.length} documentos em ${colName}`);
    }

    totalImported[colName] = count;
    console.log(`✅ Coleção ${colName} importada com sucesso! (${count} documentos)`);
  }

  console.log('\n=============================================');
  console.log('🎉 POPULAÇÃO DO NOVO BANCO CONCLUÍDA COM SUCESSO!');
  console.log('=============================================');
  console.log('Projeto Destino:', firebaseConfig.projectId);
  console.log('Resumo dos dados importados:');
  console.table(totalImported);
  process.exit(0);
}

importBackupToNewFirestore().catch((err) => {
  console.error('❌ Erro fatal ao importar backup no novo Firebase:', err);
  process.exit(1);
});
