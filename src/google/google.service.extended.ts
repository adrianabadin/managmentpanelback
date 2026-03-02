import { GoogleService } from "./google.service";
import { google } from "googleapis";
import { logger } from "../Global.Services/logger";
import { invalidCredentials } from './google.errors';
import { StructuredDocumentRequest } from "./google.interfaces";
import { DocumentCreateError, DocumentUpdateError, GoogleError, UnknownGoogleError } from './google.errors';

/**
 * Extensión del GoogleService con métodos avanzados para crear documentos
 * estructurados con tablas reales e imágenes incrustadas desde Drive.
 *
 * Usa múltiples pasadas de batchUpdate para evitar problemas de índices:
 *  1ra pasada: insertar estructura (título, metadata, headers, tablas vacías)
 *  2da pasada: llenar celdas de las tablas con datos
 *  3ra pasada: insertar imágenes inline desde Drive
 */
export class GoogleServiceExtended extends GoogleService {

  /**
   * Busca la posición de inserción para una imagen: después de la tabla
   * o mensaje de una demography específica.
   */
  private findInsertionIndex(
    bodyContent: any[],
    demographyName: string,
    allDemographies: { name?: string }[]
  ): number | null {
    console.log(`     🔍 [findInsertionIndex] Buscando posición para "${demographyName}"`);
    console.log(`        Total elementos en body: ${bodyContent.length}`);

    for (let ei = 0; ei < bodyContent.length; ei++) {
      const el = bodyContent[ei];
      if (!el.paragraph) continue;

      const paraText = (el.paragraph.elements || [])
        .map((pe: any) => pe.textRun?.content || '')
        .join('');

      if (paraText.trim() !== demographyName) continue;

      console.log(`     ✅ Header encontrado en elemento ${ei}: "${demographyName}"`);
      console.log(`        Buscando final de la sección...`);

      // Encontramos el header, buscar el final de su sección
      for (let ni = ei + 1; ni < bodyContent.length; ni++) {
        const nextEl = bodyContent[ni];

        // Si es tabla, insertar después de la tabla (en el siguiente párrafo válido)
        if (nextEl.table && nextEl.endIndex) {
          console.log(`        📊 Tabla encontrada en elemento ${ni}, endIndex: ${nextEl.endIndex}`);
          console.log(`        → Insertará imagen en posición ${nextEl.endIndex} (después de la tabla)`);
          return nextEl.endIndex;
        }

        // Si es párrafo con header de otra demography, insertar antes
        if (nextEl.paragraph) {
          const nextText = (nextEl.paragraph.elements || [])
            .map((pe: any) => pe.textRun?.content || '')
            .join('');
          const isNextHeader = allDemographies.some(d => d.name === nextText.trim());
          if (isNextHeader && nextEl.startIndex) {
            console.log(`        📝 Siguiente header encontrado en elemento ${ni}: "${nextText.trim()}"`);
            console.log(`        → Insertará imagen en posición ${nextEl.startIndex - 1}`);
            return nextEl.startIndex - 1;
          }
        }
      }

      // No hay siguiente sección, insertar al final del body
      const lastEl = bodyContent[bodyContent.length - 1];
      const finalPos = (lastEl.endIndex || lastEl.startIndex || 2) - 1;
      console.log(`        🔚 No hay más secciones, insertará al final en posición ${finalPos}`);
      return finalPos;
    }

    console.log(`     ❌ No se encontró el header "${demographyName}" en el documento`);
    console.log(`        Headers disponibles:`, bodyContent
      .filter(el => el.paragraph)
      .map(el => (el.paragraph.elements || [])
        .map((pe: any) => pe.textRun?.content || '')
        .join('')
        .trim()
      )
      .filter(text => text.length > 0)
    );

    return null;
  }

