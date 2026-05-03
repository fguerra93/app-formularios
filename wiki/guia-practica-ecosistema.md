# PrintUp - Guia Practica del Ecosistema Completo

> Para: Daniela | Fecha: Mayo 2026
> Como sacarle el maximo provecho a cada sistema y automatizar la atencion al cliente

---

## VISION GENERAL

Tu ecosistema PrintUp tiene **10 sistemas integrados** que trabajan juntos. La clave es que muchos procesos son **automaticos** - los clientes se atienden solos mientras tu te concentras en producir.

**Flujo automatico del cliente:**
```
Cliente entra a printup.cl
  -> Ve productos, portafolio, reviews de otros clientes
  -> Agrega al carrito, aplica cupon
  -> Hace checkout (paga con MercadoPago/transferencia)
  -> Recibe email de confirmacion automatico
  -> Tu recibes email + notificacion
  -> Cambias estado del pedido -> cliente recibe email automatico
  -> Cliente ve su historial en "Mi Cuenta"
```

**Lo que NO necesitas hacer manualmente:**
- Responder "cuanto cuesta X" -> el catalogo tiene todo
- Responder "tienen stock?" -> el stock se muestra en tiempo real
- Confirmar pagos de MercadoPago -> el webhook lo hace solo
- Enviar emails de estado -> se envian al cambiar estado en admin
- Decir "siguenos en redes" -> el footer tiene todo
- Dar horario/ubicacion -> el bot de WhatsApp responde solo

---

## SISTEMA 1: TIENDA ONLINE

### Que hace
Es tu vitrina digital. Los clientes ven tus productos, precios, stock y compran sin necesidad de contactarte.

### Funciones practicas

| Funcion | Como te beneficia | Donde se configura |
|---------|-------------------|-------------------|
| Catalogo con busqueda | El cliente encuentra solo lo que busca | Admin > Productos |
| Variantes (talla, color) | No necesitas crear un producto por cada variante | Admin > Productos > Editar |
| Stock en tiempo real | Evita vender algo que no tienes | Admin > Inventario |
| Fotos de producto | El cliente ve exactamente que va a recibir | Admin > Productos > Imagenes |
| Precios visibles | No te preguntan "cuanto cuesta" | Admin > Productos > Precio |
| Reviews | Otros clientes convencen a los nuevos | Se generan solas cuando clientes opinan |
| Preguntas (Q&A) | Clientes preguntan en el producto, tu respondes 1 vez y todos ven la respuesta | Admin > Preguntas |
| Ficha tecnica PDF | El cliente descarga specs sin preguntarte | Admin > Productos > URL ficha tecnica |

### Automatizacion clave: Preguntas frecuentes
Cuando un cliente pregunta algo en un producto (ej: "se puede lavar a maquina?"), tu respondes UNA vez desde Admin > Preguntas y esa respuesta queda visible para TODOS los futuros clientes. Asi dejas de responder lo mismo mil veces.

**Como hacerlo:**
1. Ve a Admin > Preguntas
2. Veras preguntas pendientes
3. Escribe tu respuesta
4. Click en "Responder y Publicar"
5. Listo - esa respuesta aparece en el producto para siempre

---

## SISTEMA 2: PAGOS Y CUPONES

### Que hace
Tres formas de pago + cupones de descuento para promociones.

### Funciones practicas

| Funcion | Como te beneficia |
|---------|-------------------|
| MercadoPago | Cobras con tarjeta automaticamente, el dinero llega a tu cuenta MP |
| Transferencia | Para clientes que prefieren transferir, ven tus datos bancarios |
| Pago al retirar | Para clientes locales que van a tu tienda |
| Cupones % | "20% de descuento en todo" para Instagram |
| Cupones monto fijo | "$5.000 de descuento" para clientes frecuentes |
| Cupones envio gratis | "Envio gratis con codigo ENVIOGRATIS" |

### Automatizacion clave: MercadoPago
Cuando un cliente paga con MercadoPago:
1. Paga en MercadoPago (tu no haces nada)
2. MercadoPago avisa automaticamente a tu sistema (webhook)
3. El pedido se marca como "pagado" solo
4. El cliente recibe email de confirmacion solo
5. Tu recibes email de aviso solo

**Lo unico que haces tu:** preparar el pedido y cambiar estado a "Preparando" o "Enviado".

### Estrategias de cupones:

