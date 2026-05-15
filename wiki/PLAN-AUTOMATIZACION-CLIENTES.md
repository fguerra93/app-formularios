# PrintUp - Plan Definitivo de Automatizacion de Interaccion con Clientes

> Investigacion profunda + plan por fases para automatizar el flujo completo:
> desde que el cliente envia un mensaje en RRSS hasta la entrega del pedido.

---

## 1. Analisis del Estado Actual

### Lo que YA existe en la app

| Componente | Estado | Donde esta |
|---|---|---|
| Webhook Meta unificado (WA/IG/FB) | Funcional | `src/app/api/webhooks/meta/route.ts` |
| Bandeja de mensajeria multi-canal | Funcional (UI) | `src/app/admin/mensajeria/` |
| Respuestas automaticas por keywords | Funcional | Tabla `respuestas_automaticas` |
| Bot WhatsApp con flujos (Lambda) | Codigo listo, no desplegado | `lambda/whatsapp-bot/index.ts` |
| IA con Claude Haiku via Bedrock | En Lambda, no conectado | `lambda/whatsapp-bot/index.ts:408` |
| Pagos MercadoPago + webhook | Funcional | `src/app/api/pagos/webhook/route.ts` |
| Emails con Resend | Funcional | Confirmacion de pago |
| Formularios con archivos | Funcional | `src/app/api/formularios/route.ts` |
| Sync NextCloud | Worker Docker | `sync-worker/` |
| Cotizaciones WhatsApp | Tipo definido, flujo parcial | `lib/types.ts:267` |
| Config Meta desde admin | Funcional | `src/app/admin/mensajeria/configuracion/` |

### Lo que FALTA (gaps criticos)

1. **Bot no desplegado** - El Lambda existe pero no esta conectado al webhook real
2. **Sin notificaciones push** - No llega aviso al WhatsApp de PrintUp cuando hay formulario nuevo
3. **Validacion de imagen manual** sin flujo en el admin
4. **Sin cotizacion automatica** para DTF/UV/Sublimacion basada en planillas de precios
5. **Sin Orden de Produccion (OP)** digital
6. **Sin integracion NextCloud Deck** (kanban)
7. **Sin tarjeta de contacto** auto-generada por pedido
8. **Sin flujo de comprobante de pago** por chat
9. **Bot no informa etapas** al cliente automaticamente

---

## 2. Herramientas Seleccionadas (investigacion 2026)

### Stack definitivo recomendado

| Necesidad | Herramienta | Por que |
|---|---|---|
| **Mensajeria multi-canal** | Meta Cloud API (directo) | Ya lo tienen integrado. Gratis el API, solo pagas por template messages (~$0.05 USD/msg en Chile). Sin BSP intermedio. |
| **Bot conversacional** | Logica propia en Next.js + Claude API | Ya tienen el 80% del codigo en Lambda. Mover a Edge Functions o API routes de Next.js. Claude Haiku 4.5 cuesta ~$0.001/interaccion. |
| **IA para cotizaciones** | Claude API (Anthropic directo) | Mas barato que Bedrock. $0.80/MTok input, $4/MTok output con Haiku. Tool use para calcular precios desde planillas. |
| **Email transaccional** | Resend | Ya integrado. 3,000 emails/mes gratis. React Email para templates. |
| **Notificaciones internas** | Resend + WhatsApp API | Email a PrintUp + mensaje WA al numero del negocio cuando llega formulario/pedido. |
| **Automatizacion de workflows** | Supabase Database Webhooks + Edge Functions | Triggers nativos en DB. Sin infraestructura extra. Cuando cambia estado -> trigger -> notificar. |
| **Archivos y validacion** | NextCloud WebDAV API | Ya tienen sync worker. Extender para mover archivos a carpeta "validados". |
| **Kanban de produccion** | NextCloud Deck API | API REST documentada. Crear tarjetas automaticamente al generar OP. |
| **PDF de OP** | @react-pdf/renderer | Genera PDFs desde React components. Server-side en Next.js API routes. |
| **Almacenamiento de media** | Supabase Storage | Para comprobantes de pago, imagenes de chat. Ya disponible en el plan. |

### Herramientas DESCARTADAS (con razon)

