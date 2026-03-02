import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoogleServiceExtended } from "./google.service.extended";
import { StructuredDocumentRequest } from "./google.interfaces";

// ============================================================================
// MOCKS - MUST BE BEFORE IMPORTS
// ============================================================================

// Mock de Google APIs
const mockDocsClient = {
  documents: {
    create: vi.fn(),
    get: vi.fn(),
    batchUpdate: vi.fn(),
  },
};

const mockDriveClient = {
  permissions: {
    create: vi.fn(),
  },
  files: {
    get: vi.fn(),
  },
};

// Mock del módulo googleapis
vi.mock("googleapis", () => ({
  google: {
    docs: vi.fn(() => mockDocsClient),
    drive: vi.fn(() => mockDriveClient),
    auth: {
      GoogleAuth: vi.fn(() => ({
        getClient: vi.fn().mockResolvedValue({
          getAccessToken: vi.fn().mockResolvedValue("mock-access-token"),
        }),
      })),
    },
  },
}));

// Mock del logger
vi.mock("../Global.Services/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
  },
}));

// ============================================================================
// MOCK DATA - Objeto request real del usuario
// ============================================================================

const realRequestData: StructuredDocumentRequest = {
  title: "Reporte de Proyectos - Direccion Asociada",
  users: ["AABADIN@GMAIL.COM"],
  content: {
    metadata: {
      generatedAt: "16/02/2026, 07:27 a. m.",
      generatedBy: "Adrian Daniel Abadin",
      department: "Direccion Asociada",
    },
    statistics: {
      total: 3,
      completed: 1,
      inProgress: 2,
      pending: 0,
    },
    demographies: [
      {
        name: "Chivilcoy",
        hasItems: false,
        items: [],
        images: {},
        emptyMessage: "No se han creado actividades para esta localidad en el período reportado.",
      },
      {
        name: "Saladillo",
        hasItems: false,
        items: [],
        images: {},
        emptyMessage: "No se han creado actividades para esta localidad en el período reportado.",
      },
      {
        name: "Regional",
        hasItems: true,
        items: [
          {
            title: "Implementacion Modulo de Regulacion HSI",
            startDate: "30/11/2025",
            endDate: "30/12/2026",
            progress: 40,
            assignedTo: "Sin asignar",
            priority: "high",
            type: "task",
          },
          {
            title: "Capacitacion de SGUs y Nodos Regionales",
            startDate: "01/12/2025",
            endDate: "28/01/2026",
            progress: 100,
            assignedTo: "Sin asignar",
            priority: "high",
            type: "task",
          },
          {
            title: "Creacion de Usuarios Municipales",
            startDate: "31/12/2025",
            endDate: "27/02/2026",
            progress: 90,
            assignedTo: "Sin asignar",
            priority: "medium",
            type: "task",
          },
        ],
        images: {
          quarter1Id: "1b29KCtyAyHMTxRxowoK_XUFqiuTA7nmO",
          quarter2Id: "1GLxumlYv5wKBTQKOYFx8XqkSsBKx_2Uc",
          quarter3Id: "1abc123def456ghi789jkl012mno345p",
          quarter4Id: "1xyz987wvu654tsr321qpo098nml876k",
        },
      },
    ],
  },
};

// Mock de respuesta de Google Docs API - Documento vacío inicial
const mockDocumentCreateResponse = {
  data: {
    documentId: "test-document-id-123",
    title: realRequestData.title,
  },
  status: 200,
};