| Estrategia | Como crearla |
|------------|-------------|
| Descuento de bienvenida | Admin > Cupones > Nuevo > "BIENVENIDO" > 10% > Sin fecha limite |
| Promo de temporada | Admin > Cupones > Nuevo > "NAVIDAD2026" > 20% > Vigencia dic 1-25 |
| Envio gratis para pedidos grandes | Ya configurado: envio gratis sobre $50.000 |
| Codigo para influencer | Admin > Cupones > Nuevo > "INFLUENCER_NOMBRE" > 15% > Uso maximo: 50 |
| Flash sale | Admin > Cupones > Nuevo > "FLASH" > $3.000 off > Vigencia: 24 horas |

---

## SISTEMA 3: PEDIDOS

### Que hace
Gestiona todo el ciclo de vida de un pedido desde que el cliente compra hasta que recibe.

### Flujo de estados

```
PENDIENTE -> CONFIRMADO -> PREPARANDO -> ENVIADO -> ENTREGADO
                                                 \-> CANCELADO
```

### Funciones practicas

| Funcion | Como usarla |
|---------|-------------|
| Filtrar por estado | Ver solo pedidos "pendientes" para saber que preparar |
| Buscar por nombre/email | Encontrar pedido de un cliente especifico |
| Filtrar por fecha | Ver pedidos de hoy, esta semana, etc. |
| Cambiar estado | Click en el pedido > Cambiar estado > El cliente recibe email automatico |
| WhatsApp directo | Boton en cada pedido para contactar al cliente |
| Exportar CSV | Descargar todo a Excel para contabilidad |
| Timeline | Ver todo el historial de cambios de un pedido |

### Rutina diaria recomendada

**Manana (5 min):**
1. Abrir Admin > Dashboard - ver resumen del dia
2. Admin > Pedidos > Filtrar "Pendiente" - ver nuevos pedidos
3. Cambiar a "Confirmado" los pedidos con pago verificado
4. Cambiar a "Preparando" los que empiezas a producir

**Tarde (2 min):**
1. Admin > Pedidos > Filtrar "Preparando" - ver que esta listo
2. Los que estan listos -> "Enviado" o "Entregado" (si es retiro)

---

## SISTEMA 4: WHATSAPP AUTOMATICO

### Que hace
Un bot que responde automaticamente las preguntas mas comunes por WhatsApp. Los clientes reciben respuesta instantanea sin que tu hagas nada.

### Respuestas automaticas configuradas

| Mensaje del cliente | Respuesta automatica |
|--------------------|---------------------|
| "Hola" / "Buenos dias" | Saludo con link a la tienda |
| "Catalogo" / "Productos" | Link al catalogo con categorias disponibles |
| "Precio" / "Cuanto cuesta" | Link al catalogo para ver precios actualizados |
| "Pedido" / "Estado" | Instrucciones para ver estado en Mi Cuenta |
| "Horario" / "Atencion" | Lunes a Viernes 9:00 - 18:00 |
| "Donde" / "Ubicacion" / "Direccion" | Errazuriz 09, Donihue + link Google Maps |
| "Envio" / "Despacho" | Zonas, precios y dias de despacho |

### Como personalizarlo
1. Admin > WhatsApp Bot
2. Edita las respuestas a tu gusto
3. Agrega nuevas palabras clave y respuestas
4. Activa/desactiva el modo IA si quieres respuestas mas inteligentes

### Lo que logras
El 70-80% de los mensajes de WhatsApp son preguntas repetitivas. El bot las responde en **segundos**, 24/7, sin que tu estes pendiente. Solo intervienes en consultas complejas o personalizadas.

---

## SISTEMA 5: NEWSLETTER Y EMAIL MARKETING

### Que hace
Captura emails de clientes automaticamente y te permite enviar promociones masivas.

### Puntos de captura automaticos (el cliente se suscribe sin que tu hagas nada)

| Punto | Como funciona |
|-------|--------------|
| Footer de la tienda | Barra "Suscribete y recibe ofertas exclusivas" con campo de email |
| Checkout | Checkbox "Quiero recibir ofertas" (pre-marcado) al comprar |
| Registro | Checkbox "Quiero recibir ofertas" (pre-marcado) al crear cuenta |

### Enviar una campana

1. Admin > Newsletter
2. Ver cuantos suscriptores activos tienes
3. Click tab "Enviar Newsletter"
4. Escribe el asunto: "20% en toda la tienda este fin de semana!"
5. Escribe el contenido en HTML (o texto simple)
6. Click "Enviar"
7. Todos los suscriptores activos reciben el email

### Estrategias de email marketing

| Frecuencia | Tipo de email | Ejemplo |
|-----------|--------------|---------|
| Semanal | Nuevo producto | "Llegaron las poleras de verano" |
| Quincenal | Promo con cupon | "Usa PROMO15 y lleva 15% off" |
| Mensual | Portafolio | "Mira los trabajos que hicimos este mes" |
| Ocasional | Flash sale | "Solo hoy: envio gratis en todo" |

