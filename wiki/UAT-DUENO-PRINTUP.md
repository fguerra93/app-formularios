# UAT — Aceptación del dueño · PrintUp Sandbox

> Guion paso a paso para que el dueño valide TODO el sandbox de punta a punta.
> Marca cada casilla. Anota hallazgos en la columna de notas. Al final, decide
> si se queda en sandbox o se promueve a producción lean.
>
> URL sandbox: `__COMPLETAR_URL_CLOUD_RUN__` · Modo: `NEXT_PUBLIC_MODO=sandbox`
> (debe verse el banner de demo). Generado: Fase 10.

## 0. Preparación (una vez)

- [ ] Migraciones aplicadas en la BD (ver `deploy/README.md`, orden 1→8).
- [ ] Seed cargado (`seed-shopify-products.sql` + `seed-sandbox-demo.sql`).
- [ ] Crons agendados (`procesar-eventos`, `liberar-reservas`, `carritos-abandonados`).
- [ ] Webhook MercadoPago (TEST) apuntando a `…/api/pagos/webhook`.
- [ ] (Opcional bot) Webhook Meta apuntando a `…/api/webhooks/meta`.

---

## 1. Tienda (como cliente)

| # | Paso | OK | Notas |
|---|------|:--:|-------|
| 1.1 | La home carga con el **banner de sandbox** visible | ☐ | |
| 1.2 | Navegar catálogo y abrir un producto | ☐ | |
| 1.3 | Usar la **calculadora m²** en un producto dinámico | ☐ | |
| 1.4 | Agregar al carrito; aplicar cupón `BIENVENIDO10`; ver **desglose con IVA** | ☐ | |
| 1.5 | Registro / login de cliente | ☐ | |
| 1.6 | Marcar un favorito | ☐ | |
| 1.7 | Dejar una reseña y una pregunta en un producto | ☐ | |
| 1.8 | Checkout con **tarjeta TEST (APRO)** → pago aprobado | ☐ | |
| 1.9 | Checkout por **transferencia** → queda pendiente de validación | ☐ | |
| 1.10 | Llegan los emails (pedido + confirmación) | ☐ | |

## 2. Bot (como cliente, WhatsApp/IG — si está configurado)

| # | Paso | OK | Notas |
|---|------|:--:|-------|
| 2.1 | Mensaje **VERDE** (“¿cuál es el horario?”) → responde solo, correcto | ☐ | |
| 2.2 | Mensaje **AMARILLO** (“quiero cotizar 50 poleras DTF”) → pide cantidad, arma cotización y **NO** la envía: queda en `/admin/aprobaciones` | ☐ | |
| 2.3 | Mensaje **ROJO** (“ya pagué, confírmenme”) → escala a humano + notifica | ☐ | |

## 3. Admin (como dueño)

| # | Paso | OK | Notas |
|---|------|:--:|-------|
| 3.1 | Login en `/admin/login` (con `ADMIN_EMAIL`/`ADMIN_PASSWORD` la 1ª vez) | ☐ | |
| 3.2 | Ver el **pedido nuevo** en `/admin/pedidos` + campanita 🔔 con notificación | ☐ | |
| 3.3 | En `/admin/aprobaciones`: **aprobar** el pago de la transferencia → el pedido pasa a confirmado | ☐ | |
| 3.4 | En `/admin/aprobaciones`: **aprobar** la cotización del bot | ☐ | |
| 3.5 | Cambiar estado de un pedido (FSM): intentar un salto ilegal → **rechazado** | ☐ | |
| 3.6 | Ver el stock bajar y el **movimiento** en `/admin/inventario` (productos con control de stock) | ☐ | |
| 3.7 | Procesar una **devolución** → repone stock + nota de crédito (mock) | ☐ | |
| 3.8 | En `/admin/produccion`: mover la **OP** por el Kanban; al marcar “Listo” el cliente recibe aviso | ☐ | |
| 3.9 | **Imprimir** la OP (botón Imprimir → PDF del navegador) | ☐ | |
| 3.10 | Ver el **documento tributario** (mock) asociado al pedido pagado | ☐ | |
| 3.11 | Cliente 360: `GET /api/admin/clientes-360?email=…` muestra pedidos + valor histórico | ☐ | |
| 3.12 | Editar datos de empresa en `/admin/configuracion` | ☐ | |
| 3.13 | Crear un usuario **“vendedor”** en `/admin/usuarios`; iniciar sesión con él y verificar que **NO** ve `/admin/usuarios` ni `/admin/configuracion` (RBAC) | ☐ | |
| 3.14 | Revisar `GET /api/admin/audit`: registra estado de pedido, validación de pago, alta de usuario | ☐ | |

## 4. Robustez / seguridad (rápidas)

| # | Paso | OK | Notas |
|---|------|:--:|-------|
| 4.1 | Webhook MP con firma inválida → **401** (si `MERCADOPAGO_WEBHOOK_SECRET` está set) | ☐ | |
| 4.2 | Enviar el **mismo** webhook MP válido dos veces → el segundo no duplica (idempotencia) | ☐ | |
| 4.3 | Flood a `/api/pedidos` (>30/min) → empieza a responder **429** | ☐ | |
| 4.4 | Acceder a `/api/admin/*` sin sesión → **401/redirect** | ☐ | |
| 4.5 | Iniciar checkout y no pagar → tras el TTL, el cron libera el stock reservado | ☐ | |

## 5. Monitoreo

- [ ] Si hay `SENTRY_DSN`: forzar un error y verificar que aparece en Sentry.
- [ ] Sin DSN: los errores quedan en los logs de Cloud Run.

---

## Cierre

- [ ] El dueño completó el guion sin bloqueos. Hallazgos priorizados arriba.
- [ ] Cero errores nuevos críticos durante la UAT.
- [ ] **Decisión:** ☐ se queda en sandbox · ☐ se promueve a producción lean (~$15–30/mes)
      · ☐ se completa la **Parte 2B** (todo-GCP Cloud SQL) antes de producción.

### Costo confirmado del sandbox
- Cloud Run `min-instances=0` → ~$0 en reposo.
- Datos: Supabase Free $0 (Variante A) **o** Cloud SQL `db-f1-micro` ~$8 (Variante B).