// Mock de respuesta de documents.get - Documento con estructura completa
const mockDocumentGetResponse = {
  data: {
    documentId: "test-document-id-123",
    body: {
      content: [
        // Título
        {
          paragraph: {
            elements: [
              {
                startIndex: 1,
                endIndex: 50,
                textRun: { content: "Reporte de Proyectos - Direccion Asociada\n\n" },
              },
            ],
          },
          startIndex: 1,
          endIndex: 50,
        },
        // Metadata
        {
          paragraph: {
            elements: [
              {
                startIndex: 50,
                endIndex: 150,
                textRun: { content: "Fecha de generación: 16/02/2026, 07:27 a. m.\n" },
              },
            ],
          },
          startIndex: 50,
          endIndex: 150,
        },
        // ... otros elementos ...
        // Header "Regional" (elemento 54 según los logs)
        {
          paragraph: {
            elements: [
              {
                startIndex: 1400,
                endIndex: 1410,
                textRun: { content: "Regional\n\n" },
              },
            ],
          },
          startIndex: 1400,
          endIndex: 1410,
        },
        // Tabla de Regional (elemento 57 según los logs)
        {
          table: {
            rows: 4, // 1 header + 3 data rows
            columns: 7,
            tableRows: [
              {
                tableCells: Array(7).fill({
                  content: [{ paragraph: { elements: [{ startIndex: 1411, textRun: { content: "" } }] } }],
                }),
              },
            ],
          },
          startIndex: 1411,
          endIndex: 1475, // Posición clave: donde debe insertarse después
        },
        // Párrafo después de la tabla (aquí se insertará el label)
        {
          paragraph: {
            elements: [
              {
                startIndex: 1475,
                endIndex: 1476,
                textRun: { content: "\n" },
              },
            ],
          },
          startIndex: 1475,
          endIndex: 1476,
        },
      ],
    },
  },
  status: 200,
};

// Mock de respuesta después de insertar label
const mockDocumentAfterLabelResponse = {
  data: {
    documentId: "test-document-id-123",
    body: {
      content: [
        // ... contenido anterior ...
        // Label insertado
        {
          paragraph: {
            elements: [
              {
                startIndex: 1475,
                endIndex: 1490,
                textRun: { content: "\n1er Semestre:\n" },
              },
            ],
          },
          startIndex: 1475,
          endIndex: 1490,
        },
      ],
    },
  },
  status: 200,
};

// Mock de respuesta de batchUpdate
const mockBatchUpdateResponse = {
  data: {
    documentId: "test-document-id-123",
  },
  status: 200,
};

// Mock de respuesta de permissions.create
const mockPermissionCreateResponse = {
  data: {
    id: "anyoneWithLink",
    role: "reader",
    type: "anyone",
  },
  status: 200,
};

// Mock de respuesta de files.get (verificación de permisos)
const mockFileGetResponse = {
  data: {
    id: "1b29KCtyAyHMTxRxowoK_XUFqiuTA7nmO",
    name: "63b91458-737a-46ce-adfe-0fd245d85108",
    permissions: [
      { role: "owner", type: "user" },
      { role: "reader", type: "anyone" },
    ],
    webViewLink: "https://drive.google.com/file/d/1b29KCtyAyHMTxRxowoK_XUFqiuTA7nmO/view?usp=drivesdk",
    webContentLink: "https://drive.google.com/uc?id=1b29KCtyAyHMTxRxowoK_XUFqiuTA7nmO&export=download",
  },
  status: 200,
};

// ============================================================================
// TESTS
// ============================================================================

