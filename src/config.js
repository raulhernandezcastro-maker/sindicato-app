// ============================================================
// CONFIGURACIÓN CENTRAL — Sindicato Interempresas Liberty Seguros
// Modifica solo este archivo para adaptar la app al cliente
// ============================================================

export const APP_CONFIG = {
  // ── Identidad ──────────────────────────────────────────────
  nombreSindicato: "Sindicato Interempresas Liberty Seguros",
  nombreCorto:     "Liberty Seguros",
  subtitulo:       "Portal del Sindicato",

  // ── Colores principales ────────────────────────────────────
  // Extraídos de MobileNav.jsx
  colorPrimario:         "#2d7a4f",   // Verde principal (headers, fondos, botones)
  colorPrimarioOscuro:   "#1a5530",   // Verde oscuro (texto, variante dark)
  colorPrimarioClaro:    "#dcfce7",   // Verde muy claro (fondos de formularios, highlights)
  colorAcento:           "#7CBE80",   // Verde medio (items activos, badges)
  colorTextoSobreAcento: "#003d18",   // Texto oscuro sobre fondo acento

  // ── Contacto ───────────────────────────────────────────────
  // ⚠️  Reemplaza con el número real de WhatsApp de Liberty
  whatsappNumero:  "56932076628",
  whatsappMensaje: "Hola, me contacto desde el portal del Sindicato Liberty.",

  // ── Denuncias ──────────────────────────────────────────────
  denunciasInterno: true,
  denunciasUrl:     "",

  // ── App / PWA ──────────────────────────────────────────────
  appUrl:    "https://sindicato-liberty.vercel.app",
  appNombre: "Sindicato Liberty App",

  // ── Notificaciones push ────────────────────────────────────
  notificacionTitulo: "Sindicato Liberty",

  // ── Textos personalizables ─────────────────────────────────
  bienvenida:     "Bienvenido al Portal del Sindicato",
  descripcionApp: "Aplicación oficial del Sindicato Interempresas Liberty Seguros",
}

// Colores derivados para uso inline en JSX
export const COLORS = {
  primary:      APP_CONFIG.colorPrimario,
  primaryDark:  APP_CONFIG.colorPrimarioOscuro,
  primaryLight: APP_CONFIG.colorPrimarioClaro,
  accent:       APP_CONFIG.colorAcento,
  accentText:   APP_CONFIG.colorTextoSobreAcento,
}
