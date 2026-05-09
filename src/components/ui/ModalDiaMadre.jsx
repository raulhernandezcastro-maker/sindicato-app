import { useEffect, useState } from 'react'

const HOY_KEY = 'modal_dia_madre_visto'

function getSegundoDomingoMayo(anio) {
  let domingosEncontrados = 0
  for (let d = 1; d <= 31; d++) {
    const fecha = new Date(anio, 4, d)
    if (fecha.getMonth() !== 4) break
    if (fecha.getDay() === 0) {
      domingosEncontrados++
      if (domingosEncontrados === 2) return d
    }
  }
  return null
}

function esDiaMadre() {
  const hoy = new Date()
  if (hoy.getMonth() !== 4) return false
  return hoy.getDate() === getSegundoDomingoMayo(hoy.getFullYear())
}

function getFechaDiaMadre() {
  const dia = getSegundoDomingoMayo(new Date().getFullYear())
  return `${dia} de Mayo · Día de la Madre`
}

function yaVisto() {
  const guardado = localStorage.getItem(HOY_KEY)
  if (!guardado) return false
  return guardado === new Date().toDateString()
}

function marcarVisto() {
  localStorage.setItem(HOY_KEY, new Date().toDateString())
}

export default function ModalDiaMadre() {
  const [visible, setVisible] = useState(false)
  const [segundos, setSegundos] = useState(5)

  useEffect(() => {
    if (esDiaMadre() && !yaVisto()) setVisible(true)
  }, [])

  useEffect(() => {
    if (!visible) return
    if (segundos <= 0) { cerrar(); return }
    const timer = setTimeout(() => setSegundos(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [visible, segundos])

  const cerrar = () => { marcarVisto(); setVisible(false) }

  if (!visible) return null

  return (
    <div
      onClick={cerrar}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 9999, padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '22px',
          width: '100%', maxWidth: '400px',
          overflow: 'hidden',
          border: '2px solid #2d7a4f',
          boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
          animation: 'madreModalIn 0.45s cubic-bezier(.22,.68,0,1.2) both',
        }}
      >
        <style>{`
          @keyframes madreModalIn {
            from { opacity: 0; transform: scale(0.88); }
            to   { opacity: 1; transform: scale(1); }
          }
          @keyframes madreFloat {
            0%, 100% { transform: translateY(0px); }
            50%       { transform: translateY(-6px); }
          }
          .madre-float { animation: madreFloat 3.2s ease-in-out infinite; display: inline-block; }
          .madre-btn:hover { opacity: 0.92; }
        `}</style>

        {/* Cabecera */}
        <div style={{ background: 'linear-gradient(160deg, #6b2147 0%, #9b2f5e 60%, #c4567a 100%)', padding: '2rem 2rem 1.6rem', textAlign: 'center' }}>

          {/* Puntitos decorativos */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: '1.1rem' }}>
            {['#2d7a4f','#fff','#f9c8d8','#fff','#2d7a4f'].map((bg, i) => (
              <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: bg }} />
            ))}
          </div>

          {/* Flor animada */}
          <div className="madre-float" style={{ marginBottom: '0.9rem' }}>
            <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
              {[0,45,90,135,180,225,270,315].map((angle, i) => (
                <ellipse key={i} cx="40" cy="18" rx="9" ry="14"
                  fill={i % 2 === 0 ? '#f9c8d8' : '#f0a0bf'}
                  opacity={i % 2 === 0 ? 0.95 : 0.85}
                  transform={`rotate(${angle} 40 40)`}
                />
              ))}
              <circle cx="40" cy="40" r="11" fill="#fff" opacity="0.97"/>
              <circle cx="40" cy="40" r="7"  fill="#f9c8d8"/>
              <circle cx="40" cy="40" r="4"  fill="#9b2f5e"/>
              {/* Hojitas verdes */}
              <ellipse cx="22" cy="52" rx="5" ry="9" fill="#2d7a4f" opacity="0.85" transform="rotate(-35 22 52)"/>
              <ellipse cx="58" cy="52" rx="5" ry="9" fill="#2d7a4f" opacity="0.85" transform="rotate(35 58 52)"/>
              <ellipse cx="40" cy="63" rx="4" ry="7" fill="#1e3a2f" opacity="0.7"/>
            </svg>
          </div>

          <div style={{ fontSize: 11, letterSpacing: '2.5px', color: '#f9c8d8', fontWeight: 500, textTransform: 'uppercase', marginBottom: '0.35rem' }}>
            {getFechaDiaMadre()}
          </div>
          <div style={{ fontSize: 21, fontWeight: 600, color: '#fff', lineHeight: 1.3 }}>
            ¡Feliz Día,<br />mamá trabajadora!
          </div>

          {/* Píldora verde */}
          <div style={{
            display: 'inline-block', marginTop: '0.85rem',
            background: '#1e3a2f', color: '#a8d5b5',
            fontSize: 10, letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 500,
            padding: '4px 12px', borderRadius: 20, border: '1px solid #2d7a4f',
          }}>
            Sindicato Liberty Seguros
          </div>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '1.5rem 2rem 2rem', textAlign: 'center', background: '#fff' }}>
          <p style={{ fontSize: 15, color: '#1a1a1a', lineHeight: 1.75, margin: '0 0 0.5rem' }}>
            Hoy celebramos a quienes lo dan todo — en el trabajo y en casa. Tu esfuerzo y dedicación son la base de nuestra familia y de nuestra comunidad.
          </p>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.65, margin: '0 0 0.9rem' }}>
            Te abrazamos con gratitud y orgullo. Mereces este día y muchos más.
          </p>
          <p style={{ fontSize: 13, color: '#2d7a4f', fontStyle: 'italic', fontWeight: 500, margin: '0 0 1.4rem' }}>
            — La Directiva del Sindicato
          </p>

          <div style={{ height: '0.5px', background: '#f0e0e8', marginBottom: '1.4rem' }} />

          <button
            className="madre-btn"
            onClick={cerrar}
            style={{
              background: 'linear-gradient(135deg, #6b2147, #c4567a)',
              color: '#fff', border: 'none', borderRadius: 11,
              padding: '0.78rem 2rem', fontSize: 15, fontWeight: 500,
              cursor: 'pointer', width: '100%', letterSpacing: '0.3px',
            }}
          >
            Con mucho cariño 💐
          </button>
          <p style={{ fontSize: 12, color: '#bbb', marginTop: '0.75rem' }}>
            Se cierra automáticamente en {segundos}s
          </p>
        </div>
      </div>
    </div>
  )
}