  /**
   * Obtiene un access token válido desde el GoogleAuth (service account).
   * GoogleService.authClient es GoogleAuth (factory), no OAuth2Client,
   * por lo que hay que obtener el client interno y pedir el token.
   */
  private async getAccessToken(): Promise<string> {
    if (GoogleService.authClient === undefined) await this.initiateService();
    const client = await GoogleService.authClient!.getClient();
    const tokenResponse = await client.getAccessToken();
    // getAccessToken devuelve { token, res } o directamente el string
    const token = typeof tokenResponse === 'string'
      ? tokenResponse
      : tokenResponse?.token;
    if (!token) throw new Error("No se pudo obtener access token del service account");
    return token;
  }

  /**
   * Crea un documento Google Docs estructurado con tablas e imágenes.
   * Usa 3 pasadas separadas de batchUpdate para manejar índices correctamente.
   */
  async createStructuredDocumentWithTablesAndPrivateImages(
    request: StructuredDocumentRequest
  ): Promise<string | any> {
    try {
      if (GoogleService.authClient === undefined) await this.initiateService();

      const docsClient = google.docs({ version: "v1", auth: GoogleService.authClient });
      const driveClient = google.drive({ version: "v3", auth: GoogleService.authClient });

      // ===================================================================
      // PASO 1: Crear documento vacío
      // ===================================================================
      console.log("📄 Creando documento Google Docs...");
      const document = await docsClient.documents.create({
        requestBody: { title: request.title }
      });

      const documentId = document.data.documentId;
      if (!documentId) throw new DocumentCreateError();
      console.log(`✅ Documento creado: ${documentId}`);

      // ===================================================================
      // PASO 2 – 1ra batchUpdate: Insertar estructura completa
      //   Título, metadata, estadísticas, headers, tablas vacías, mensajes vacíos
      //   Todo con endOfSegmentLocation (append al final) → no hay shift de índices
      // ===================================================================
      console.log("📝 Paso 2: Insertando estructura del documento...");
      const structureRequests: any[] = [];

      // --- Título ---
      const titleText = request.title + "\n\n";
      structureRequests.push({
        insertText: {
          endOfSegmentLocation: { segmentId: '' },
          text: titleText
        }
      });

      // --- Metadata ---
      const metadataLines = [
        `Fecha de generación: ${request.content.metadata.generatedAt}`,
        `Generado por: ${request.content.metadata.generatedBy}`,
        `Departamento: ${request.content.metadata.department}`,
      ];
      if (request.content.metadata.state) {
        metadataLines.push(`Estado: ${request.content.metadata.state}`);
      }
      const metadataText = metadataLines.join('\n') + '\n\n';
      structureRequests.push({
        insertText: {
          endOfSegmentLocation: { segmentId: '' },
          text: metadataText
        }
      });

      // --- Estadísticas ---
      const stats = request.content.statistics;
      const statsText = [
        "ESTADÍSTICAS GENERALES",
        "",
        `Total de actividades: ${stats.total}`,
        `Completadas: ${stats.completed} (${stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%)`,
        `En progreso: ${stats.inProgress} (${stats.total > 0 ? Math.round((stats.inProgress / stats.total) * 100) : 0}%)`,
        `Pendientes: ${stats.pending} (${stats.total > 0 ? Math.round((stats.pending / stats.total) * 100) : 0}%)`,
      ].join('\n') + '\n\n';
      structureRequests.push({
        insertText: {
          endOfSegmentLocation: { segmentId: '' },
          text: statsText
        }
      });

      // --- Demographies: headers + tablas vacías / mensajes vacíos ---
      for (const demography of request.content.demographies) {
        // Header de la demography (texto plano, formateo en 2da pasada)
        const headerText = demography.name + "\n\n";
        structureRequests.push({
          insertText: {
            endOfSegmentLocation: { segmentId: '' },
            text: headerText
          }
        });

        const isEmpty = demography.hasItems === false || !demography.items || demography.items.length === 0;

        if (isEmpty) {
          const noItemsText = (demography.emptyMessage || "Sin actividades registradas.") + "\n\n";
          structureRequests.push({
            insertText: {
              endOfSegmentLocation: { segmentId: '' },
              text: noItemsText
            }
          });
        } else {
          // Insertar tabla vacía (header row + data rows)
          const numRows = demography.items.length + 1;
          const numCols = 7;
          structureRequests.push({
            insertTable: {
              rows: numRows,
              columns: numCols,
              endOfSegmentLocation: { segmentId: '' }
            }
          });

          // Salto de línea después de la tabla
          structureRequests.push({
            insertText: {
              endOfSegmentLocation: { segmentId: '' },
              text: "\n"
            }
          });
        }
      }

      await docsClient.documents.batchUpdate({
        documentId,
        requestBody: { requests: structureRequests }
      });
      console.log("✅ Estructura base insertada");

      // ===================================================================
      // PASO 3A – Formatear headers (antes de insertar texto en celdas)
      //   Los updateTextStyle de headers usan índices originales del documento.
      //   DEBEN ejecutarse ANTES de los insertText de celdas, porque los
      //   insertText desplazan los índices y los headers post-tabla quedarían
      //   apuntando a posiciones incorrectas dentro de la tabla expandida.
      // ===================================================================
      console.log("📊 Paso 3A: Formateando headers del documento...");
      const doc = await docsClient.documents.get({ documentId });
      const bodyContent = doc.data.body?.content || [];

      const headerFormatRequests: any[] = [];

      for (const element of bodyContent) {
        if (!element.paragraph) continue;
        const paraElements = element.paragraph.elements || [];
        for (const pe of paraElements) {
          if (!pe.textRun?.content || pe.startIndex === undefined) continue;
          const text = pe.textRun.content.trim();

          // Verificar si es un header de demography
          const isDemographyHeader = request.content.demographies.some(d => d.name === text);
          if (isDemographyHeader && pe.startIndex !== null) {
            const headerRange = {
              startIndex: pe.startIndex,
              endIndex: pe.startIndex + text.length
            };
            console.log(`  📍 Formateando header "${text}" - Range: ${headerRange.startIndex}-${headerRange.endIndex}`);
            headerFormatRequests.push({
              updateTextStyle: {
                range: headerRange,
                textStyle: {
                  bold: true,
                  fontSize: { magnitude: 14, unit: 'PT' },
                  weightedFontFamily: { fontFamily: 'Arial' }
                },
                fields: 'bold,fontSize,weightedFontFamily'
              }
            });
          }

          // Formatear título del documento
          if (text === request.title && pe.startIndex !== null) {
            const titleRange = {
              startIndex: pe.startIndex,
              endIndex: pe.startIndex + text.length
            };
            console.log(`  📍 Formateando título - Range: ${titleRange.startIndex}-${titleRange.endIndex}`);
            headerFormatRequests.push({
              updateTextStyle: {
                range: titleRange,
                textStyle: {
                  bold: true,
                  fontSize: { magnitude: 18, unit: 'PT' },
                  weightedFontFamily: { fontFamily: 'Arial' }
                },
                fields: 'bold,fontSize,weightedFontFamily'
              }
            });
          }

          // Formatear "ESTADÍSTICAS GENERALES"
          if (text === "ESTADÍSTICAS GENERALES" && pe.startIndex !== null) {
            const statsRange = {
              startIndex: pe.startIndex,
              endIndex: pe.startIndex + text.length
            };
            console.log(`  📍 Formateando "ESTADÍSTICAS GENERALES" - Range: ${statsRange.startIndex}-${statsRange.endIndex}`);
            headerFormatRequests.push({
              updateTextStyle: {
                range: statsRange,
                textStyle: {
                  bold: true,
                  fontSize: { magnitude: 14, unit: 'PT' },
                  weightedFontFamily: { fontFamily: 'Arial' }
                },
                fields: 'bold,fontSize,weightedFontFamily'
              }
            });
          }

          // Italizar mensajes de vacío
          const emptyMessages = [
            "Sin actividades registradas.",
            "No se han creado actividades para esta localidad en el período reportado."
          ];
          if (emptyMessages.some(msg => text.startsWith(msg.substring(0, 20)))) {
            headerFormatRequests.push({
              updateTextStyle: {
                range: {
                  startIndex: pe.startIndex!,
                  endIndex: pe.startIndex! + text.length
                },
                textStyle: { italic: true },
                fields: 'italic'
              }
            });
          }
        }
      }

      // Ejecutar formateo de headers en su propio batch (índices originales, sin shift)
      if (headerFormatRequests.length > 0) {
        console.log(`  📝 Enviando ${headerFormatRequests.length} requests de formateo de headers...`);
        await docsClient.documents.batchUpdate({
          documentId,
          requestBody: { requests: headerFormatRequests }
        });
        console.log("  ✅ Headers formateados correctamente");
      }

      // ===================================================================
      // PASO 3B – Llenar tablas con texto + formatear celdas
      //   Los insertText desplazan índices, pero se procesan en orden
      //   descendente para evitar conflictos entre sí.
      //   Los updateTextStyle de celdas se ejecutan inmediatamente después
      //   de cada insertText correspondiente (índices correctos).
      // ===================================================================
      console.log("📊 Paso 3B: Llenando tablas...");
      const cellRequests: any[] = [];

      // Recopilar demographies que tienen items (en orden)
      const demographiesWithItems = request.content.demographies.filter(
        d => d.hasItems !== false && d.items && d.items.length > 0
      );

      let tableIndex = 0;
      for (const element of bodyContent) {
        if (!element.table || tableIndex >= demographiesWithItems.length) continue;

        const demography = demographiesWithItems[tableIndex];
        const tableRows = element.table.tableRows || [];
        const headers = ["Título", "Inicio", "Fin", "Progreso", "Asignado", "Prioridad", "Tipo"];

        console.log(`  📋 Tabla ${tableIndex + 1}/${demographiesWithItems.length}: ${demography.name} (${demography.items.length} items)`);

        const cellInserts: { index: number; text: string; bold: boolean }[] = [];

        // Header row
        if (tableRows.length > 0) {
          const headerCells = tableRows[0].tableCells || [];
          for (let i = 0; i < Math.min(headers.length, headerCells.length); i++) {
            const cell = headerCells[i];
            const cellParagraph = cell.content?.[0]?.paragraph;
            const cellStart = cellParagraph?.elements?.[0]?.startIndex;
            if (cellStart !== undefined && cellStart !== null) {
              cellInserts.push({ index: cellStart, text: headers[i], bold: true });
            }
          }
        }

        // Mapeo de traducciones
        const priorityLabels: Record<string, string> = {
          low: "Baja", medium: "Media", high: "Alta", critical: "Crítica",
        };
        const typeLabels: Record<string, string> = {
          task: "Tarea", project: "Proyecto", milestone: "Hito",
        };

        // Data rows
        for (let rowIdx = 1; rowIdx < tableRows.length && rowIdx - 1 < demography.items.length; rowIdx++) {
          const item = demography.items[rowIdx - 1];
          const rowData = [
            item.title,
            item.startDate,
            item.endDate,
            `${item.progress}%`,
            item.assignedTo,
            priorityLabels[item.priority] || item.priority,
            typeLabels[item.type] || item.type
          ];

          const dataCells = tableRows[rowIdx].tableCells || [];
          for (let colIdx = 0; colIdx < Math.min(rowData.length, dataCells.length); colIdx++) {
            const cell = dataCells[colIdx];
            const cellParagraph = cell.content?.[0]?.paragraph;
            const cellStart = cellParagraph?.elements?.[0]?.startIndex;
            if (cellStart !== undefined && cellStart !== null) {
              cellInserts.push({ index: cellStart, text: rowData[colIdx], bold: false });
            }
          }
        }

        // Ordenar descendente por índice para evitar desplazamiento
        cellInserts.sort((a, b) => b.index - a.index);

        for (const insert of cellInserts) {
          cellRequests.push({
            insertText: {
              location: { index: insert.index },
              text: insert.text
            }
          });
          cellRequests.push({
            updateTextStyle: {
              range: {
                startIndex: insert.index,
                endIndex: insert.index + insert.text.length
              },
              textStyle: {
                bold: insert.bold || false,
                fontSize: { magnitude: 11, unit: 'PT' },
                weightedFontFamily: { fontFamily: 'Arial' }
              },
              fields: 'bold,fontSize,weightedFontFamily'
            }
          });
        }

        tableIndex++;
      }

      if (cellRequests.length > 0) {
        console.log(`  📝 Enviando ${cellRequests.length} requests de celdas...`);
        const BATCH_SIZE = 100;
        for (let i = 0; i < cellRequests.length; i += BATCH_SIZE) {
          const batch = cellRequests.slice(i, i + BATCH_SIZE);
          await docsClient.documents.batchUpdate({
            documentId,
            requestBody: { requests: batch }
          });
        }
        console.log("  ✅ Tablas llenadas correctamente");
      }

      // ===================================================================
      // PASO 4 – Insertar imágenes desde Drive (una por una)
      //   Cada imagen requiere:
      //   1. Hacer el archivo público para que Docs lo pueda leer
      //   2. documents.get fresco para obtener índices actualizados
      //   3. Su propio batchUpdate (label + imagen)
      //   Esto evita problemas de shift de índices entre imágenes.
      // ===================================================================
      const demographiesWithImages = request.content.demographies.filter(
        d => d.images && (d.images.quarter1Id || d.images.quarter2Id || d.images.quarter3Id || d.images.quarter4Id)
      );

      console.log(`\n🔍 [DIAGNÓSTICO PASO 4] Total demographies con imágenes: ${demographiesWithImages.length}`);
      console.log(`🔍 [DIAGNÓSTICO] Demographies con imágenes:`, JSON.stringify(demographiesWithImages.map(d => ({
        name: d.name,
        hasItems: d.hasItems,
        itemsCount: d.items?.length || 0,
        q1: d.images?.quarter1Id || 'N/A',
        q2: d.images?.quarter2Id || 'N/A',
        q3: d.images?.quarter3Id || 'N/A',
        q4: d.images?.quarter4Id || 'N/A'
      })), null, 2));

      if (demographiesWithImages.length > 0) {
        console.log(`🖼️ Paso 4: Insertando imágenes...`);

        // Recopilar imágenes en orden: q1, q2, q3, q4 para cada demography
        const imageInserts: { fileId: string; label: string; demographyName: string }[] = [];

        for (const dem of demographiesWithImages) {
          if (dem.images!.quarter1Id) {
            imageInserts.push({
              fileId: dem.images!.quarter1Id,
              label: "1er Trimestre",
              demographyName: dem.name
            });
          }
          if (dem.images!.quarter2Id) {
            imageInserts.push({
              fileId: dem.images!.quarter2Id,
              label: "2do Trimestre",
              demographyName: dem.name
            });
          }
          if (dem.images!.quarter3Id) {
            imageInserts.push({
              fileId: dem.images!.quarter3Id,
              label: "3er Trimestre",
              demographyName: dem.name
            });
          }
          if (dem.images!.quarter4Id) {
            imageInserts.push({
              fileId: dem.images!.quarter4Id,
              label: "4to Trimestre",
              demographyName: dem.name
            });
          }
        }

        console.log(`🔍 [DIAGNÓSTICO] Total de imágenes a insertar: ${imageInserts.length}`);
        console.log(`🔍 [DIAGNÓSTICO] Detalle de imágenes:`, JSON.stringify(imageInserts, null, 2));

        // Hacer TODOS los archivos públicos antes de insertarlos
        console.log(`\n🔓 Haciendo archivos públicos...`);
        for (const img of imageInserts) {
          try {
            const permissionResponse = await driveClient.permissions.create({
              fileId: img.fileId,
              requestBody: { role: "reader", type: "anyone" }
            });
            console.log(`  🔓 Archivo ${img.fileId} hecho público - Permission ID: ${permissionResponse.data.id}`);

            // Verificar permisos del archivo
            try {
              const fileMetadata = await driveClient.files.get({
                fileId: img.fileId,
                fields: 'id,name,permissions,webViewLink,webContentLink'
              });
              console.log(`  🔍 [VERIFICACIÓN] Archivo ${img.fileId}:`);
              console.log(`     - Nombre: ${fileMetadata.data.name}`);
              console.log(`     - Permisos: ${fileMetadata.data.permissions?.length || 0} permisos configurados`);
              console.log(`     - WebViewLink: ${fileMetadata.data.webViewLink || 'N/A'}`);
              console.log(`     - WebContentLink: ${fileMetadata.data.webContentLink || 'N/A'}`);
            } catch (verifyErr: any) {
              console.error(`  ⚠️ No se pudo verificar permisos de ${img.fileId}: ${verifyErr.message}`);
            }
          } catch (err: any) {
            console.error(`  ❌ No se pudo hacer público ${img.fileId}:`);
            console.error(`     Error: ${err.message || err}`);
            console.error(`     Stack:`, err.stack);
          }
        }

        // Insertar cada imagen individualmente con documents.get fresco
        console.log(`\n🖼️ Iniciando inserción de imágenes individuales...`);
        for (let imgIdx = 0; imgIdx < imageInserts.length; imgIdx++) {
          const img = imageInserts[imgIdx];
          console.log(`\n🔍 [IMAGEN ${imgIdx + 1}/${imageInserts.length}] Procesando:`, JSON.stringify(img, null, 2));

          try {
            // Leer documento actualizado para obtener posiciones correctas
            console.log(`  📖 Leyendo documento actualizado...`);
            const freshDoc = await docsClient.documents.get({ documentId });
            const freshBody = freshDoc.data.body?.content || [];
            console.log(`  📖 Documento tiene ${freshBody.length} elementos en body`);

            // Buscar la posición de inserción: después de la tabla/mensaje de esta demography
            console.log(`  🔍 Buscando posición de inserción para "${img.demographyName}"...`);
            let insertIndex = this.findInsertionIndex(freshBody, img.demographyName, request.content.demographies);
            console.log(`  🔍 Posición encontrada: ${insertIndex}`);

            if (insertIndex === null || insertIndex <= 0) {
              console.warn(`  ⚠️ No se encontró posición válida para imagen de "${img.demographyName}"`);
              console.warn(`     insertIndex: ${insertIndex}`);
              continue;
            }

            // URI con thumbnail de tamaño específico para evitar "image too large"
            // =s2048 = máximo 2048px en el lado más largo (máxima calidad disponible, mantiene aspect ratio)
            const imageUri = `https://lh3.googleusercontent.com/d/${img.fileId}=s2048`;

            console.log(`  🖼️ Preparando inserción de "${img.label}" para "${img.demographyName}"`);
            console.log(`     - Posición: ${insertIndex}`);
            console.log(`     - FileId: ${img.fileId}`);
            console.log(`     - URI (thumbnail 2048px - máxima calidad): ${imageUri}`);

            // Paso A: Insertar texto del label
            console.log(`  📝 Paso A: Insertando label en posición ${insertIndex}...`);
            const labelInsertResponse = await docsClient.documents.batchUpdate({
              documentId,
              requestBody: {
                requests: [{
                  insertText: {
                    location: { index: insertIndex },
                    text: `\n${img.label}:\n`
                  }
                }]
              }
            });
            console.log(`  ✅ Label insertado - Response status: ${labelInsertResponse.status}`);

            // Paso B: Leer de nuevo para obtener la posición exacta después del label
            console.log(`  📖 Paso B: Leyendo documento después de insertar label...`);
            const docAfterLabel = await docsClient.documents.get({ documentId });
            const bodyAfterLabel = docAfterLabel.data.body?.content || [];
            console.log(`  📖 Documento ahora tiene ${bodyAfterLabel.length} elementos`);

            // Buscar el texto del label que acabamos de insertar para poner la imagen justo después
            console.log(`  🔍 Buscando posición del label "${img.label}"...`);
            let imageInsertIndex: number | null = null;
            for (const el of bodyAfterLabel) {
              if (!el.paragraph) continue;
              for (const pe of (el.paragraph.elements || [])) {
                if (!pe.textRun?.content || pe.startIndex === undefined) continue;
                // Buscar el ":\n" al final del label
                if (pe.textRun.content.includes(`${img.label}:`)) {
                  // Insertar imagen justo después del label (después del ":\n")
                  imageInsertIndex = pe.startIndex! + pe.textRun.content.indexOf(`${img.label}:`) + img.label.length + 1;
                  console.log(`  🔍 Label encontrado en startIndex ${pe.startIndex}, imagen irá en ${imageInsertIndex}`);
                  break;
                }
              }
              if (imageInsertIndex !== null) break;
            }

            if (imageInsertIndex === null) {
              console.warn(`  ⚠️ No se encontró el label "${img.label}" después de insertarlo`);
              console.warn(`     Elementos del body:`, bodyAfterLabel.map((el, idx) => ({
                index: idx,
                type: el.paragraph ? 'paragraph' : el.table ? 'table' : 'other',
                startIndex: el.startIndex,
                endIndex: el.endIndex
              })));
              continue;
            }

            // Paso C: Insertar la imagen inline
            console.log(`  🖼️ Paso C: Insertando imagen inline en posición ${imageInsertIndex}...`);
            console.log(`     Request:`, JSON.stringify({
              uri: imageUri,
              location: { index: imageInsertIndex },
              objectSize: {
                height: { magnitude: 375, unit: 'PT' },
                width: { magnitude: 600, unit: 'PT' }
              }
            }, null, 2));

            const imageInsertResponse = await docsClient.documents.batchUpdate({
              documentId,
              requestBody: {
                requests: [{
                  insertInlineImage: {
                    uri: imageUri,
                    location: { index: imageInsertIndex },
                    objectSize: {
                      height: { magnitude: 375, unit: 'PT' },
                      width: { magnitude: 600, unit: 'PT' }
                    }
                  }
                }]
              }
            });

            console.log(`  ✅ Imagen "${img.label}" insertada exitosamente para "${img.demographyName}"`);
            console.log(`     Response status: ${imageInsertResponse.status}`);

          } catch (error: any) {
            // Log detallado del error pero no fallar todo el documento
            console.error(`\n❌ [ERROR IMAGEN ${imgIdx + 1}/${imageInserts.length}] Error procesando "${img.label}" (${img.fileId})`);
            console.error(`   Demography: "${img.demographyName}"`);

            // Extraer información detallada del error
            const errMsg = error?.errors?.[0]?.message || error?.message || 'Error desconocido';
            const errCode = error?.code || error?.errors?.[0]?.code || 'N/A';
            const errStatus = error?.status || error?.errors?.[0]?.status || 'N/A';

            console.error(`   Mensaje: ${errMsg}`);
            console.error(`   Código: ${errCode}`);
            console.error(`   Status: ${errStatus}`);

            // Log completo del error para análisis
            if (error.errors && Array.isArray(error.errors)) {
              console.error(`   Errores detallados:`, JSON.stringify(error.errors, null, 2));
            }

            // Log de stack trace si está disponible
            if (error.stack) {
              console.error(`   Stack trace: ${error.stack}`);
            }

            // Si es error de imagen o tamaño, intentar con thumbnails más pequeños
            if (errMsg.toLowerCase().includes('image') ||
                errMsg.toLowerCase().includes('large') ||
                errMsg.toLowerCase().includes('size')) {
              console.log(`\n  🔄 Error relacionado con tamaño de imagen, intentando con thumbnail más pequeño...`);

              // Intentar con thumbnails de tamaños decrecientes (de alta a baja calidad)
              const thumbnailSizes = [1600, 1200, 800, 600, 400, 200];

              for (const size of thumbnailSizes) {
                try {
                  const thumbnailUri = `https://lh3.googleusercontent.com/d/${img.fileId}=s${size}`;
                  console.log(`     Intentando con thumbnail ${size}px: ${thumbnailUri}`);

                  const freshDoc2 = await docsClient.documents.get({ documentId });
                  const freshBody2 = freshDoc2.data.body?.content || [];
                  const retryIndex = this.findInsertionIndex(freshBody2, img.demographyName, request.content.demographies);

                  if (!retryIndex || retryIndex <= 0) {
                    console.warn(`     No se encontró posición válida para retry`);
                    continue;
                  }

                  // Primero insertar el label si no existe
                  await docsClient.documents.batchUpdate({
                    documentId,
                    requestBody: {
                      requests: [{
                        insertText: {
                          location: { index: retryIndex },
                          text: `\n${img.label}:\n`
                        }
                      }]
                    }
                  });

                  // Leer de nuevo para obtener la posición después del label
                  const docAfterLabelRetry = await docsClient.documents.get({ documentId });
                  const bodyAfterLabelRetry = docAfterLabelRetry.data.body?.content || [];

                  let imageIndexRetry: number | null = null;
                  for (const el of bodyAfterLabelRetry) {
                    if (!el.paragraph) continue;
                    for (const pe of (el.paragraph.elements || [])) {
                      if (!pe.textRun?.content || pe.startIndex === undefined || pe.startIndex === null) continue;
                      if (pe.textRun.content.includes(`${img.label}:`)) {
                        imageIndexRetry = pe.startIndex + pe.textRun.content.indexOf(`${img.label}:`) + img.label.length + 2;
                        break;
                      }
                    }
                    if (imageIndexRetry !== null) break;
                  }

                  if (imageIndexRetry === null) {
                    console.warn(`     No se encontró label después de insertar`);
                    continue;
                  }

                  // Insertar imagen con thumbnail más pequeño
                  const retryResponse = await docsClient.documents.batchUpdate({
                    documentId,
                    requestBody: {
                      requests: [{
                        insertInlineImage: {
                          uri: thumbnailUri,
                          location: { index: imageIndexRetry },
                          objectSize: {
                            height: { magnitude: 200, unit: 'PT' },
                            width: { magnitude: 300, unit: 'PT' }
                          }
                        }
                      }]
                    }
                  });

                  console.log(`  ✅ Imagen insertada con thumbnail ${size}px - Status: ${retryResponse.status}`);
                  break; // Éxito, salir del loop

                } catch (retryErr: any) {
                  const retryErrMsg = retryErr?.errors?.[0]?.message || retryErr?.message || '';
                  console.error(`     ❌ Thumbnail ${size}px falló: ${retryErrMsg}`);

                  // Si es el último intento, registrar error completo
                  if (size === thumbnailSizes[thumbnailSizes.length - 1]) {
                    console.error(`  ❌ Todos los tamaños de thumbnail fallaron. Error final:`);
                    console.error(`     Código: ${retryErr?.code || retryErr?.errors?.[0]?.code}`);
                    if (retryErr.errors) {
                      console.error(`     Errores:`, JSON.stringify(retryErr.errors, null, 2));
                    }
                  }
                }
              }
            }
          }
        }

        console.log(`\n✅ Paso 4 completado: Procesadas ${imageInserts.length} imágenes`);
      } else {
        console.log(`\n⏭️ Paso 4 omitido: No hay demographies con imágenes`);
      }

      // ===================================================================
      // PASO 5: Compartir documento
      // ===================================================================
      console.log(`📤 Paso 5: Compartiendo documento con ${request.users.length} usuario(s)...`);

      const permissionPromises = request.users.map(async email => {
        try {
          return await driveClient.permissions.create({
            fileId: documentId,
            requestBody: {
              role: "writer",
              type: "user",
              emailAddress: email
            },
            fields: "id"
          });
        } catch (error) {
          logger.error({ function: "shareWithUsers", error, email });
          return null;
        }
      });

      // Acceso público (lectura) como fallback
      permissionPromises.push(
        driveClient.permissions.create({
          fileId: documentId,
          requestBody: {
            role: "writer",
            type: "anyone"
          }
        }).catch(error => {
          logger.error({ function: "sharePublic", error });
          return null;
        })
      );

      await Promise.all(permissionPromises);
      console.log("✅ Documento compartido");

      return documentId;

    } catch (error) {
      const parsedError = invalidCredentials(error as any);
      if (parsedError instanceof Error) {
        logger.error({ function: "createStructuredDocumentWithTablesAndPrivateImages", error: parsedError });
        return parsedError;
      }
      logger.error({ function: "createStructuredDocumentWithTablesAndPrivateImages", error: new UnknownGoogleError(error) });
      return new UnknownGoogleError(error);
    }
  }
}