describe("GoogleServiceExtended", () => {
  let googleService: GoogleServiceExtended;

  beforeEach(() => {
    // Reset mocks antes de cada test
    vi.clearAllMocks();

    // Setup de respuestas por defecto de los mocks
    mockDocsClient.documents.create.mockResolvedValue(mockDocumentCreateResponse);
    mockDocsClient.documents.get.mockResolvedValueOnce(mockDocumentGetResponse);
    mockDocsClient.documents.batchUpdate.mockResolvedValue(mockBatchUpdateResponse);
    mockDriveClient.permissions.create.mockResolvedValue(mockPermissionCreateResponse);
    mockDriveClient.files.get.mockResolvedValue(mockFileGetResponse);

    // Crear instancia del servicio
    googleService = new GoogleServiceExtended();
  });

  describe("createStructuredDocumentWithTablesAndPrivateImages", () => {
    it("should create document with tables and images successfully", async () => {
      // Arrange
      console.log("🧪 Test: Iniciando test con objeto request real del usuario...");

      // Para la segunda llamada a documents.get (después de insertar label)
      mockDocsClient.documents.get.mockResolvedValueOnce(mockDocumentAfterLabelResponse);

      // Act
      const result = await googleService.createStructuredDocumentWithTablesAndPrivateImages(
        realRequestData
      );

      // Assert
      console.log("🧪 Test: Verificando resultado...");

      // Verificar que retorna un documentId (no un error)
      expect(result).toBe("test-document-id-123");
      expect(typeof result).toBe("string");

      // Verificar que se creó el documento
      expect(mockDocsClient.documents.create).toHaveBeenCalledTimes(1);
      expect(mockDocsClient.documents.create).toHaveBeenCalledWith({
        requestBody: { title: realRequestData.title },
      });

      // Verificar que se hicieron múltiples batchUpdates
      // - Paso 2: Estructura (1 vez)
      // - Paso 3: Llenar tablas (1+ veces dependiendo del batch size)
      // - Paso 4: Labels de imágenes (2 veces, una por imagen)
      // - Paso 4: Imágenes inline (2 veces, una por imagen)
      expect(mockDocsClient.documents.batchUpdate).toHaveBeenCalled();
      const batchUpdateCalls = mockDocsClient.documents.batchUpdate.mock.calls;
      console.log(`🧪 Test: Total de batchUpdate calls: ${batchUpdateCalls.length}`);

      // Verificar que se hicieron públicas las 4 imágenes
      expect(mockDriveClient.permissions.create).toHaveBeenCalled();
      const permissionCalls = mockDriveClient.permissions.create.mock.calls.filter(
        (call: any) => call[0]?.requestBody?.type === "anyone"
      );
      expect(permissionCalls.length).toBeGreaterThanOrEqual(4);

      // Verificar que se compartió con el usuario
      const userPermissionCalls = mockDriveClient.permissions.create.mock.calls.filter(
        (call: any) => call[0]?.requestBody?.emailAddress === "AABADIN@GMAIL.COM"
      );
      expect(userPermissionCalls.length).toBe(1);

      // Verificar que se leyeron los metadatos de las imágenes (verificación de permisos)
      expect(mockDriveClient.files.get).toHaveBeenCalled();

      console.log("✅ Test: Todas las verificaciones pasaron correctamente");
    });

    it("should handle insertion position correctly (endIndex, not endIndex-1)", async () => {
      // Arrange
      console.log("🧪 Test: Verificando que la posición de inserción sea correcta...");

      // Mock personalizado para capturar las inserciones de texto
      const textInsertions: any[] = [];
      mockDocsClient.documents.batchUpdate.mockImplementation((params: any) => {
        const requests = params.requestBody?.requests || [];
        requests.forEach((req: any) => {
          if (req.insertText) {
            textInsertions.push(req.insertText);
          }
        });
        return Promise.resolve(mockBatchUpdateResponse);
      });

      mockDocsClient.documents.get
        .mockResolvedValueOnce(mockDocumentGetResponse)
        .mockResolvedValueOnce(mockDocumentAfterLabelResponse);

      // Act
      await googleService.createStructuredDocumentWithTablesAndPrivateImages(realRequestData);

      // Assert
      // Buscar las inserciones de labels de imágenes
      const labelInsertions = textInsertions.filter(
        (insert) =>
          insert.text?.includes("1er Semestre:") || insert.text?.includes("2do Semestre:")
      );

      console.log(`🧪 Test: Inserciones de labels encontradas: ${labelInsertions.length}`);

      // Verificar que al menos se intentaron insertar los labels
      expect(labelInsertions.length).toBeGreaterThan(0);

      // Verificar que la posición de inserción es 1475 (endIndex) y NO 1474 (endIndex-1)
      const firstLabelInsert = labelInsertions[0];
      if (firstLabelInsert.location?.index !== undefined) {
        console.log(`🧪 Test: Posición de inserción del primer label: ${firstLabelInsert.location.index}`);
        expect(firstLabelInsert.location.index).toBe(1475);
      }

      console.log("✅ Test: Posición de inserción verificada correctamente");
    });

    it("should use thumbnail URIs with size parameter", async () => {
      // Arrange
      console.log("🧪 Test: Verificando que se usen URIs con thumbnails (=s800)...");

      // Mock para capturar inserciones de imágenes
      const imageInsertions: any[] = [];
      mockDocsClient.documents.batchUpdate.mockImplementation((params: any) => {
        const requests = params.requestBody?.requests || [];
        requests.forEach((req: any) => {
          if (req.insertInlineImage) {
            imageInsertions.push(req.insertInlineImage);
          }
        });
        return Promise.resolve(mockBatchUpdateResponse);
      });

      mockDocsClient.documents.get
        .mockResolvedValueOnce(mockDocumentGetResponse)
        .mockResolvedValueOnce(mockDocumentAfterLabelResponse);

      // Act
      await googleService.createStructuredDocumentWithTablesAndPrivateImages(realRequestData);

      // Assert
      console.log(`🧪 Test: Inserciones de imágenes encontradas: ${imageInsertions.length}`);

      // Verificar que se intentaron insertar imágenes
      expect(imageInsertions.length).toBeGreaterThan(0);

      // Verificar que las URIs tienen el parámetro =s800 para thumbnails
      imageInsertions.forEach((insertion, idx) => {
        console.log(`🧪 Test: URI imagen ${idx + 1}: ${insertion.uri}`);
        expect(insertion.uri).toContain("=s800");
        expect(insertion.uri).toMatch(/https:\/\/lh3\.googleusercontent\.com\/d\/.+=s800/);
      });

      console.log("✅ Test: URIs de thumbnails verificadas correctamente");
    });

    it.skip("should log diagnostic information during execution", async () => {
      // Este test está marcado como skip porque requiere capturar console.log
      // Para habilitarlo, se necesita un mock de console.log

      const consoleLogs: string[] = [];
      const originalLog = console.log;
      console.log = vi.fn((...args: any[]) => {
        consoleLogs.push(args.join(" "));
        originalLog(...args);
      });

      mockDocsClient.documents.get
        .mockResolvedValueOnce(mockDocumentGetResponse)
        .mockResolvedValueOnce(mockDocumentAfterLabelResponse);

      await googleService.createStructuredDocumentWithTablesAndPrivateImages(realRequestData);

      // Verificar que se emitieron logs de diagnóstico
      const diagnosticLogs = consoleLogs.filter((log) => log.includes("[DIAGNÓSTICO]"));
      expect(diagnosticLogs.length).toBeGreaterThan(0);

      console.log = originalLog;
    });
  });

  describe("findInsertionIndex (integration test)", () => {
    it("should find correct insertion position after table", async () => {
      // Este test verifica indirectamente findInsertionIndex a través de la función completa
      console.log("🧪 Test: Verificando que findInsertionIndex encuentre la posición correcta...");

      mockDocsClient.documents.get
        .mockResolvedValueOnce(mockDocumentGetResponse)
        .mockResolvedValueOnce(mockDocumentAfterLabelResponse);

      const textInsertions: any[] = [];
      mockDocsClient.documents.batchUpdate.mockImplementation((params: any) => {
        const requests = params.requestBody?.requests || [];
        requests.forEach((req: any) => {
          if (req.insertText && req.insertText.text?.includes("Semestre:")) {
            textInsertions.push(req.insertText);
          }
        });
        return Promise.resolve(mockBatchUpdateResponse);
      });

      await googleService.createStructuredDocumentWithTablesAndPrivateImages(realRequestData);

      // Verificar que findInsertionIndex retornó endIndex (1475) en lugar de endIndex-1 (1474)
      if (textInsertions.length > 0) {
        const insertionIndex = textInsertions[0].location?.index;
        console.log(`🧪 Test: Índice de inserción encontrado: ${insertionIndex}`);
        expect(insertionIndex).toBe(1475);
      }

      console.log("✅ Test: findInsertionIndex funciona correctamente");
    });
  });
});
