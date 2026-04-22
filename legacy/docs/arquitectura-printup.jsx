import { useState } from "react";

const options = [
  {
    id: "a",
    label: "Opción A",
    title: "Server Local + Cloudflare Tunnel",
    url: "formulario.printup.cl",
    urlPossible: true,
    urlExplanation: `Sí, puedes usar formulario.printup.cl sin problemas. Al crear el túnel en Cloudflare, tú defines el hostname público. Cloudflare crea automáticamente un registro CNAME que apunta ese subdominio a tu túnel.`,
    urlSteps: [
      "Mover el DNS de printup.cl a Cloudflare (gratis)",
      "En el dashboard de Cloudflare Tunnel, configurar el Public Hostname como formulario.printup.cl",
      "Cloudflare crea el registro DNS automáticamente",
      "Tu tienda Shopify sigue funcionando en printup.cl (configuras los registros de Shopify en Cloudflare)",
    ],
    urlDefault: "formulario.printup.cl ✓",
    cost: "~$20.000 CLP/mes (luz)",
    diagram: {
      nodes: [
        { id: "client", label: "Cliente", subtitle: "Abre el navegador", icon: "👤", x: 50, y: 50, color: "#3B82F6" },
        { id: "cf", label: "Cloudflare", subtitle: "CDN + Tunnel", icon: "☁️", x: 300, y: 50, color: "#F59E0B" },
        { id: "server", label: "Tu Server Local", subtitle: "Windows Server 2025", icon: "🖥️", x: 550, y: 50, color: "#8B5CF6" },
        { id: "angular", label: "Angular", subtitle: "Formulario", icon: "📝", x: 450, y: 180, color: "#10B981" },
        { id: "node", label: "Node.js", subtitle: "Backend API", icon: "⚙️", x: 550, y: 180, color: "#10B981" },
        { id: "nc", label: "Nextcloud", subtitle: "Almacena archivos", icon: "📁", x: 650, y: 180, color: "#10B981" },
      ],
      arrows: [
        { from: "client", to: "cf", label: "formulario.printup.cl" },
        { from: "cf", to: "server", label: "Túnel encriptado" },
        { from: "server", to: "angular", label: "" },
        { from: "server", to: "node", label: "" },
        { from: "node", to: "nc", label: "WebDAV" },
      ],
      note: "Todo corre en TU máquina. Cloudflare solo es el puente seguro a internet."
    }
  },
  {
    id: "b",
    label: "Opción B",
    title: "Nube Híbrida (Pages + Render)",
    url: "formulario.printup.cl",
    urlPossible: true,
    urlExplanation: `Sí, pero con un detalle: la URL bonita apunta al frontend (Cloudflare Pages). El backend en Render tendrá su propia URL técnica que el frontend usa internamente.`,
    urlSteps: [
      "DNS de printup.cl en Cloudflare",
      "formulario.printup.cl → apunta a Cloudflare Pages (tu Angular)",
      "Render te da: printup-api.onrender.com (URL automática del backend)",
      "Tu Angular llama a printup-api.onrender.com internamente (el cliente nunca ve esta URL)",
      "Opcionalmente puedes configurar api.printup.cl → Render (dominio custom en plan gratis)",
    ],
    urlDefault: "formulario.printup.cl → Pages\nprintup-api.onrender.com → Backend",
    cost: "$0",
    diagram: {
      nodes: [
        { id: "client", label: "Cliente", subtitle: "Abre el navegador", icon: "👤", x: 50, y: 110, color: "#3B82F6" },
        { id: "pages", label: "Cloudflare Pages", subtitle: "Frontend Angular", icon: "📝", x: 300, y: 50, color: "#F59E0B" },
        { id: "render", label: "Render", subtitle: "Backend Node.js", icon: "⚙️", x: 300, y: 180, color: "#6366F1" },
        { id: "tunnel", label: "Cloudflare Tunnel", subtitle: "Puente a tu casa", icon: "🔒", x: 550, y: 180, color: "#F59E0B" },
        { id: "nc", label: "Tu Server + Nextcloud", subtitle: "Almacena archivos", icon: "📁", x: 550, y: 50, color: "#8B5CF6" },
      ],
      arrows: [
        { from: "client", to: "pages", label: "formulario.printup.cl" },
        { from: "pages", to: "render", label: "API call (interno)" },
        { from: "render", to: "tunnel", label: "Envía archivo" },
        { from: "tunnel", to: "nc", label: "WebDAV" },
      ],
      note: "El frontend está en la nube (siempre disponible). El backend en Render (se puede dormir). Nextcloud sigue en tu server local."
    }
  },
  {
    id: "c",
    label: "Opción C",
    title: "Oracle Cloud Always Free",
    url: "formulario.printup.cl",
    urlPossible: true,
    urlExplanation: `Sí, apuntas el subdominio a la IP pública fija que Oracle te da gratis. Todo vive en el datacenter de Oracle, no depende de tu casa.`,
    urlSteps: [
      "DNS de printup.cl en Cloudflare (o donde lo tengas)",
      "Oracle te da 1 IP pública fija reservada (gratis)",
      "Crear registro A: formulario.printup.cl → IP de Oracle",
      "Instalar Certbot en la VM para SSL gratuito con Let's Encrypt",
      "Opcionalmente: usar Cloudflare como proxy (DNS naranja) para tener CDN + protección DDoS gratis frente a Oracle",
    ],
    urlDefault: "formulario.printup.cl ✓",
    cost: "$0",
    diagram: {
      nodes: [
        { id: "client", label: "Cliente", subtitle: "Abre el navegador", icon: "👤", x: 50, y: 110, color: "#3B82F6" },
        { id: "cf", label: "Cloudflare", subtitle: "DNS + CDN (opcional)", icon: "☁️", x: 250, y: 110, color: "#F59E0B" },
        { id: "oracle", label: "Oracle Cloud VM", subtitle: "4 CPU ARM · 24 GB RAM", icon: "🏢", x: 500, y: 110, color: "#EF4444" },
        { id: "angular", label: "Angular", subtitle: "Formulario", icon: "📝", x: 400, y: 240, color: "#10B981" },
        { id: "node", label: "Node.js", subtitle: "Backend API", icon: "⚙️", x: 500, y: 240, color: "#10B981" },
        { id: "nc", label: "Nextcloud", subtitle: "Docker", icon: "📁", x: 600, y: 240, color: "#10B981" },
      ],
      arrows: [
        { from: "client", to: "cf", label: "formulario.printup.cl" },
        { from: "cf", to: "oracle", label: "Proxy / DNS" },
        { from: "oracle", to: "angular", label: "" },
        { from: "oracle", to: "node", label: "" },
        { from: "node", to: "nc", label: "WebDAV" },
      ],
      note: "Todo corre en Oracle Cloud, gratis y 24/7. Tu server local ya no es necesario para el formulario."
    }
  },
];