| Herramienta | Por que NO |
|---|---|
| **ManyChat / Respond.io** | Costo mensual ($15-45/mes), vendor lock-in, ya tienen el webhook propio funcionando. |
| **Botpress** | Overkill para el volumen de PrintUp. Agrega complejidad. |
| **n8n** | Util pero innecesario si usan Supabase DB webhooks + Edge Functions. Seria otro servicio que mantener. |
| **Twilio** | Mas caro que Meta Cloud API directo para WhatsApp. |
| **SendGrid** | Resend es mas moderno, ya integrado, mejor DX con Next.js. |

---

## 3. Plan por Fases

---

### FASE 11: Bot Inteligente Unificado
**Objetivo:** Consolidar el bot Lambda + webhook Meta en un solo sistema que funcione en produccion.

**Prioridad:** CRITICA - Es la base de toda la automatizacion.

**Tiempo estimado de construccion con Claude Code:** 2-3 sesiones

#### 11.1 - Migrar logica del Lambda al Next.js
- Mover los handlers de `lambda/whatsapp-bot/index.ts` a un servicio en `src/lib/bot/`
- Estructura propuesta:
  ```
  src/lib/bot/
    engine.ts          - Motor principal del bot
    intents.ts         - Deteccion de intenciones (mejorada con IA)
    flows/
      saludo.ts        - Flujo de bienvenida
      cotizacion.ts    - Flujo de cotizacion automatica
      estado-pedido.ts - Consulta de estado
      formulario.ts    - Guia al formulario
      comprobante.ts   - Recepcion de comprobante
      escalacion.ts    - Transferir a humano
    ai.ts              - Integracion Claude API (Anthropic directo)
    notifications.ts   - Notificaciones internas
    types.ts           - Tipos del bot
  ```
- Conectar al webhook existente (`src/app/api/webhooks/meta/route.ts`)
- Usar tabla `conversaciones` existente (no la legacy `conversaciones_whatsapp`)

#### 11.2 - Flujo de bienvenida mejorado
- Detectar si es primera vez o cliente recurrente (buscar en tabla `clientes` por telefono)
- Primera vez:
  ```
  "Hola! Soy el asistente de PrintUp. Antes de continuar,
  eres persona natural o empresa?
  1. Persona
  2. Empresa"
  ```
- Guardar tipo en tabla `clientes` con campos: nombre, telefono, email, tipo (persona/empresa), rut
- Flujo de onboarding: pedir nombre -> email -> (si empresa: rut + razon social)
- Cliente recurrente: saludo personalizado + menu

#### 11.3 - Deteccion de intenciones con IA
- Mantener keywords como fallback rapido (sin costo de API)
- Si no matchea ninguna keyword -> Claude Haiku classify:
  ```typescript
  // Prompt de clasificacion (cuesta ~$0.0005 por llamada)
  const intent = await classifyIntent(message, [
    "cotizar", "estado_pedido", "comprobante_pago",
    "formulario", "horario", "catalogo", "humano", "otro"
  ]);
  ```
- Cache de clasificaciones frecuentes en Supabase para reducir llamadas

#### 11.4 - Notificaciones a PrintUp
- Cuando llega mensaje nuevo y el bot no puede resolver:
  - Email a PrintUp via Resend: "Nuevo mensaje de [nombre] en [canal]"
  - WhatsApp al numero del negocio: "Tienes un mensaje pendiente de [nombre]"
- Cuando llega formulario nuevo:
  - Email + WA a PrintUp: "Nuevo formulario de [nombre] - Material: [X]"
  - Link directo al admin panel: `printup.cl/admin/formularios/[id]`

