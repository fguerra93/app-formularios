# Opciones de Despliegue para el Formulario de PrintUp.cl

**Actualizado: Marzo 2026 — Enfoque: $0 de costo**

---

## El Problema Central

Tienes un servidor local (Windows Server 2025, IP 192.168.0.50) donde ya corre Nextcloud. Puedes desarrollar el formulario Angular + Node.js ahí mismo, pero para que un cliente acceda desde internet a `formulario.printup.cl`, ese servidor necesita estar **encendido 24/7** y **expuesto a internet** de alguna forma.

Hay tres caminos fundamentales, cada uno con variantes:

---

## CAMINO A: Usar tu Servidor Local + Exponerlo a Internet

La idea: tu server local hace todo el trabajo. Solo necesitas un "puente" para que el mundo exterior lo alcance.

### A1. Cloudflare Tunnel (Recomendado si usas tu server)

**Costo: $0**

Instalas `cloudflared` como servicio en tu Windows Server. Este daemon crea una conexión saliente hacia la red de Cloudflare (no abres puertos en tu router). Cloudflare enruta el tráfico de tu dominio a través de ese túnel hasta tu server local.

**Requisitos:**
- Dominio en Cloudflare (puedes apuntar `printup.cl` o un subdominio)
- `cloudflared` instalado y corriendo como servicio de Windows
- Tu servidor encendido 24/7

**Ventajas:**
- Gratis para siempre, sin límites de ancho de banda en HTTP/HTTPS
- SSL automático, protección DDoS incluida
- No abres puertos en tu router (seguridad)
- Soporta múltiples servicios (formulario + Nextcloud) en subdominios distintos
- CDN global de Cloudflare acelera la entrega de archivos estáticos (el frontend Angular)

**Limitaciones:**
- Archivos subidos vía el túnel tienen límite de **100 MB por request** en el plan gratuito
- Si tu server se apaga o tu internet se cae → el formulario se cae
- Tu velocidad de subida doméstica/oficina es el cuello de botella (el cliente sube un archivo de 50 MB y depende de tu upload speed)
- No hay SLA: si Cloudflare tiene problemas, no tienes soporte

**Impacto del límite de 100 MB:** Para impresión digital, la mayoría de archivos de diseño (JPG alta resolución, PNG, PDF de una página) caen bajo 100 MB. Archivos AI/PSD/TIFF sin comprimir podrían excederlo. Puedes mitigar esto pidiendo formato PDF o JPG en el formulario.

### A2. Port Forwarding + DDNS (Opción clásica, no recomendada)

**Costo: $0**

Abres el puerto 443 en tu router, apuntas tu dominio a tu IP pública (usando un servicio DDNS si tu IP es dinámica).

