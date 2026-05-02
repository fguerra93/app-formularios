# PrintUp - Resumen del Ecosistema Completo

> Para: Daniela | Fecha: Mayo 2026

---

## Que es lo que tiene PrintUp ahora?

Tu negocio tiene una **plataforma digital completa** que funciona como un ecosistema integrado. Todo se maneja desde un solo lugar: tu panel de administracion.

---

## 1. TIENDA ONLINE (printup.cl)

Lo que ven tus clientes cuando entran a la pagina:

- **Pagina de inicio** con tus productos destacados, categorias y llamados a la accion
- **Catalogo de productos** con busqueda, filtros por categoria y ordenamiento
- **Pagina de cada producto** con fotos, precio, variantes (talla, color, tamanio), stock disponible y boton de agregar al carrito
- **Carrito de compras** donde el cliente puede modificar cantidades, elegir retiro en tienda o despacho a domicilio, y ver el costo de envio en tiempo real
- **Checkout completo** con formulario de datos del cliente, direccion de envio y seleccion de metodo de pago
- **Pagina "Sobre Nosotros"** con la historia de PrintUp, servicios, horario y mapa de ubicacion

### Categorias actuales:
- Articulos Publicitarios (tazones, botellas, bolsas)
- Grafica Publicitaria (adhesivos, foam board, impresiones)
- Poleras Personalizadas (DTF y DTG)
- Transferibles (DTF textil y UV)
- Pendones y Banderas

---

## 2. PAGOS

Tres formas de pago disponibles para tus clientes:

- **MercadoPago**: Pago con tarjeta de credito/debito o cuenta MercadoPago. El cliente es redirigido a MercadoPago y al volver la pagina muestra si el pago fue exitoso, fallo o esta pendiente. Si falla, puede reintentar.
- **Transferencia Bancaria**: Se muestran los datos de Servicios Graficos Spa para que el cliente transfiera y confirme por WhatsApp.
- **Pago al Retirar**: Para clientes que retiran en tienda, pagan en efectivo o tarjeta al retirar.

Cuando un pago por MercadoPago se confirma, el sistema automaticamente actualiza el estado del pedido y envia un email de confirmacion al cliente.

---

## 3. FORMULARIO DE CONTACTO Y ARCHIVOS

El sistema original que ya conoces:

- Los clientes suben sus archivos de diseno (hasta 5 archivos, 50MB cada uno)
- Llega un email de notificacion a tu correo
- Los archivos se sincronizan automaticamente a tu NextCloud local
- Todo queda registrado en el panel de administracion

---

## 4. PANEL DE ADMINISTRACION (/admin)

Tu centro de control. Accedes con usuario y contrasena.

### Dashboard
- Ventas del dia y del mes
- Pedidos pendientes
- Formularios recibidos
- Graficos de ventas de los ultimos 7 dias
- Ultimos pedidos y formularios

### Gestion de Pedidos
- Lista completa de pedidos con filtros por estado (pendiente, confirmado, preparando, enviado, entregado, cancelado)
- Busqueda por nombre o email
- Filtro por rango de fechas
- Ver detalle completo: datos del cliente, items, direccion, timeline de estados
- Cambiar estado del pedido (envia email automatico al cliente)
- Boton de WhatsApp para contactar al cliente
- Exportar a CSV (Excel)

### Gestion de Productos
- Crear, editar y eliminar productos
- Subir imagenes de productos
- Configurar variantes (talla, color, tamanio) con precios diferenciados
- Control de stock y stock minimo
- Marcar productos como destacados
- SEO: titulo y descripcion para Google

### Categorias
- Crear, editar y eliminar categorias
- Ver cuantos productos tiene cada categoria

### Inventario
- Vista completa del stock de todos los productos
- Alertas de stock bajo y agotado
- Edicion rapida de cantidades

### Contactos (CRM basico)
- Lista unificada de todos tus clientes (de pedidos y formularios)
- Ver historial de cada cliente: que ha pedido y que formularios ha enviado
- Boton de WhatsApp directo

### Zonas de Envio
- Configurar zonas con comunas, precio de envio, envio gratis desde cierto monto
- Dias de despacho y horario

### Configuracion
- **Tienda**: Nombre, slogan, logo, redes sociales
- **Pagos**: Credenciales de MercadoPago + datos bancarios para transferencia
- **WhatsApp**: Numero, mensaje predeterminado, activar/desactivar boton flotante
- **Email**: Proveedor (Resend), API Key, remitente
- **NextCloud**: URL, usuario, contrasena, carpeta
- **General**: Email de notificaciones, limites de archivos

---

## 5. WHATSAPP

- **Boton flotante** en todas las paginas de la tienda (esquina inferior derecha, verde)
- Al hacer click, abre WhatsApp con un mensaje predeterminado
- En la confirmacion de pedido, el cliente puede contactar directo por WhatsApp
- En el admin, cada pedido tiene boton para contactar al cliente por WhatsApp

---

## 6. EMAILS AUTOMATICOS

El sistema envia emails automaticamente en estos momentos:

- **Nuevo pedido**: Email al admin con los detalles del pedido
- **Confirmacion al cliente**: Email al cliente con resumen del pedido y datos de transferencia
- **Pago confirmado (MercadoPago)**: Email al cliente confirmando el pago
- **Cambio de estado**: Cuando cambias el estado del pedido (confirmado, enviado, entregado), el cliente recibe un email
- **Formulario recibido**: Notificacion al admin cuando llega un formulario nuevo

---

## 7. DESPACHO

- Dos zonas configuradas:
  - **Zona 1**: Coltauco, Donihue, Coinco, Lo Miranda - $3.500
  - **Zona 2**: Olivar, Rancagua, Machali - $4.500
- **Envio gratis** sobre $50.000
- Despachos los **miercoles y viernes**
- Opcion de **retiro en tienda** (gratis)

---

## 8. SEO (Posicionamiento en Google)

La tienda esta optimizada para que Google la encuentre:

- **Sitemap automatico**: Lista de todas las paginas y productos para que Google las indexe
- **Titulos y descripciones** optimizados en cada pagina
- **Datos estructurados**: Google entiende que cada producto tiene nombre, precio, disponibilidad y foto
- **robots.txt**: Le indica a Google que paginas indexar y cuales no (admin, API)

---

## Datos tecnicos (para referencia)

| Componente | Tecnologia |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS |
| Base de datos | Supabase (PostgreSQL) |
| Pagos | MercadoPago SDK |
| Emails | Resend |
| Almacenamiento | Supabase Storage + NextCloud |
| Hosting | Vercel |
| Dominio | printup.cl |