#### Tablas Supabase nuevas/modificadas:
```sql
-- Agregar campos a clientes
ALTER TABLE clientes ADD COLUMN tipo TEXT DEFAULT 'persona'; -- persona | empresa
ALTER TABLE clientes ADD COLUMN razon_social TEXT;
ALTER TABLE clientes ADD COLUMN whatsapp_phone TEXT;
ALTER TABLE clientes ADD COLUMN canal_origen TEXT; -- whatsapp | instagram | facebook | web

-- Cache de intenciones IA
CREATE TABLE bot_intent_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mensaje_hash TEXT UNIQUE NOT NULL,
  intent TEXT NOT NULL,
  confianza REAL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

### FASE 12: Cotizacion Automatica por Producto
**Objetivo:** Que el bot calcule precios automaticamente para DTF Textil, UV y Sublimacion.

**Prioridad:** ALTA - Reduce el proceso mas manual.

#### 12.1 - Planillas de precios en Supabase
```sql
CREATE TABLE planillas_precios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_producto TEXT NOT NULL, -- 'dtf_textil', 'dtf_uv', 'sublimacion', 'vinilo', etc.
  nombre_display TEXT NOT NULL, -- 'DTF Textil', 'DTF UV Rigido', etc.
  unidad TEXT NOT NULL, -- 'metro_lineal', 'metro_cuadrado', 'unidad', 'pliego'
  ancho_cm REAL, -- ancho del rollo (ej: 60cm DTF)
  rangos JSONB NOT NULL, -- [{min: 1, max: 5, precio: 15000}, {min: 6, max: 20, precio: 12000}...]
  precio_diseno REAL DEFAULT 0, -- costo adicional si no tiene diseno
  tiempo_produccion_dias INT DEFAULT 3,
  notas TEXT,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ejemplo de datos:
INSERT INTO planillas_precios (tipo_producto, nombre_display, unidad, ancho_cm, rangos) VALUES
('dtf_textil', 'DTF Textil', 'metro_lineal', 60, '[
  {"min": 1, "max": 5, "precio": 15000},
  {"min": 6, "max": 20, "precio": 12000},
  {"min": 21, "max": 50, "precio": 10000},
  {"min": 51, "max": null, "precio": 8000}
]'),
('dtf_uv', 'DTF UV Rigido', 'metro_lineal', 60, '[
  {"min": 1, "max": 5, "precio": 22000},
  {"min": 6, "max": 20, "precio": 18000},
  {"min": 21, "max": null, "precio": 15000}
]'),
('sublimacion', 'Sublimacion', 'metro_lineal', 110, '[
  {"min": 1, "max": 10, "precio": 8000},
  {"min": 11, "max": null, "precio": 6000}
]');
```

#### 12.2 - Flujo de cotizacion en el bot
```
Bot: "Que tipo de impresion necesitas?"
     1. DTF Textil (poleras, telas)
     2. DTF UV (rigidos, stickers)
     3. Sublimacion
     4. Otro (cotizacion manual)

[Si elige 1-3]
Bot: "Cuantos metros necesitas? (ej: 3)"
Cliente: "5"

Bot: "Tienes el diseno listo o necesitas que lo hagamos?"
     1. Ya tengo diseno
     2. Necesito diseno (+$X.XXX)

Bot: "Tu cotizacion:
     DTF Textil - 5 metros lineales
     Precio unitario: $12.000/m
     Subtotal: $60.000
     Diseno: incluido
     Tiempo estimado: 2-3 dias habiles
     Envio gratis sobre $50.000

     Deseas confirmar?
     1. Si, quiero proceder
     2. Modificar cantidad
     3. Cotizar otro producto
     4. Hablar con ejecutivo"
```

#### 12.3 - Motor de calculo
```typescript
// src/lib/bot/pricing.ts
interface CotizacionResult {
  tipo_producto: string;
  cantidad: number;
  unidad: string;
  precio_unitario: number;
  subtotal: number;
  costo_diseno: number;
  total: number;
  tiempo_dias: number;
  envio_gratis: boolean;
}

