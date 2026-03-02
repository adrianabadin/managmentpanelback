import { GoogleServiceExtended } from './google.service.extended';
import { StructuredDocumentRequest } from './google.interfaces';

async function simpleTest() {
  console.log('🧪 Prueba simple de GoogleServiceExtended...\n');

  try {
    const googleService = new GoogleServiceExtended();

    const simpleRequest: StructuredDocumentRequest = {
      title: 'Prueba Simple - Solo Texto',
      users: ['test@example.com'],
      content: {
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: 'Test User',
          department: 'Test Department'
        },
        statistics: {
          total: 0,
          completed: 0,
          inProgress: 0,
          pending: 0
        },
        demographies: [
          {
            name: 'Test Demography',
            hasItems: true,
            items: [],
            images: { semester1Id: '1ABcExampleID1', semester2Id: '1ABcExampleID2' }
          }
        ]
      }
    };

    console.log('\n🚀 Ejecutando prueba simple...\n');
    const result = await googleService.createStructuredDocumentWithTablesAndPrivateImages(simpleRequest);

    if (typeof result === 'string') {
      console.log('\n✅ SUCCESSO - Documento creado!');
      console.log('📄 ID del documento:', result);
      console.log('🔗 URL del documento:', `https://docs.google.com/document/d/${result}/edit`);
    } else {
      console.log('\n❌ ERROR - No se pudo crear el documento:');
      console.log(result);
    }

  } catch (error) {
    console.error('\n💥 Error durante la prueba:', error);
    throw error;
  }
}

simpleTest()
  .then(() => {
    console.log('\n✨ Prueba completada!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Prueba fallida:', error);
    process.exit(1);
  });
