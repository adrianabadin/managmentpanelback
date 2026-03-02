import { PrismaClient } from '@prisma/client';
import { GoogleServiceExtended } from './google.service.extended';
import { StructuredDocumentRequest } from './google.interfaces';

// Inicializar Prisma
const prisma = new PrismaClient();

// IDs de imágenes de prueba en Google Drive (reemplazar con IDs reales)
const SAMPLE_DRIVE_IMAGES = [
  { semester1Id: '1ABcExampleID1', semester2Id: '1ABcExampleID2' },
  { semester1Id: '1ABcExampleID3', semester2Id: '1ABcExampleID4' },
];

async function getTestDataFromDB() {
  console.log('🗄️ Buscando datos existentes en la base de datos...');

  // 1. Obtener Users
  const testUsers = await prisma.users.findMany({
    where: { isActive: true },
    take: 1
  });

  if (testUsers.length === 0) {
    throw new Error('No hay usuarios activos en la base de datos');
  }

  const testUser = testUsers[0];
  console.log('✅ Usuario encontrado:', testUser.name);

  // 2. Obtener Departments
  const testDepartments = await prisma.departments.findMany({
    take: 1
  });

  if (testDepartments.length === 0) {
    throw new Error('No hay departamentos activos en la base de datos');
  }

  const testDepartment = testDepartments[0];
  console.log('✅ Departamento encontrado:', testDepartment.name);

  // 3. Obtener Demographies
  const testDemographies = await prisma.demography.findMany({
    take: 2
  });

  if (testDemographies.length === 0) {
    throw new Error('No hay demografías activas en la base de datos');
  }

  console.log(`✅ Demografías encontradas: ${testDemographies.length}`);

  // 4. Obtener Gantt Items
  const ganttItems = await prisma.ganttItem.findMany({
    where: {
      isActive: true,
      departmentsId: testDepartment.id
    },
    take: 10
  });

  console.log(`✅ GanttItems encontrados: ${ganttItems.length}`);

  return {
    user: testUser,
    department: testDepartment,
    demographies: testDemographies,
    ganttItems
  };
}

async function createGoogleDocsRequest(testData: any) {
  console.log('\n📝 Preparando solicitud para Google Docs...');

  // Calcular estadísticas generales
  const total = testData.ganttItems.length;
  const completed = testData.ganttItems.filter((i: any) => i.status === 'completed').length;
  const inProgress = testData.ganttItems.filter((i: any) => i.status === 'active').length;
  const pending = testData.ganttItems.filter((i: any) => ['planning', 'onhold'].includes(i.status)).length;

  const request: StructuredDocumentRequest = {
    title: `Reporte de Planificación 2026 - Test`,
    users: [testData.user.username, 'aabadin@gmail.com'],
    content: {
      metadata: {
        generatedAt: new Date().toISOString(),
        generatedBy: testData.user.name + ' ' + testData.user.lastname,
        department: testData.department.name
      },
      statistics: {
        total,
        completed,
        inProgress,
        pending
      },
      demographies: testData.demographies.map((demography: any) => ({
        name: demography.state,
        hasItems: true,
        items: testData.ganttItems.map((item: any) => ({
          title: item.title,
          startDate: item.startDate.toISOString().split('T')[0],
          endDate: item.endDate.toISOString().split('T')[0],
          progress: item.progress,
          assignedTo: testData.user.name + ' ' + testData.user.lastname,
          priority: (item.priority as any) || 'medium',
          type: (item.type as any) || 'task'
        })),
        images: SAMPLE_DRIVE_IMAGES[Math.floor(Math.random() * SAMPLE_DRIVE_IMAGES.length)]
      }))
    }
  };

  console.log('\n📊 Estructura de la solicitud:');
  console.log('- Título:', request.title);
  console.log('- Usuario:', request.users[0]);
  console.log('- Demographies:', request.content.demographies.length);
  console.log('- Items por demography:', request.content.demographies[0].items.length);
  console.log('- Estadísticas:', request.content.statistics);

  return request;
}

async function testNewGoogleService() {
  console.log('\n🧪 Iniciando prueba de GoogleServiceExtended...\n');

  try {
    // 1. Obtener datos de prueba de la base de datos
    const testData = await getTestDataFromDB();

    // 2. Preparar solicitud para Google Docs
    const docsRequest = await createGoogleDocsRequest(testData);

    // 3. Crear instancia del servicio extendido
    const googleService = new GoogleServiceExtended();

    // 4. Ejecutar el nuevo método con imágenes privadas
    console.log('\n🚀 Ejecutando createStructuredDocumentWithTablesAndPrivateImages...\n');
    const result = await googleService.createStructuredDocumentWithTablesAndPrivateImages(docsRequest);

    if (typeof result === 'string') {
      console.log('\n✅ SUCCESSO - Documento creado!');
      console.log('📄 ID del documento:', result);
      console.log('🔗 URL del documento:', `https://docs.google.com/document/d/${result}/edit`);
    } else {
      console.log('\n❌ ERROR - No se pudo crear el documento:');
      console.log(result);
    }

    return result;

  } catch (error) {
    console.error('\n💥 Error durante la prueba:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar la prueba
if (require.main === module) {
  testNewGoogleService()
    .then(() => {
      console.log('\n✨ Prueba completada exitosamente!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Prueba fallida:', error);
      process.exit(1);
    });
}

export { testNewGoogleService };