async function calcularCotizacion(
  tipoProducto: string,
  cantidad: number,
  necesitaDiseno: boolean
): Promise<CotizacionResult>
```

#### 12.4 - Admin: Gestionar planillas de precios
- Nueva seccion en `/admin/configuracion` o nueva ruta `/admin/precios`
- CRUD de planillas con rangos de precio editables
- Preview de cotizacion para verificar que los calculos son correctos

#### 12.5 - Cotizacion con Claude para productos complejos
- Para "Otro" o productos que no estan en planilla:
  ```
  Claude recibe: contexto del negocio + catalogo + pregunta del cliente
  Claude responde: estimacion con disclaimer "precio referencial, sujeto a confirmacion"
  ```
- Escalar a humano automaticamente si Claude no puede cotizar

---

### FASE 13: Formulario Inteligente + Validacion de Imagen
**Objetivo:** Automatizar el flujo desde que llega el formulario hasta la validacion.

**Prioridad:** ALTA

#### 13.1 - Formulario mejorado (cliente)
- Agregar campo "tipo_cliente" (persona/empresa) al formulario existente
- Si viene de WhatsApp, prellenar datos del cliente desde la conversacion
- Agregar campo "tipo_impresion" (DTF/UV/Sublimacion/Otro)
- Agregar campo "cantidad" y "dimensiones"
- Upload de imagen con preview
- Al enviar:
  - Guardar en Supabase (tabla `formularios`)
  - Subir archivo a Supabase Storage
  - Trigger de notificacion

#### 13.2 - Notificacion instantanea de formulario nuevo
```typescript
// Supabase Database Webhook -> Edge Function
// Trigger: INSERT en tabla formularios

async function onNuevoFormulario(formulario: Formulario) {
  // 1. Email a PrintUp
  await resend.emails.send({
    to: 'contacto@printup.cl',
    subject: `Nuevo formulario: ${formulario.nombre} - ${formulario.material}`,
    // Template con link al admin
  });

  // 2. WhatsApp a PrintUp
  await sendWhatsAppMessage(
    PRINTUP_PHONE,
    `Nuevo formulario de ${formulario.nombre}\n` +
    `Material: ${formulario.material}\n` +
    `Ver: printup.cl/admin/formularios/${formulario.id}`
  );

  // 3. Si hay conversacion WA activa, notificar al cliente
  if (formulario.telefono) {
    await sendWhatsAppMessage(
      formulario.telefono,
      'Recibimos tu formulario! Estamos revisando tu imagen. ' +
      'Te avisaremos en breve.'
    );
  }
}
```

#### 13.3 - Panel de validacion de imagen en admin
- En `/admin/formularios/[id]`:
  - Vista previa de la imagen grande
  - Link directo a NextCloud para ver en alta resolucion
  - Botones: **Aprobar imagen** / **Rechazar imagen** (con motivo)
  - Al aprobar:
    - Mover archivo a carpeta `validados/` en NextCloud (via WebDAV)
    - Cambiar estado del formulario a "validado"
    - Si tiene precio automatico -> enviar cotizacion al cliente
    - Si no -> marcar para cotizacion manual
  - Al rechazar:
    - Notificar al cliente por WA: "Tu imagen necesita ajustes: [motivo]"
    - Cambiar estado a "imagen_rechazada"

#### 13.4 - Estados del formulario ampliados
```sql
-- Nuevos estados para el flujo completo
-- 'nuevo' -> 'imagen_validada' -> 'cotizado' -> 'pago_pendiente'
-- -> 'pago_validado' -> 'en_produccion' -> 'listo' -> 'entregado'
-- Ramas: 'imagen_rechazada', 'cotizacion_rechazada', 'cancelado'

ALTER TABLE formularios ADD COLUMN estado_detallado TEXT DEFAULT 'nuevo';
ALTER TABLE formularios ADD COLUMN cotizacion_monto REAL;
ALTER TABLE formularios ADD COLUMN cotizacion_detalle JSONB;
ALTER TABLE formularios ADD COLUMN tipo_impresion TEXT;
ALTER TABLE formularios ADD COLUMN cantidad REAL;
ALTER TABLE formularios ADD COLUMN validado_por TEXT;
ALTER TABLE formularios ADD COLUMN validado_at TIMESTAMPTZ;
ALTER TABLE formularios ADD COLUMN comprobante_url TEXT;
ALTER TABLE formularios ADD COLUMN op_id UUID; -- link a orden de produccion
```

---

### FASE 14: Comprobante de Pago + Validacion
**Objetivo:** Recibir comprobante por chat o email, validarlo, y avanzar el flujo.

#### 14.1 - Flujo de comprobante por WhatsApp
```
[Despues de enviar cotizacion y cliente acepta]
Bot: "Perfecto! Los datos para transferencia son:
     Banco: BancoEstado
     Tipo: Cuenta Corriente
     N: XXXXXXX
     RUT: XX.XXX.XXX-X
     Nombre: Servicios Graficos SpA
     Email: pagos@printup.cl
     Monto: $60.000

     Cuando hagas la transferencia, enviane
     el comprobante por aqui (foto o PDF)."

