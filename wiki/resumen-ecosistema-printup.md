# PrintUp - Resumen del Ecosistema Completo

> Para: Daniela | Fecha: Mayo 2026

---

## Que es lo que tiene PrintUp ahora?

Tu negocio tiene una **plataforma digital completa** que funciona como un ecosistema integrado en 6 fases. Todo se maneja desde un solo lugar: tu panel de administracion en `/admin`.

---

## 1. TIENDA ONLINE (printup.cl)

Lo que ven tus clientes cuando entran a la pagina:

### Pagina de inicio
- **Hero principal** con imagen destacada, slogan y boton de llamado a la accion
- **Seccion de categorias** con acceso rapido a cada linea de productos
- **Productos destacados** seleccionados desde el admin
- **Trabajos recientes** con fotos de ejemplos reales
- **Logos de clientes** que han trabajado con PrintUp
- **Como funciona**: pasos simples explicando el proceso de compra o encargo

### Catalogo de productos
- Busqueda por nombre o descripcion
- Filtros por categoria
- Paginacion para navegar entre muchos productos
- Vista de grilla con foto, nombre, precio y boton de favorito

### Pagina de cada producto
- Galeria de fotos con imagen principal y miniaturas
- Variantes configurables (talla, color, tamanio) con precios diferenciados
- Tabs con informacion organizada:
  - **Descripcion**: detalle del producto
  - **Especificaciones**: ficha tecnica y datos tecnicos
  - **Envio**: zonas, plazos y costos
  - **Preguntas**: seccion de preguntas y respuestas de otros clientes
- Stock disponible en tiempo real
- Boton de agregar al carrito y a favoritos

### Carrito de compras
- Modificar cantidades o eliminar productos
- Elegir retiro en tienda o despacho a domicilio
- Calculadora de costo de envio segun la comuna ingresada
- Resumen claro del total antes de pagar

### Checkout
- Formulario con datos del cliente (nombre, email, telefono)
- Formulario de direccion de envio
- Seleccion del metodo de pago
- Opcion de suscribirse al newsletter
- Resumen del pedido antes de confirmar

### Pagina de confirmacion de pago
- Muestra si el pago fue exitoso, pendiente o fallido
- En caso de fallo, boton para reintentar sin perder el pedido

### Cuentas de usuario
- Registro con nombre, email, telefono y contrasena
- Login y cierre de sesion
- **Mi Cuenta** con:
  - Historial completo de pedidos
  - Datos personales editables
  - Direcciones guardadas para compras futuras

### Favoritos (wishlist)
- Icono de corazon en cada producto
- Lista de favoritos guardados en la cuenta del cliente
- Facil agregar o quitar productos

### Portafolio publico (/portafolio)
- Galeria de trabajos reales de PrintUp
- Filtros por categoria de trabajo
- Lightbox para ver las fotos en grande
- Llamado a la accion para solicitar un trabajo similar

### Pagina Sobre Nosotros (/nosotros)
- Historia de PrintUp
- Servicios que ofrece la empresa
- Horarios de atencion
- Mapa de ubicacion

### Paginas legales
- Politica de envio
- Politica de devoluciones
- Politica de privacidad

### Otras funciones de la tienda
- **Pagina 404 personalizada** con buscador para que el cliente no se pierda
- **Barra de newsletter** en el footer para suscribirse
- **Boton flotante de WhatsApp** visible en todas las paginas (esquina inferior derecha)
- **Popup de prueba social** (esquina inferior izquierda): muestra compras recientes de otros clientes para generar confianza
- **Google Analytics 4**: seguimiento de visitas, comportamiento y conversiones

### Categorias de productos:
- Articulos Publicitarios (tazones, botellas, bolsas)
- Grafica Publicitaria (adhesivos, foam board, impresiones)
- Poleras Personalizadas (DTF y DTG)
- Transferibles (DTF textil y UV)
- Pendones y Banderas

---

## 2. PAGOS

Tres formas de pago disponibles para tus clientes:

- **MercadoPago**: Pago con tarjeta de credito, debito o cuenta MercadoPago. El cliente es redirigido a MercadoPago y al volver la pagina confirma el resultado. Si falla, puede reintentar sin perder el carrito.
- **Transferencia Bancaria**: Se muestran los datos de Servicios Graficos Spa para que el cliente transfiera y confirme por WhatsApp.
- **Pago al Retirar**: Para clientes que retiran en tienda, pagan en efectivo o tarjeta al momento de retirar.