function Arrow({ x1, y1, x2, y2, label }) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.sqrt(dx * dx + dy * dy);
  const ux = dx / len;
  const uy = dy / len;
  const sx = x1 + ux * 30;
  const sy = y1 + uy * 20;
  const ex = x2 - ux * 30;
  const ey = y2 - uy * 20;
  const mx = (sx + ex) / 2;
  const my = (sy + ey) / 2;

  return (
    <g>
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#94A3B8" />
        </marker>
      </defs>
      <line x1={sx} y1={sy} x2={ex} y2={ey} stroke="#94A3B8" strokeWidth="2" markerEnd="url(#arrowhead)" strokeDasharray="6 3" />
      {label && (
        <text x={mx} y={my - 8} textAnchor="middle" fill="#CBD5E1" fontSize="10" fontFamily="monospace">
          {label}
        </text>
      )}
    </g>
  );
}

function DiagramNode({ node }) {
  return (
    <g>
      <rect x={node.x - 55} y={node.y - 28} width={110} height={56} rx={10} fill={node.color + "22"} stroke={node.color} strokeWidth="1.5" />
      <text x={node.x} y={node.y - 8} textAnchor="middle" fill="white" fontSize="13" fontWeight="600" fontFamily="system-ui">
        {node.icon} {node.label}
      </text>
      <text x={node.x} y={node.y + 10} textAnchor="middle" fill="#94A3B8" fontSize="9" fontFamily="system-ui">
        {node.subtitle}
      </text>
    </g>
  );
}

function ArchitectureDiagram({ diagram }) {
  const nodeMap = {};
  diagram.nodes.forEach((n) => (nodeMap[n.id] = n));

  return (
    <div style={{ overflowX: "auto" }}>
      <svg viewBox="0 0 720 300" style={{ width: "100%", maxWidth: 720, height: "auto", minHeight: 260 }}>
        <rect width="720" height="300" fill="#0F172A" rx={12} />
        {diagram.arrows.map((a, i) => {
          const from = nodeMap[a.from];
          const to = nodeMap[a.to];
          return <Arrow key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} label={a.label} />;
        })}
        {diagram.nodes.map((n) => (
          <DiagramNode key={n.id} node={n} />
        ))}
        <text x={360} y={288} textAnchor="middle" fill="#64748B" fontSize="10" fontStyle="italic" fontFamily="system-ui">
          {diagram.note}
        </text>
      </svg>
    </div>
  );
}

