import { useState, useEffect } from 'react'

// ────────────────────────────────────────────────────────────────
// Modal de saludo — Fiestas Patrias
// Se muestra automáticamente el 17, 18 y 19 de septiembre.
// Aparece una sola vez por día (se recuerda en el navegador).
// Imagen: /public/fiestas_patrias_modal.png
// ────────────────────────────────────────────────────────────────

const DIAS_ACTIVOS = [17, 18, 19]
const MES_ACTIVO = 9 // septiembre

export default function ModalDiaFiestasPatrias() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hoy = new Date()
    const dia = hoy.getDate()
    const mes = hoy.getMonth() + 1
    const anio = hoy.getFullYear()

    if (mes !== MES_ACTIVO || !DIAS_ACTIVOS.includes(dia)) return

    const clave = `modal_fiestas_patrias_${anio}-${mes}-${dia}`
    if (localStorage.getItem(clave)) return

    const t = setTimeout(() => setVisible(true), 600)
    return () => clearTimeout(t)
  }, [])

  const cerrar = () => {
    const hoy = new Date()
    const clave = `modal_fiestas_patrias_${hoy.getFullYear()}-${hoy.getMonth() + 1}-${hoy.getDate()}`
    localStorage.setItem(clave, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      onClick={cerrar}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(12, 24, 20, 0.62)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.1rem',
        animation: 'fpFade 0.28s ease-out',
      }}
    >
      <style>{`
        @keyframes fpFade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes fpUp {
          from { opacity: 0; transform: translateY(18px) scale(0.97) }
          to   { opacity: 1; transform: translateY(0) scale(1) }
        }
        .fp-btn:hover { filter: brightness(1.08) }
        .fp-btn:focus-visible { outline: 3px solid #4e76dd; outline-offset: 3px }
        @media (prefers-reduced-motion: reduce) {
          .fp-card, .fp-overlay { animation: none !important }
        }
      `}</style>

      <div
        className="fp-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Saludo de Fiestas Patrias"
        style={{
          background: '#ffffff',
          borderRadius: 22,
          maxWidth: 380,
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.34)',
          animation: 'fpUp 0.34s cubic-bezier(0.22, 1, 0.36, 1)',
          position: 'relative',
          padding: '1.1rem 1.1rem 1.4rem',
          textAlign: 'center',
        }}
      >
        <button
          onClick={cerrar}
          aria-label="Cerrar"
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(255,255,255,0.85)',
            color: '#24399e',
            fontSize: 18,
            lineHeight: 1,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0,0,0,0.16)',
          }}
        >
          ×
        </button>

        <img
          src="/fiestas_patrias_modal.png"
          alt="Volantines con los colores de la bandera de Chile sobre la cordillera. 18 de septiembre — Sindicato Interempresas Liberty Seguros."
          style={{ width: '100%', height: 'auto', display: 'block', marginBottom: '1.1rem' }}
        />

        <h2
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: '#1e3a2f',
            margin: '0 0 0.7rem',
            letterSpacing: '-0.2px',
          }}
        >
          ¡Felices Fiestas Patrias!
        </h2>

        <p style={{ fontSize: 14.5, color: '#555', lineHeight: 1.65, margin: '0 0 0.8rem' }}>
          Que estos días te encuentren con los tuyos, con buena mesa y descanso de verdad.
          Te lo has ganado.
        </p>

        <p style={{ fontSize: 14.5, color: '#555', lineHeight: 1.65, margin: '0 0 1rem' }}>
          Gracias por ser parte de este Sindicato. Y si sales a la ruta, cuídate y vuelve bien.
        </p>

        <p
          style={{
            fontSize: 13,
            color: '#2d7a4f',
            fontStyle: 'italic',
            fontWeight: 500,
            margin: '0 0 1.3rem',
          }}
        >
          — La Directiva del Sindicato Interempresas Liberty Seguros
        </p>

        <div style={{ height: '1px', background: '#eef2f0', marginBottom: '1.3rem' }} />

        <button
          className="fp-btn"
          onClick={cerrar}
          style={{
            background: 'linear-gradient(135deg, #24399e, #4e76dd)',
            color: '#fff',
            border: 'none',
            borderRadius: 11,
            padding: '0.78rem 2rem',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            width: '100%',
            letterSpacing: '0.3px',
          }}
        >
          ¡Viva Chile!
        </button>
      </div>
    </div>
  )
}
