# Configuración de Base de Datos para Testing

## MongoDB Local para Tests de Integración

Los tests de integración E2E requieren una instancia de MongoDB local separada de la base de datos de producción/desarrollo.

### Opción 1: MongoDB Community (Recomendado)

#### Instalación en Windows

1. **Descargar MongoDB Community Server**
   ```
   https://www.mongodb.com/try/download/community
   ```
   - Versión recomendada: 7.0 o superior
   - Seleccionar: Windows x64, MSI Installer

2. **Instalar MongoDB**
   - Ejecutar el instalador `.msi`
   - Tipo de instalación: **Complete**
   - Servicio de Windows: **Sí** (instalar como servicio)
   - MongoDB Compass: Opcional (GUI útil para debugging)

3. **Verificar instalación**
   ```bash
   mongod --version
   mongo --version
   ```

4. **Iniciar servicio** (si no se inició automáticamente)
   ```bash
   net start MongoDB
   ```

#### Crear base de datos de testing

```bash
# Conectar a MongoDB local
mongosh

# Crear base de datos de testing
use rsx_test

# Crear una colección dummy (MongoDB crea la DB al insertar)
db.dummy.insertOne({ test: true })

# Verificar
show dbs
```

### Opción 2: MongoDB con Docker (Alternativa)

Si prefieres usar Docker:

```bash
# Pull imagen de MongoDB
docker pull mongo:7.0

# Crear contenedor para testing
docker run -d \
  --name mongodb-test \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=rsx_test \
  mongo:7.0

# Verificar que está corriendo
docker ps | grep mongodb-test

# Detener cuando no se use
docker stop mongodb-test

# Reiniciar cuando necesites
docker start mongodb-test
```

### Configuración en el Proyecto

#### 1. Variable de Entorno

El archivo `.env` ya incluye:
```env
DATABASE_URL_TEST="mongodb://localhost:27017/rsx_test"
```

#### 2. Uso en Tests

Los tests de integración detectan automáticamente si deben usar `DATABASE_URL_TEST`:

```typescript
// En vitest.config.ts o setup de tests
const dbUrl = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL;
```

### Comandos Útiles

```bash
# Ver bases de datos
mongosh --eval "show dbs"

# Limpiar base de datos de testing (antes de correr tests)
mongosh rsx_test --eval "db.dropDatabase()"

# Ver colecciones en rsx_test
mongosh rsx_test --eval "show collections"

# Exportar datos de testing (backup)
mongodump --db=rsx_test --out=./backup/

# Restaurar datos de testing
mongorestore --db=rsx_test ./backup/rsx_test/
```

### Troubleshooting

#### Error: "MongoNetworkError: connect ECONNREFUSED"
- Verificar que MongoDB esté corriendo: `net start MongoDB` (Windows)
- Verificar puerto: `netstat -an | findstr 27017`

#### Error: "Authentication failed"
- La configuración por defecto de MongoDB local NO requiere autenticación
- Si configuraste auth, actualiza DATABASE_URL_TEST:
  ```
  DATABASE_URL_TEST="mongodb://username:password@localhost:27017/rsx_test"
  ```

#### Base de datos no se crea
- MongoDB crea la base de datos al insertar el primer documento
- Prisma la creará automáticamente al ejecutar `npx prisma db push`

### Workflow de Testing

```bash
# 1. Asegurar que MongoDB local está corriendo
net start MongoDB

# 2. Limpiar base de datos de testing (opcional, para tests frescos)
mongosh rsx_test --eval "db.dropDatabase()"

# 3. Sincronizar schema Prisma a DB de testing
DATABASE_URL=$DATABASE_URL_TEST npx prisma db push

# 4. Ejecutar tests de integración
npm run test:integration

# 5. Ver datos generados por tests (debugging)
mongosh rsx_test
> db.GanttItem.find().pretty()
> db.GanttDependency.find().pretty()
```

### Limpieza Automática en Tests

Los tests E2E deben incluir hooks de limpieza:

```typescript
// gantt/tests/gantt.integration.test.ts
beforeEach(async () => {
  // Limpiar colecciones antes de cada test
  await prisma.ganttItem.deleteMany({});
  await prisma.ganttDependency.deleteMany({});
});

afterAll(async () => {
  // Cerrar conexión Prisma
  await prisma.$disconnect();
});
```

### Seguridad

⚠️ **NUNCA ejecutar tests de integración contra la base de datos de producción**

- `DATABASE_URL` → Producción/Desarrollo remoto
- `DATABASE_URL_TEST` → Local para testing
- Los tests deben verificar que están usando la DB correcta antes de ejecutar