export default function App() {
  const [selected, setSelected] = useState("a");
  const opt = options.find((o) => o.id === selected);

  return (
    <div style={{ background: "#0F172A", minHeight: "100vh", color: "#E2E8F0", fontFamily: "'Segoe UI', system-ui, sans-serif", padding: "24px 16px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#F8FAFC", marginBottom: 4, letterSpacing: "-0.02em" }}>
          Arquitectura de Despliegue — PrintUp.cl
        </h1>
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 20 }}>
          Selecciona una opción para ver el diagrama, la URL que verá tu cliente, y cómo funciona.
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
          {options.map((o) => (
            <button
              key={o.id}
              onClick={() => setSelected(o.id)}
              style={{
                flex: 1,
                padding: "10px 8px",
                borderRadius: 8,
                border: selected === o.id ? "2px solid #3B82F6" : "1px solid #1E293B",
                background: selected === o.id ? "#1E3A5F" : "#1E293B",
                color: selected === o.id ? "#60A5FA" : "#94A3B8",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s",
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              <div style={{ fontSize: 11, opacity: 0.6 }}>{o.label}</div>
              <div style={{ fontSize: 12, marginTop: 2 }}>{o.title}</div>
              <div style={{ fontSize: 10, marginTop: 4, color: o.cost === "$0" ? "#34D399" : "#FBBF24" }}>{o.cost}</div>
            </button>
          ))}
        </div>

        {/* Diagram */}
        <div style={{ marginBottom: 24 }}>
          <ArchitectureDiagram diagram={opt.diagram} />
        </div>

        {/* URL Section */}
        <div style={{ background: "#1E293B", borderRadius: 12, padding: 20, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <span style={{ fontSize: 18 }}>🔗</span>
            <h2 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>¿Puedo usar formulario.printup.cl?</h2>
          </div>

          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: opt.urlPossible ? "#065F4620" : "#7F1D1D20",
            border: `1px solid ${opt.urlPossible ? "#065F46" : "#7F1D1D"}`,
            borderRadius: 6, padding: "6px 12px", marginBottom: 12,
            fontSize: 14, fontWeight: 600,
            color: opt.urlPossible ? "#34D399" : "#F87171",
          }}>
            {opt.urlPossible ? "✅ Sí" : "❌ No"}
          </div>

          <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, margin: "0 0 16px 0" }}>
            {opt.urlExplanation}
          </p>

          {/* URL Preview */}
          <div style={{
            background: "#0F172A", borderRadius: 8, padding: "12px 16px",
            fontFamily: "monospace", fontSize: 13, color: "#34D399",
            border: "1px solid #1E3A5F", marginBottom: 16,
            whiteSpace: "pre-line",
          }}>
            <span style={{ color: "#64748B", fontSize: 11 }}>Lo que ve tu cliente:</span>
            {"\n"}
            <span style={{ color: "#60A5FA" }}>https://</span>{opt.urlDefault}
          </div>

          {/* Steps */}
          <div style={{ fontSize: 12, color: "#94A3B8" }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: "#CBD5E1" }}>Pasos para configurar la URL:</div>
            {opt.urlSteps.map((step, i) => (
              <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, lineHeight: 1.5 }}>
                <span style={{
                  minWidth: 20, height: 20, borderRadius: "50%",
                  background: "#1E3A5F", color: "#60A5FA",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 700, flexShrink: 0, marginTop: 1,
                }}>
                  {i + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </div>

        {/* DNS Note */}
        <div style={{ background: "#1C1917", border: "1px solid #44403C", borderRadius: 10, padding: 16, fontSize: 12, color: "#A8A29E", lineHeight: 1.6 }}>
          <span style={{ fontSize: 14 }}>⚠️</span>{" "}
          <strong style={{ color: "#FBBF24" }}>Nota sobre el DNS de printup.cl:</strong>{" "}
          Tu dominio actualmente apunta a Shopify. Para usar un subdominio como <code style={{ color: "#34D399", background: "#0F172A", padding: "1px 4px", borderRadius: 3 }}>formulario.printup.cl</code>, necesitas agregar un registro DNS (CNAME o A) en donde tengas configurado el DNS. Si mueves los nameservers a Cloudflare (gratis), desde ahí manejas todo: los registros de Shopify para la tienda + el subdominio del formulario. Tu tienda en Shopify sigue funcionando igual.
        </div>
      </div>
    </div>
  );
}