---

## SISTEMA 6: PORTAFOLIO Y SOCIAL PROOF

### Que hace
Muestra tus trabajos reales para generar confianza. Los clientes ven que otros ya compraron y quedaron contentos.

### Componentes

| Componente | Donde aparece | Que muestra |
|-----------|--------------|------------|
| Galeria de portafolio | /portafolio | Tus trabajos organizados por categoria con fotos |
| Trabajos recientes | Homepage | Los 4 ultimos trabajos destacados |
| Logos de clientes | Homepage + /portafolio | Marquee con logos de empresas que han confiado en ti |
| Popup compras recientes | Esquina inferior izquierda | "Juan G. compro una Polera DTF hace 2 horas" |
| Reviews en productos | Cada producto | Estrellas y opiniones de clientes reales |
| Preguntas y respuestas | Cada producto | Preguntas de clientes con tus respuestas |

### Como agregar trabajos al portafolio

1. Admin > Portafolio > tab "Trabajos"
2. Click "Nuevo Trabajo"
3. Titulo: "Poleras equipo futbol Club Deportivo Donihue"
4. Cliente: "Club Deportivo Donihue"
5. Categoria: "Poleras"
6. Agrega URLs de las fotos del trabajo
7. Marca como "Destacado" si quieres que aparezca en el homepage
8. Guardar

### Como agregar clientes destacados

1. Admin > Portafolio > tab "Clientes Destacados"
2. Click "Nuevo Cliente"
3. Nombre, URL del logo, sitio web
4. Guardar -> el logo aparece en el marquee automatico

### Social proof automatico
El popup de "compra reciente" funciona solo. Toma los pedidos de las ultimas 48 horas y los muestra anonimizados (ej: "Maria G.") cada 30-45 segundos. Se puede activar/desactivar en Admin > Configuracion > Tienda > Popup Compras Recientes.

---

## SISTEMA 7: CUENTAS DE CLIENTES

### Que hace
Los clientes crean su cuenta y se auto-gestionan sin necesidad de contactarte.

### Lo que el cliente puede hacer solo

| Funcion | Beneficio para ti |
|---------|-------------------|
| Ver historial de pedidos | No te preguntan "en que estado va mi pedido" |
| Ver tracking de estado | Saben si esta pendiente, preparando, enviado |
| Guardar direccion | No la piden cada vez que compran |
| Lista de favoritos | Guardan productos para comprar despues |
| Escribir reviews | Generan contenido que convence a otros |
| Hacer preguntas en productos | Preguntan ahi, no por WhatsApp |

### Automatizacion clave
Cuando un cliente crea cuenta y compra, TODO su historial queda registrado. La proxima vez que compre, sus datos ya estan pre-llenados. No tiene que escribir nombre, email, telefono ni direccion de nuevo.

---

## SISTEMA 8: GOOGLE ANALYTICS

### Que hace
Te muestra cuantas personas visitan tu tienda, de donde vienen, que productos miran y cuantas compran.

### Como configurarlo

1. Ir a analytics.google.com
2. Crear propiedad para printup.cl
3. Copiar el ID de medicion (ej: G-XXXXXXXXXX)
4. Admin > Configuracion > Tienda > "Google Analytics ID"
5. Pegar el ID y guardar
6. Listo - Google empieza a trackear automaticamente

### Metricas utiles

| Metrica | Que te dice |
|---------|------------|
| Usuarios | Cuantas personas visitan tu tienda |
| Paginas vistas | Que productos miran mas |
| Tasa de rebote | Cuantos se van sin ver nada |
| Conversiones | Cuantos compran vs cuantos visitan |
| Fuentes de trafico | Si vienen de Google, Instagram, directo, etc. |

---

## SISTEMA 9: PAGINAS LEGALES Y SEO

### Que hace
Te protege legalmente y te posiciona en Google.

### Paginas legales (ya creadas)
- **/politicas/envio** - Zonas, precios, tiempos de produccion, dias de despacho
- **/politicas/devoluciones** - Condiciones para productos personalizados, proceso de reclamo
- **/politicas/privacidad** - Cumplimiento de ley chilena, datos recopilados, derechos ARCO

### SEO automatico
- **Sitemap**: Google sabe de todas tus paginas y productos automaticamente
- **Datos estructurados**: Google muestra precio, stock y foto directo en resultados de busqueda
- **Meta tags**: Cada pagina tiene titulo y descripcion optimizados
- **robots.txt**: Google no indexa el admin ni las APIs