Cuando un pago por MercadoPago se confirma, el sistema automaticamente actualiza el estado del pedido y envia un email de confirmacion al cliente gracias al **webhook automatico**.

### Cupones de descuento
- Crear codigos de descuento desde el admin
- Tipos disponibles: porcentaje de descuento, monto fijo o envio gratis
- Fechas de vigencia (desde/hasta)
- Limite maximo de usos por cupon

---

## 3. FORMULARIO DE CONTACTO Y ARCHIVOS

El sistema original que ya conoces:

- Los clientes suben sus archivos de diseno (hasta 5 archivos, 50MB cada uno)
- Llega un email de notificacion a tu correo
- Los archivos se sincronizan automaticamente a tu NextCloud local
- Todo queda registrado en el historial del panel de administracion

---

## 4. PANEL DE ADMINISTRACION (/admin)

Tu centro de control. Accedes con usuario y contrasena.

### Dashboard
- Ventas del dia y del mes
- Pedidos pendientes de atencion
- Formularios recibidos
- Grafico de ventas de los ultimos 7 dias
- Lista de ultimos pedidos y formularios recientes

---

### Seccion TIENDA

#### Pedidos
- Lista completa de pedidos con filtros por estado (pendiente, confirmado, preparando, enviado, entregado, cancelado)
- Busqueda por nombre o email del cliente
- Filtro por rango de fechas
- Detalle completo de cada pedido: datos del cliente, productos, direccion de envio, timeline de estados
- Cambiar estado del pedido (envia email automatico al cliente)
- Boton de WhatsApp para contactar directamente al cliente
- Exportar pedidos a CSV (compatible con Excel)

#### Productos
- Crear, editar y eliminar productos
- Subir y gestionar imagenes del producto
- Configurar variantes (talla, color, tamanio) con precios diferenciados
- Control de stock y stock minimo para alertas
- Marcar productos como destacados en la pagina de inicio
- SEO: titulo y descripcion optimizados para Google
- Campo para URL de ficha tecnica descargable

#### Categorias
- Crear, editar y eliminar categorias
- Ver cuantos productos tiene cada categoria

#### Inventario
- Vista completa del stock de todos los productos en un solo lugar
- Alertas visuales de stock bajo o agotado
- Edicion rapida de cantidades sin entrar a cada producto

#### Cupones
- Crear, editar y eliminar cupones de descuento
- Configurar tipo (porcentaje, monto fijo, envio gratis), fechas y usos maximos
- Ver cuantas veces se ha usado cada cupon

#### Reviews
- Lista de todas las resenas dejadas por clientes
- Aprobar o rechazar antes de que se publiquen en la tienda
- Filtros por estado (pendiente, aprobada, rechazada)

#### Preguntas (Q&A)
- Lista de preguntas que los clientes hacen sobre los productos
- Ver preguntas pendientes de respuesta y las ya respondidas
- Responder desde el admin y publicar en la pagina del producto

---

### Seccion FORMULARIOS

- Historial completo de formularios recibidos con archivos adjuntos

---

### Seccion MARKETING

#### Newsletter
- Lista de suscriptores con buscador
- Estadisticas de suscripciones
- Envio masivo de emails a toda la lista usando Resend

#### Portafolio
- Crear, editar y eliminar trabajos del portafolio con fotos
- Crear, editar y eliminar clientes destacados con sus logos para la pagina de inicio

---

### Seccion SISTEMA

#### Contactos (CRM basico)
- Lista unificada de todos tus clientes (de pedidos y de formularios)
- Ver historial de cada cliente: que ha pedido y que formularios ha enviado
- Boton de WhatsApp directo desde la ficha

#### Envios
- Configurar zonas de despacho con comunas, precio, envio gratis desde cierto monto
- Dias de despacho disponibles y tiempos estimados

#### Configuracion
Seis pestanas con todas las opciones del sistema:
- **Tienda**: Nombre, slogan, logo, descripcion, redes sociales
- **Pagos**: Credenciales de MercadoPago y datos bancarios para transferencia
- **WhatsApp**: Numero, mensaje predeterminado, activar/desactivar boton flotante
- **Email**: Proveedor Resend, API Key, remitente, email de notificaciones
- **NextCloud**: URL del servidor, usuario, contrasena, carpeta de destino
- **General**: Email de notificaciones, limites de archivos, Google Analytics 4, activar/desactivar popup de prueba social