[Cliente envia imagen]
Bot: "Recibimos tu comprobante! Lo estamos verificando.
     Te confirmaremos en breve."

-> Notificacion a PrintUp (email + WA)
-> Guardar imagen en Supabase Storage
-> Mostrar en admin para validacion
```

#### 14.2 - Panel de validacion de pago en admin
- En la vista del formulario/pedido:
  - Ver comprobante (imagen/PDF)
  - Boton **Validar pago** / **Rechazar pago**
  - Al validar:
    - Cambiar estado a `pago_validado`
    - Notificar cliente: "Pago confirmado! Tu pedido esta en produccion."
    - Auto-generar OP (Fase 15)
  - Al rechazar:
    - Notificar cliente: "No pudimos verificar tu pago. [motivo]"

#### 14.3 - Recepcion de comprobante por email
- Configurar Resend Inbound Email (disponible desde 2025)
- Parsear emails entrantes a `pagos@printup.cl`
- Extraer adjunto y asociar al pedido por numero o email del cliente

---

### FASE 15: Orden de Produccion (OP) Digital
**Objetivo:** Generar OP automaticamente, imprimirla, y trackear produccion.

#### 15.1 - Tabla de ordenes de produccion
```sql
CREATE TABLE ordenes_produccion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_op SERIAL,
  formulario_id UUID REFERENCES formularios(id),
  pedido_id UUID REFERENCES pedidos(id),
  cliente_nombre TEXT NOT NULL,
  cliente_telefono TEXT,
  cliente_email TEXT,

  -- Detalles del trabajo
  tipo_impresion TEXT NOT NULL, -- dtf_textil, dtf_uv, sublimacion, etc.
  descripcion TEXT,
  cantidad REAL,
  dimensiones TEXT, -- "60cm x 3m"
  material TEXT,
  acabado TEXT, -- mate, brillante, etc.
  colores TEXT,
  archivo_diseno_url TEXT,
  archivo_validado BOOLEAN DEFAULT false,

  -- Cotizacion
  precio_unitario REAL,
  subtotal REAL,
  descuento REAL DEFAULT 0,
  total REAL,

  -- Produccion
  estado TEXT DEFAULT 'pendiente',
  -- pendiente -> en_cola -> imprimiendo -> acabado -> control_calidad -> listo -> entregado
  prioridad TEXT DEFAULT 'normal', -- urgente, normal, baja
  fecha_compromiso DATE,
  notas_produccion TEXT, -- campo manual para llenar en la OP impresa
  operador TEXT, -- quien ejecuta

  -- Entrega
  tipo_entrega TEXT, -- retiro_tienda, despacho
  direccion_envio JSONB,
  zona_envio TEXT,

  -- Tracking
  nextcloud_deck_card_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completado_at TIMESTAMPTZ
);
```

#### 15.2 - Generacion automatica de OP
- Trigger: cuando se valida el pago O cuando admin lo decide manualmente
- Pre-llenar con datos de la cotizacion/formulario
- Campos que quedan en blanco para llenar a mano:
  - `notas_produccion` (observaciones al imprimir)
  - `operador` (quien lo ejecuta)
  - Checkboxes de control de calidad

#### 15.3 - PDF de la OP
```typescript
// src/app/api/admin/op/[id]/pdf/route.ts
// Genera PDF con @react-pdf/renderer