**Por qué NO:**
- Expone tu red local directamente a internet
- Necesitas gestionar certificados SSL manualmente (Let's Encrypt + Certbot)
- Tu ISP en Chile puede bloquear puertos o cambiar tu IP
- Sin protección DDoS
- Cualquier vulnerabilidad en tu server = riesgo directo

### A3. VPN/Tailscale + Reverse Proxy (Para uso interno, no público)

**Costo: $0**

Útil si solo tú y tu equipo necesitan acceder al server, pero inviable para clientes externos que no van a instalar un VPN.

---

### Resumen del Camino A: Costos Reales

| Ítem | Costo |
|------|-------|
| Cloudflare Tunnel | $0 |
| Dominio `.cl` (ya lo tienes) | ~$10.000 CLP/año (ya pagado) |
| Electricidad del servidor 24/7 | **~$15.000–30.000 CLP/mes** (según consumo del equipo) |
| Internet (ya lo tienes) | $0 adicional |
| **Total mensual adicional** | **~$15.000–30.000 CLP** (solo electricidad) |

**El costo oculto real es la electricidad y la disponibilidad.** Si se corta la luz o tu internet, el formulario deja de funcionar. No hay redundancia.

---

## CAMINO B: Hosting Gratuito en la Nube (Frontend + Backend separados)

La idea: subes tu código a plataformas gratuitas que se encargan de la disponibilidad 24/7. El formulario vive en la nube, pero cuando el cliente sube un archivo, el backend lo reenvía a tu Nextcloud local (vía Cloudflare Tunnel).

### Arquitectura Híbrida

```
[Cliente] → [Frontend en Cloudflare Pages] → [Backend en Render/Fly.io]
                                                      ↓
                                            [Cloudflare Tunnel → tu Nextcloud]
```

El frontend (Angular compilado, archivos estáticos) va a un hosting de sitios estáticos gratuito. El backend (Node.js, recibe el archivo y lo reenvía) va a un servicio que soporte aplicaciones server-side.

### B1. Frontend: Cloudflare Pages (Recomendado)

**Costo: $0**

| Característica | Detalle |
|---|---|
| Sitios | Ilimitados |
| Bandwidth | **Ilimitado** |
| Requests | Ilimitados (estáticos) |
| Builds | 500/mes por cuenta |
| Archivos por sitio | 20.000 |
| SSL | Automático |
| Dominio custom | Sí (hasta 100 por proyecto) |
| Uso comercial | **Sí** |

Despliegas tu app Angular compilada (`ng build`) conectando tu repo de GitHub/GitLab. Cada push genera un nuevo deploy automático.

**Alternativas gratuitas para el frontend:**
- **Vercel** (Hobby): 100 GB bandwidth, ilimitados deploys. Pero **NO permite uso comercial** en el plan gratuito — descartado para PrintUp.
- **Netlify**: 100 GB bandwidth, 300 minutos de build. Permite uso comercial.
- **GitHub Pages**: Ilimitado para sitios estáticos, pero sin serverless functions.

### B2. Backend Node.js: Las opciones gratuitas

Aquí es donde la cosa se complica. Necesitas un servidor Node.js corriendo que reciba el archivo del formulario y lo reenvíe a Nextcloud.

#### Render (Free Tier)

| Característica | Detalle |
|---|---|
| Web services | Sí (con limitaciones) |
| Horas gratis/mes | 750 horas de instancia |
| RAM | 512 MB |
| Spin-down | **Se duerme tras 15 min sin tráfico** (tarda ~1 min en despertar) |
| Disco | Efímero (se borra al reiniciar) |
| PostgreSQL gratis | Sí, pero expira a los 30 días |
| Uso comercial | Sí |

**El problema del spin-down:** Cuando un cliente abre tu formulario, el backend puede tardar hasta 60 segundos en responder la primera vez. Esto es terrible para la experiencia de usuario.

**Workaround:** Usar un servicio como UptimeRobot (gratis) que haga ping cada 5 minutos para mantenerlo despierto. Funciona, pero consume tus 750 horas (750h ÷ 24h = 31.25 días, así que un solo servicio alcanza justo para un mes).

#### Cloudflare Workers (Free Tier)

| Característica | Detalle |
|---|---|
| Requests/día | 100.000 |
| CPU time | 10 ms por request (Free) |
| Tamaño del script | 1 MB |
| Request body | **100 MB** (Free plan) |
| Uso comercial | Sí |

**El problema:** 10 ms de CPU time por request es extremadamente poco para procesar una subida de archivo y reenviarla a Nextcloud vía WebDAV. No es viable para este caso de uso a menos que uses Workers solo como proxy ligero y el archivo se suba directamente a R2 (el object storage de Cloudflare, que tiene 10 GB gratis).

#### Fly.io

Ofrece $5 USD de crédito gratis, pero no es un free tier permanente. Cuando se acaba el crédito, se apaga. No es opción para "gratis indefinido".

#### Railway

Similar a Fly.io: $5 USD de crédito único. No es free tier permanente.

---

## CAMINO C: VPS Gratuito en la Nube (Todo en uno)

La idea: en vez de usar tu server local, montas todo (Node.js + Nextcloud o almacenamiento) en un VPS gratuito en la nube. Disponibilidad 24/7, sin depender de tu electricidad ni internet local.

### C1. Oracle Cloud Always Free (La joya escondida)

**Costo: $0 permanente**

Oracle ofrece el free tier más generoso de la industria, y a diferencia de AWS/GCP, **no expira nunca:**

| Recurso | Detalle |
|---|---|
| VM ARM (Ampere A1) | **4 OCPUs + 24 GB RAM** (como 1 VM grande o hasta 4 VMs) |
| VM AMD (x86) | 2 VMs con 1/8 OCPU + 1 GB RAM cada una |
| Almacenamiento | **200 GB** de block storage total |
| Object Storage | 20 GB |
| Bandwidth saliente | **10 TB/mes** |
| Load Balancer | 1 instancia (10 Mbps) |
| IP pública reservada | 1 fija + 2 dinámicas |
| Base de datos | 2 Oracle Autonomous DB (20 GB c/u) |
| Uso comercial | Sí |

**Con 4 cores ARM y 24 GB de RAM puedes correr:**
- Tu backend Node.js
- Nextcloud en Docker
- Una base de datos
- Nginx como reverse proxy
- Todo al mismo tiempo, sin despeinarse

**Consideraciones:**
- Necesitas tarjeta de crédito para verificación (no te cobran mientras estés en Always Free)
- Las instancias ARM pueden ser difíciles de obtener en regiones populares (hay que intentar varias veces o elegir una región menos demandada, como São Paulo)
- Oracle puede reciclar instancias que estén subutilizadas (poco probable si corre Nextcloud + Node.js)
- Convierte a "Pay As You Go" para evitar que cierren la cuenta — seguirás usando recursos Always Free sin costo
- No hay soporte oficial en el tier gratuito

**Veredicto:** Si logras provisionar la instancia ARM, es básicamente un VPS de ~$50 USD/mes gratis de por vida. Puedes montar toda la infraestructura de PrintUp ahí.

---

## Tabla Comparativa Final

| Opción | Costo Real | Uptime 24/7 | Límite de Archivo | Complejidad | Uso Comercial | Dependencia |
|---|---|---|---|---|---|---|
| **A1. Server local + Cloudflare Tunnel** | ~$20.000 CLP/mes (luz) | Depende de tu luz/internet | 100 MB (túnel) | Media | Sí | Tu infraestructura |
| **B. Cloudflare Pages + Render** | $0 | 99%+ (con workaround) | 100 MB (Workers) o según Render | Alta (arquitectura dividida) | Sí | 2 proveedores externos |
| **C1. Oracle Cloud Always Free** | **$0** | **99.9%+** (datacenter real) | **Ilimitado** (tu VPS) | Media-Alta (setup inicial) | Sí | Oracle |

---

## Recomendación para PrintUp

### Si quieres empezar YA (MVP rápido):

**Server local + Cloudflare Tunnel.** Ya tienes el server con Nextcloud corriendo. Instalar `cloudflared` toma 15 minutos. Mañana puedes tener `formulario.printup.cl` funcionando.

### Si quieres la solución más robusta y gratis:

**Oracle Cloud Always Free.** Creas una VM ARM con 4 cores y 24 GB de RAM, instalas Docker, levantas Nextcloud + tu backend Node.js + Nginx, y tienes una infraestructura de nivel empresarial a costo $0 con uptime real de datacenter. El setup inicial toma un fin de semana, pero después no te preocupas más por cortes de luz ni velocidad de upload.

### Si quieres lo mejor de ambos mundos:

**Empieza con Cloudflare Tunnel** para validar que el formulario funciona y tus clientes lo usan. En paralelo, **configura Oracle Cloud** como tu infraestructura definitiva. Cuando esté lista, migras y apagas el server local (o lo dejas como respaldo).

---

## Próximos Pasos Sugeridos

1. Instalar `cloudflared` en tu Windows Server y crear el túnel hacia tu Nextcloud
2. Desarrollar el formulario Angular + backend Node.js (WebDAV a Nextcloud)
3. Probar con clientes reales usando un subdominio temporal
4. En paralelo, crear cuenta Oracle Cloud y provisionar la VM ARM
5. Migrar toda la infraestructura a Oracle Cloud cuando esté estable
