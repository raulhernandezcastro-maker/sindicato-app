import { useEffect, useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { X } from 'lucide-react'

// Se muestra solo el 21 de junio de cualquier año (fecha fija)
function esDiaPadreChile() {
  const hoy = new Date()
  return hoy.getMonth() === 5 && hoy.getDate() === 21 // mes 5 = junio (0-indexed)
}

export default function ModalDiaPadre() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!esDiaPadreChile()) return

    // Mostrar solo una vez por día
    const clave = 'modal_dia_padre_2026'
    const yaVisto = localStorage.getItem(clave)
    if (yaVisto) return

    const timer = setTimeout(() => {
      setOpen(true)
      localStorage.setItem(clave, '1')
    }, 800)

    return () => clearTimeout(timer)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 border-0 max-w-[95vw] w-[900px] rounded-2xl overflow-hidden shadow-2xl">
        {/* Botón cerrar */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 bg-black/30 hover:bg-black/50 text-white rounded-full p-1.5 transition-colors"
          aria-label="Cerrar"
        >
          <X size={18} />
        </button>

        {/* Imagen que ocupa todo el modal */}
        <img
          src="/dia_del_padre_modal.png"
          alt="Feliz Día del Padre"
          className="w-full h-auto block"
          draggable={false}
        />
      </DialogContent>
    </Dialog>
  )
}