### Para registrar en Google
1. Ir a search.google.com/search-console
2. Agregar propiedad printup.cl
3. Verificar con DNS (agregar registro TXT en NIC Chile)
4. Enviar sitemap: printup.cl/sitemap.xml
5. Esperar 1-2 semanas a que Google indexe todo

---

## SISTEMA 10: NEXTCLOUD

### Que hace
Sincroniza automaticamente los archivos que suben los clientes y los pedidos a tu servidor local. Asi tienes backup de todo en tu computador.

### Que se sincroniza
- Archivos de formularios de contacto (disenos que envian los clientes)
- Pedidos como archivos JSON (datos completos del pedido)

### Configuracion
Admin > Configuracion > Nextcloud > URL, usuario, contrasena, carpeta

---

## RESUMEN: COMO AUTOMATIZAR LA ATENCION AL CLIENTE

### Antes vs Despues

| Situacion | ANTES (manual) | AHORA (automatico) |
|-----------|---------------|-------------------|
| "Cuanto cuesta una polera?" | Respondias por WhatsApp | Ven el precio en la tienda |
| "Tienen stock?" | Revisabas y respondias | Se muestra en tiempo real |
| "Quiero comprar" | Tomabas el pedido por WSP | Compran solos en la tienda |
| "Ya pague" | Verificabas en MercadoPago | El webhook confirma solo |
| "En que va mi pedido?" | Buscabas y respondias | Lo ven en Mi Cuenta |
| "Que horario tienen?" | Respondias | El bot de WhatsApp responde |
| "Donde quedan?" | Respondias | El bot de WhatsApp responde |
| "Hacen poleras?" | Respondias | Ven el portafolio y productos |
| "Tienen alguna promo?" | Respondias | Newsletter + cupones |
| "Es confiable?" | Nada | Reviews + portafolio + social proof |

### Las 5 automatizaciones mas potentes

1. **Respuestas WhatsApp**: El 70% de los mensajes se responden solos (horario, precios, ubicacion, estado pedidos)

2. **Preguntas de productos**: Respondes 1 vez, queda visible para siempre. Dejas de responder lo mismo.

3. **Emails de estado**: Cada vez que cambias el estado de un pedido, el cliente recibe email automatico. No tienes que escribirle.

4. **Newsletter automatico**: Los clientes se suscriben solos al comprar. Tu solo envias promos cuando quieras.

5. **Social proof**: El popup de "X compro hace Y minutos" y las reviews generan confianza automaticamente.

### Rutina diaria recomendada (15 minutos)

**Manana (10 min):**
1. Abrir Admin > Dashboard - ver resumen
2. Admin > Pedidos pendientes - confirmar pagos de transferencia
3. Admin > Preguntas pendientes - responder si hay nuevas
4. Cambiar estados de pedidos que esten listos

**Cuando tengas tiempo (5 min):**
1. Subir foto de trabajo terminado al Portafolio
2. Revisar si hay reviews pendientes de aprobar

**Semanal (10 min):**
1. Admin > Newsletter > Enviar promo o novedad
2. Crear cupon si hay alguna promo especial
3. Revisar Analytics para ver que productos son mas populares

---

## TABLA RAPIDA DE REFERENCIA

| Quiero... | Donde voy |
|-----------|-----------|
| Ver las ventas del dia | Admin > Dashboard |
| Ver pedidos nuevos | Admin > Pedidos > Filtro "Pendiente" |
| Cambiar estado de pedido | Admin > Pedidos > Click pedido > Cambiar estado |
| Agregar un producto nuevo | Admin > Productos > Nuevo Producto |
| Cambiar precio de un producto | Admin > Productos > Editar > Precio |
| Ver stock de todo | Admin > Inventario |
| Crear un cupon de descuento | Admin > Cupones > Nuevo Cupon |
| Responder pregunta de producto | Admin > Preguntas |
| Aprobar review de cliente | Admin > Reviews |
| Enviar newsletter | Admin > Newsletter > Enviar Newsletter |
| Agregar trabajo al portafolio | Admin > Portafolio > Nuevo Trabajo |
| Agregar cliente destacado | Admin > Portafolio > Clientes Destacados > Nuevo |
| Configurar Google Analytics | Admin > Configuracion > Tienda > Google Analytics ID |
| Activar/desactivar social proof | Admin > Configuracion > Tienda > Popup Compras Recientes |
| Configurar WhatsApp Bot | Admin > WhatsApp Bot |
| Configurar zonas de envio | Admin > Envios |
| Ver clientes y su historial | Admin > Contactos |
| Exportar pedidos a Excel | Admin > Pedidos > Exportar CSV |
| Cambiar datos de la tienda | Admin > Configuracion > Tienda |
| Cambiar datos de MercadoPago | Admin > Configuracion > Pagos |