// Layout de la OP:
// - Header: Logo PrintUp + N de OP + Fecha
// - Datos cliente: Nombre, telefono, email, tipo entrega
// - Datos del trabajo: tipo, cantidad, dimensiones, material
// - Precios: unitario, subtotal, descuento, total
// - Zona manual: notas de produccion (lineas en blanco para escribir)
// - Zona manual: checkboxes de calidad
// - Footer: firma operador + firma cliente (si retira)
// - Codigo QR con link a la OP en el admin
```

#### 15.4 - Historial de OPs en admin
- Nueva ruta: `/admin/produccion`
- Lista de OPs con filtros: estado, fecha, tipo impresion, prioridad
- Vista detalle con timeline de cambios de estado
- Boton "Imprimir OP" -> abre PDF en nueva pestana
- Boton "Marcar como listo" -> notifica al cliente

#### 15.5 - Tarjeta de contacto por pedido
- Al generar OP, generar mini-tarjeta imprimible (formato pequeno):
  - Nombre del cliente
  - Telefono / email
  - N de OP / Pedido
  - Tipo de entrega
  - "Gracias por tu compra - PrintUp"
- PDF separado o incluido al final de la OP

---

### FASE 16: Integracion NextCloud Deck (Kanban de Produccion)
**Objetivo:** Cada OP genera automaticamente una tarjeta en el tablero Deck.

#### 16.1 - Crear board y listas en Deck
- Board: "Produccion PrintUp"
- Listas (columnas):
  - En Cola
  - Imprimiendo
  - Acabado
  - Control Calidad
  - Listo para Entregar
  - Entregado

#### 16.2 - API de NextCloud Deck
```typescript
// src/lib/nextcloud-deck.ts

const DECK_API = `${NEXTCLOUD_URL}/index.php/apps/deck/api/v1.0`;

// Crear tarjeta cuando se genera OP
async function crearTarjetaDeck(op: OrdenProduccion): Promise<string> {
  const card = await fetch(`${DECK_API}/boards/{boardId}/stacks/{stackId}/cards`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${user}:${pass}`)}`,
      'Content-Type': 'application/json',
      'OCS-APIREQUEST': 'true',
    },
    body: JSON.stringify({
      title: `OP #${op.numero_op} - ${op.cliente_nombre}`,
      description: `Tipo: ${op.tipo_impresion}\nCantidad: ${op.cantidad}\nEntrega: ${op.fecha_compromiso}`,
      duedate: op.fecha_compromiso,
    }),
  });
  return card.id;
}