---

### Seccion AUTOMATIZACION

#### WhatsApp Bot
- Configurar respuestas automaticas para preguntas frecuentes (saludo, catalogo, precios, estado de pedido, horario, ubicacion)
- Modo IA: respuestas inteligentes segun el contexto
- Registro de conversaciones para seguimiento

---

## 5. WHATSAPP

- **Boton flotante** verde en todas las paginas de la tienda (esquina inferior derecha)
- Al hacer click, abre WhatsApp con un mensaje predeterminado personalizable
- **Bot con respuestas automaticas** para:
  - Saludo inicial
  - Informacion del catalogo
  - Consultas de precios
  - Estado de un pedido
  - Horario de atencion
  - Ubicacion de la tienda
- Panel de configuracion completo en el admin
- Cada pedido tiene boton para contactar al cliente por WhatsApp directamente

---

## 6. EMAILS AUTOMATICOS

El sistema envia emails automaticamente en estos momentos:

- **Nuevo pedido**: Email al admin con todos los detalles del pedido
- **Confirmacion al cliente**: Email al cliente con resumen del pedido. Si pago por transferencia, incluye los datos bancarios.
- **Pago confirmado (MercadoPago)**: Email al cliente cuando MercadoPago confirma el pago
- **Cambio de estado**: Cuando cambias el estado en el admin (confirmado, preparando, enviado, entregado), el cliente recibe un aviso automatico
- **Formulario recibido**: Notificacion al admin cuando llega un formulario nuevo con archivos
- **Newsletter masivo**: Envio a todos los suscriptores desde la seccion Marketing del admin

---

## 7. DESPACHO

- **Zona 1**: Coltauco, Donihue, Coinco, Lo Miranda - $3.500
- **Zona 2**: Olivar, Rancagua, Machali - $4.500
- **Envio gratis** en pedidos sobre $50.000
- Despachos los **miercoles y viernes**
- **Retiro en tienda**: siempre disponible y sin costo

---

## 8. CUENTAS DE CLIENTES

Los clientes pueden crear su cuenta en la tienda:

- **Registro**: nombre, email, telefono y contrasena
- **Login** seguro con Supabase Auth
- **Mi Cuenta** incluye:
  - Historial completo de pedidos con estado actual
  - Edicion de datos personales
  - Direcciones guardadas para reutilizar en proximas compras
- **Favoritos / Wishlist**: guardar productos de interes
- **Reviews**: dejar resenas en productos comprados (quedan pendientes de aprobacion)
- **Preguntas**: hacer preguntas publicas sobre un producto
- **Newsletter**: opcion de suscribirse al registrarse o en el checkout

---

## 9. SEO Y MARKETING

La tienda esta preparada para que Google la encuentre y para atraer clientes:

- **Sitemap automatico**: lista actualizada de todas las paginas y productos para Google
- **Titulos y descripciones** optimizados en cada pagina y producto
- **Datos estructurados JSON-LD**: Google entiende que es un producto, con su nombre, precio, disponibilidad y foto
- **robots.txt**: indica a Google que indexar (tienda) y que ignorar (admin, API)
- **Google Analytics 4**: medicion de visitas, origen del trafico, comportamiento y ventas
- **Newsletter**: los clientes se suscriben desde el footer, el checkout o al registrarse
- **Popup de prueba social**: muestra compras recientes en tiempo real para generar confianza
- **Portafolio publico**: muestra trabajos reales que posicionan en busquedas por tipo de producto

---

## 10. NEXTCLOUD

Tu servidor local sincroniza automaticamente con la tienda:

- Los archivos subidos por los clientes en el formulario de contacto se copian a tu NextCloud
- Los pedidos se guardan como archivos JSON en NextCloud para respaldo
- La integracion se configura desde el admin (Configuracion > NextCloud)

---

## Datos tecnicos (para referencia)

| Componente | Tecnologia |
|---|---|
| Frontend | Next.js 16, React 19, Tailwind CSS v4 |
| Base de datos | Supabase (PostgreSQL) |
| Pagos | MercadoPago SDK |
| Emails | Resend |
| Almacenamiento | Supabase Storage + NextCloud |
| Autenticacion | Supabase Auth (clientes) + JWT (admin) |
| Hosting | Vercel |
| Dominio | printup.cl |
| Analytics | Google Analytics 4 |
