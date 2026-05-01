import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'

const HOY_KEY = 'modal_dia_trabajador_visto'

function esDiaTrabajador() {
  const hoy = new Date()
  return hoy.getMonth() === 4 && hoy.getDate() === 1 // mes 4 = Mayo (0-indexed)
}

function yaVisto() {
  const guardado = localStorage.getItem(HOY_KEY)
  if (!guardado) return false
  const hoy = new Date().toDateString()
  return guardado === hoy
}

function marcarVisto() {
  localStorage.setItem(HOY_KEY, new Date().toDateString())
}

export default function ModalDiaTrabajador() {
  const [visible, setVisible] = useState(false)
  const [segundos, setSegundos] = useState(5)

  useEffect(() => {
    if (esDiaTrabajador() && !yaVisto()) {
      setVisible(true)
    }
  }, [])

  useEffect(() => {
    if (!visible) return
    if (segundos <= 0) {
      cerrar()
      return
    }
    const timer = setTimeout(() => setSegundos(s => s - 1), 1000)
    return () => clearTimeout(timer)
  }, [visible, segundos])

  const cerrar = () => {
    marcarVisto()
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      onClick={cerrar}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: '1rem',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '400px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        }}
      >
        {/* Cabecera verde */}
        <div style={{ background: '#1e3a2f', padding: '2rem 2rem 1.5rem', textAlign: 'center' }}>
          {/* Puntos decorativos */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginBottom: '1.2rem' }}>
            {[1, 0.5, 1, 0.5, 1].map((op, i) => (
              <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: '#f5c518', opacity: op }} />
            ))}
          </div>

          {/* Ícono central */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#2d7a4f', border: '3px solid #f5c518',
            margin: '0 auto 1rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Users size={34} color="#f5c518" strokeWidth={1.8} />
          </div>

          <div style={{ fontSize: 11, letterSpacing: '2px', color: '#f5c518', fontWeight: 500, textTransform: 'uppercase', marginBottom: '0.4rem' }}>
            1 de Mayo
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color: '#ffffff', lineHeight: 1.3 }}>
            ¡Feliz Día<br />del Trabajador!
          </div>
        </div>

        {/* Cuerpo */}
        <div style={{ padding: '1.5rem 2rem 2rem', textAlign: 'center', background: '#ffffff' }}>
          <p style={{ fontSize: 15, color: '#1a1a1a', lineHeight: 1.7, margin: '0 0 0.5rem' }}>
            Hoy celebramos el esfuerzo, la dedicación y el trabajo de cada uno de nuestros socios.
          </p>
          <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6, margin: '0 0 1.5rem' }}>
            El Sindicato Interempresas Liberty Seguros les desea un merecido descanso junto a sus familias.
          </p>

          <div style={{ height: '0.5px', background: '#e5e7eb', marginBottom: '1.5rem' }} />

          <button
            onClick={cerrar}
            style={{
              background: '#1e3a2f',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              padding: '0.75rem 2rem',
              fontSize: 15,
              fontWeight: 500,
              cursor: 'pointer',
              width: '100%',
            }}
          >
            ¡Gracias!
          </button>

          <p style={{ fontSize: 12, color: '#999', marginTop: '0.75rem' }}>
            Se cierra automáticamente en {segundos}s
          </p>
        </div>
      </div>
    </div>
  )
}