// Mover tarjeta cuando cambia estado de la OP
async function moverTarjetaDeck(cardId: string, nuevoStack: string): Promise<void> {
  // PUT /boards/{boardId}/stacks/{stackId}/cards/{cardId}/reorder
}
```

#### 16.3 - Sincronizacion bidireccional
- Cuando se mueve la tarjeta en Deck -> webhook -> actualizar estado de OP en Supabase
- Cuando se cambia estado en admin -> mover tarjeta en Deck
- Cron job cada 5 min como fallback de sincronizacion

---

### FASE 17: Bot Proactivo (Notificaciones de Etapas)
**Objetivo:** El bot informa automaticamente al cliente cada cambio de estado.

#### 17.1 - Mensajes automaticos por etapa
```typescript
const MENSAJES_ETAPA: Record<string, string> = {
  'imagen_validada':
    'Tu imagen ha sido aprobada! Estamos preparando tu cotizacion.',
  'cotizado':
    'Tu cotizacion esta lista:\n{detalle_cotizacion}\n\nResponde 1 para aceptar o 2 para modificar.',
  'pago_pendiente':
    'Los datos para transferencia son:\n{datos_banco}\n\nEnvianos el comprobante por aqui.',
  'pago_validado':
    'Pago confirmado! Tu pedido OP #{numero_op} esta en produccion.\nTiempo estimado: {dias} dias habiles.',
  'en_produccion':
    'Tu pedido esta siendo procesado.',
  'listo':
    'Tu pedido esta listo!\n{instrucciones_entrega}',
  'enviado':
    'Tu pedido ha sido despachado! Seguimiento: {tracking}',
  'entregado':
    'Pedido entregado! Gracias por confiar en PrintUp.\nDejanos tu opinion: printup.cl/review/{id}',
};
```

#### 17.2 - Supabase Database Webhook
```sql
-- Trigger en formularios y ordenes_produccion
CREATE OR REPLACE FUNCTION notify_estado_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado_detallado IS DISTINCT FROM NEW.estado_detallado THEN
    PERFORM net.http_post(
      url := 'https://printup.cl/api/webhooks/estado-change',
      body := json_build_object(
        'tabla', TG_TABLE_NAME,
        'id', NEW.id,
        'estado_anterior', OLD.estado_detallado,
        'estado_nuevo', NEW.estado_detallado
      )::text
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

#### 17.3 - Consulta de estado mejorada
- Cliente pregunta "estado de mi pedido":
  - Si tiene conversacion activa, buscar por telefono automaticamente
  - Mostrar estado actual con barra de progreso visual (emoji-based):
    ```
    Tu pedido OP #1042:
    [=====-----] En produccion (60%)

    Recibido -> Validado -> Cotizado -> Pagado -> EN PRODUCCION -> Listo -> Entregado
    ```

---

### FASE 18: Panel Admin Unificado de Flujo
**Objetivo:** Vista integrada en el admin donde PrintUp gestiona todo el ciclo.

#### 18.1 - Dashboard de operaciones `/admin/operaciones`
- Vista kanban (estilo Trello) con las OPs
  - Columnas: Pendiente | Validando | Cotizado | Pagado | Produccion | Listo | Entregado
  - Drag & drop para cambiar estado
  - Cada tarjeta muestra: cliente, tipo, monto, fecha compromiso
  - Colores por prioridad (rojo=urgente, amarillo=normal, verde=sin apuro)

#### 18.2 - Acciones rapidas desde la tarjeta
- Click en tarjeta -> modal con:
  - Imagen del diseno (con link a NextCloud)
  - Datos del cliente
  - Botones: Validar imagen | Enviar cotizacion | Validar pago | Imprimir OP
  - Chat integrado (ver conversacion del cliente inline)
  - Timeline de eventos

#### 18.3 - Metricas de operaciones
- OPs pendientes / en proceso / completadas hoy
- Tiempo promedio por etapa
- Ingresos del dia/semana/mes
- Alertas: formularios sin revisar hace +24h, pagos sin validar

---

### FASE 19: Retiro vs Delivery + Zonas
**Objetivo:** Automatizar la logica de entrega.

#### 19.1 - En el flujo del bot
```
Bot: "Como prefieres recibir tu pedido?"
     1. Retiro en local (Errazuriz 09, Donihue)
     2. Despacho a domicilio

[Si elige despacho]
Bot: "A que comuna?"
Cliente: "Rancagua"

Bot: "Despacho a Rancagua: $3.500
     Dias de despacho: Miercoles y Viernes
     Envio gratis sobre $50.000

     Tu pedido de $60.000 tiene ENVIO GRATIS!
     Confirmas?"

[Si elige retiro]
Bot: "Puedes retirar en:
     Errazuriz 09, Donihue
     Lunes a Viernes 9:00 - 18:00
     Te avisaremos cuando este listo."
```

#### 19.2 - Usar tabla `zonas_envio` existente
- Ya tienen la tabla con comunas, precios y dias de despacho
- El bot consulta automaticamente y calcula

---

### FASE 20: Claude como Asesor Interno
**Objetivo:** PrintUp puede pedirle a Claude recomendaciones desde el admin.

#### 20.1 - Chat con Claude en admin `/admin/asistente`
- Input tipo chat donde PrintUp puede preguntar:
  - "Cuantos dias necesito para 50 metros de DTF?"
  - "Que material recomiendas para stickers de exterior?"
  - "Armame una cotizacion para 100 poleras sublimadas"
- Claude tiene contexto de:
  - Planillas de precios
  - Productos del catalogo
  - Tiempos de produccion
  - Historial de pedidos

#### 20.2 - Sugerencias automaticas
- Al revisar un formulario, Claude sugiere:
  - Precio estimado basado en la imagen y especificaciones
  - Material recomendado
  - Tiempo de produccion
  - Posibles upsells ("por $5.000 mas puedes ofrecer acabado premium")

---

## 4. Diagrama del Flujo Automatizado Completo

```
CLIENTE                          BOT/SISTEMA                        PRINTUP ADMIN
-------                          -----------                        -------------
Envia msg RRSS ──────────────> Webhook Meta recibe
                                Detecta si es nuevo
                                Si nuevo: onboarding ─────────────> [nada aun]
                                (persona/empresa, datos)
                                Guarda en BD clientes

Responde datos ──────────────> Registra cliente
                                Envia menu principal

"Quiero cotizar" ────────────> Inicia flujo cotizacion
                                Pregunta: tipo, cantidad,
                                diseno, urgencia

Responde todo ───────────────> Calcula precio automatico
                                Envia cotizacion formal
                                                                    Notificacion:
                                                                    nueva cotizacion
                                                                    (email + WA)

"Si, acepto" ────────────────> Envia datos bancarios
                                Cambia estado: pago_pendiente

Envia comprobante ───────────> Guarda imagen
                                "Verificando pago..."
                                                                    Notificacion:
                                                                    comprobante recibido
                                                                    [Admin valida pago]

                                                                    Click "Validar pago"
                              <──────────────────────────────────── Estado: pago_validado
Auto-genera OP
"Pago confirmado!              Auto-crea tarjeta Deck
En produccion."                Auto-genera PDF de OP
                                                                    Imprime OP

                                                                    [Produce el trabajo]
                                                                    Mueve en Deck/Admin

                              <──────────────────────────────────── Estado: listo
"Tu pedido esta listo!
Retira en: [dir] / Despachado"

"Entregado! Gracias ──────────> Review request
 por tu compra"
```

---

## 5. Prioridades de Implementacion

| Orden | Fase | Impacto | Dependencias |
|-------|------|---------|-------------|
| 1 | **Fase 11** - Bot Unificado | Critico | Ninguna |
| 2 | **Fase 12** - Cotizacion Automatica | Alto | Fase 11 |
| 3 | **Fase 13** - Formulario + Validacion | Alto | Fase 11 |
| 4 | **Fase 14** - Comprobante de Pago | Alto | Fase 13 |
| 5 | **Fase 17** - Bot Proactivo (etapas) | Alto | Fases 11-14 |
| 6 | **Fase 15** - OP Digital + PDF | Medio-Alto | Fase 14 |
| 7 | **Fase 18** - Panel Admin Unificado | Medio-Alto | Fase 15 |
| 8 | **Fase 16** - NextCloud Deck | Medio | Fase 15 |
| 9 | **Fase 19** - Retiro vs Delivery | Medio | Fase 12 |
| 10 | **Fase 20** - Claude Asesor | Nice-to-have | Fase 11 |

---

## 6. Costos Estimados Mensuales

| Servicio | Plan | Costo |
|----------|------|-------|
| Meta WhatsApp Cloud API | Per-message (~100 msgs/dia) | ~$5-15 USD/mes |
| Claude API (Haiku 4.5) | ~500 clasificaciones + 50 consultas/dia | ~$5-10 USD/mes |
| Resend | Free tier (3,000/mes) o Pro si crece | $0-20 USD/mes |
| Supabase | Free tier (suficiente) o Pro si crece | $0-25 USD/mes |
| NextCloud | Ya self-hosted | $0 |
| **Total estimado** | | **$10-70 USD/mes** |

---

## 7. Fuentes de Investigacion

- [WhatsApp Cloud API - Guia completa](https://gurusup.com/blog/whatsapp-cloud-api)
- [WhatsApp Business API 2026 - Setup y BSP](https://www.messagecentral.com/blog/whatsapp-business-api-complete-guide)
- [WhatsApp Chatbot Enterprise Guide](https://gurusup.com/blog/chatbot-whatsapp-business-api)
- [Meta Business Messaging - Developers](https://developers.facebook.com/documentation/business-messaging/whatsapp/overview)
- [Meta WhatsApp Webhooks](https://www.mercadopago.cl/developers/en/docs/checkout-api/additional-content/your-integrations/notifications/webhooks)
- [Resend + Next.js](https://resend.com/nextjs)
- [Supabase Database Webhooks](https://supabase.com/docs/guides/database/webhooks)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [NextCloud Deck API](https://deck.readthedocs.io/)
- [NextCloud Deck GitHub](https://github.com/nextcloud/deck)
- [Claude API Business Automation Guide](https://samuelbrahem.com/blog/claude-ai-business-automation-guide)
- [n8n WhatsApp Automation](https://n8n.io/integrations/whatsapp-business-cloud/)
- [MercadoPago Webhooks Chile](https://www.mercadopago.cl/developers/en/docs/checkout-api-payments/additional-content/your-integrations/notifications/webhooks)
- [Botpress - Open Source Chatbot](https://botpress.com/blog/top-whatsapp-chatbots)
- [10 Best AI Chatbots 2026](https://ainisa.com/en/blog/64-10-best-ai-chatbots-for-business-in-2026-reviewed-and-compared)
