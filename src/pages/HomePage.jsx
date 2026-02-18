import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { AppLayout } from '../components/layout/AppLayout'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card'
import { Spinner } from '../components/ui/spinner'
import { FileText, FolderOpen } from 'lucide-react'

export default function HomePage() {
  const [ultimoAviso, setUltimoAviso] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHomeData()
  }, [])

  const loadHomeData = async () => {
    setLoading(true)

    try {
      // Último aviso
      const { data: avisos } = await supabase
        .from('avisos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)

      setUltimoAviso(avisos?.[0] || null)

      // Últimos documentos
      const { data: docs } = await supabase
        .from('documentos')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)

      setDocumentos(docs || [])
    } catch (err) {
      console.error('Error cargando inicio:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold">Inicio</h1>
          <p className="text-muted-foreground">
            Información general del sindicato
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner className="w-8 h-8" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ÚLTIMO AVISO */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <FileText className="w-5 h-5" />
                <CardTitle>Último Aviso</CardTitle>
              </CardHeader>
              <CardContent>
                {ultimoAviso ? (
                  <>
                    <h3 className="font-semibold mb-2">
                      {ultimoAviso.titulo}
                    </h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">
                      {ultimoAviso.contenido}
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay avisos publicados
                  </p>
                )}
              </CardContent>
            </Card>

            {/* ÚLTIMOS DOCUMENTOS */}
            <Card>
              <CardHeader className="flex flex-row items-center gap-2">
                <FolderOpen className="w-5 h-5" />
                <CardTitle>Últimos Documentos</CardTitle>
              </CardHeader>
              <CardContent>
                {documentos.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No hay documentos disponibles
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {documentos.map(doc => (
                      <li key={doc.id} className="text-sm">
                        <a
                          href={doc.archivo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          {doc.titulo}
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
