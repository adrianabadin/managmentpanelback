/**
 * Script para copiar la base de datos rsx a rsx_test
 * Uso: node scripts/copy-db.js
 */

const { MongoClient } = require('mongodb');

const SOURCE_URI = 'mongodb://graveddiger:2947DarthRevan@thecodersteam.com:27017/rsx?replicaSet=rs1&authSource=admin&directConnection=true';
const TARGET_URI = 'mongodb://graveddiger:2947DarthRevan@thecodersteam.com:27017/rsx_test?replicaSet=rs1&authSource=admin&directConnection=true';

async function copyDatabase() {
  let sourceClient;
  let targetClient;

  try {
    console.log('🔌 Conectando a la base de datos de origen (rsx)...');
    sourceClient = await MongoClient.connect(SOURCE_URI);
    const sourceDb = sourceClient.db('rsx');

    console.log('🔌 Conectando a la base de datos de destino (rsx_test)...');
    targetClient = await MongoClient.connect(TARGET_URI);
    const targetDb = targetClient.db('rsx_test');

    // Obtener todas las colecciones de la base de datos de origen
    console.log('\n📋 Obteniendo lista de colecciones...');
    const collections = await sourceDb.listCollections().toArray();
    const collectionNames = collections
      .map(c => c.name)
      .filter(name => !name.startsWith('system.')); // Ignorar colecciones del sistema

    console.log(`   Encontradas ${collectionNames.length} colecciones: ${collectionNames.join(', ')}\n`);

    // Copiar cada colección
    for (const collectionName of collectionNames) {
      console.log(`📦 Copiando colección: ${collectionName}`);

      const sourceCollection = sourceDb.collection(collectionName);
      const targetCollection = targetDb.collection(collectionName);

      // Contar documentos en origen
      const count = await sourceCollection.countDocuments();
      console.log(`   - Documentos en origen: ${count}`);

      if (count === 0) {
        console.log(`   - ⏭️  Colección vacía, saltando...`);
        continue;
      }

      // Limpiar colección de destino primero
      const existingCount = await targetCollection.countDocuments();
      if (existingCount > 0) {
        console.log(`   - 🧹 Limpiando ${existingCount} documentos existentes en destino...`);
        await targetCollection.deleteMany({});
      }

      // Copiar todos los documentos
      const documents = await sourceCollection.find({}).toArray();
      if (documents.length > 0) {
        await targetCollection.insertMany(documents, { ordered: false });
        console.log(`   - ✅ Copiados ${documents.length} documentos`);
      }

      // Copiar índices
      const indexes = await sourceCollection.indexes();
      const customIndexes = indexes.filter(idx => idx.name !== '_id_');

      if (customIndexes.length > 0) {
        console.log(`   - 🔍 Copiando ${customIndexes.length} índices...`);
        for (const index of customIndexes) {
          try {
            const indexSpec = { ...index };
            delete indexSpec.v;
            delete indexSpec.ns;
            const keys = indexSpec.key;
            delete indexSpec.key;
            delete indexSpec.name;

            await targetCollection.createIndex(keys, indexSpec);
          } catch (err) {
            // Índice ya existe o error menor, continuar
            console.log(`     ⚠️  Advertencia al copiar índice: ${err.message}`);
          }
        }
      }

      console.log(`   - ✅ Colección ${collectionName} completada\n`);
    }

    console.log('🎉 ¡Copia de base de datos completada exitosamente!');
    console.log(`\n📊 Resumen:`);
    console.log(`   - Base de datos origen: rsx`);
    console.log(`   - Base de datos destino: rsx_test`);
    console.log(`   - Colecciones copiadas: ${collectionNames.length}`);

  } catch (error) {
    console.error('\n❌ Error durante la copia:', error);
    process.exit(1);
  } finally {
    if (sourceClient) {
      await sourceClient.close();
      console.log('\n🔌 Desconectado de la base de datos de origen');
    }
    if (targetClient) {
      await targetClient.close();
      console.log('🔌 Desconectado de la base de datos de destino');
    }
  }
}

// Ejecutar la copia
copyDatabase();
