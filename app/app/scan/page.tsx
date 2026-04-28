'use client'

import { useState, useRef, useEffect } from 'react'
import { Scan, X, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react'

type Product = {
  product_name?: string
  brands?: string
  image_url?: string
  ingredients_text?: string
  nutriscore_grade?: string
  categories?: string
  quantity?: string
}

export default function PageScan() {
  const [scanning, setScanning]   = useState(false)
  const [barcode, setBarcode]     = useState('')
  const [product, setProduct]     = useState<Product | null>(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [manualCode, setManualCode] = useState('')
  const videoRef = useRef<HTMLDivElement>(null)
  const quaggaRef = useRef<any>(null)

  const fetchProduct = async (code: string) => {
    setLoading(true)
    setError(null)
    setProduct(null)
    try {
      const res = await fetch(`https://world.openbeautyfacts.org/api/v0/product/${code}.json`)
      const data = await res.json()
      if (data.status === 1) {
        setProduct(data.product)
        setBarcode(code)
      } else {
        // Fallback Open Food Facts
        const res2 = await fetch(`https://world.openfoodfacts.org/api/v0/product/${code}.json`)
        const data2 = await res2.json()
        if (data2.status === 1) {
          setProduct(data2.product)
          setBarcode(code)
        } else {
          setError('Produit non trouvé dans la base Open Beauty Facts.')
        }
      }
    } catch {
      setError('Erreur réseau.')
    }
    setLoading(false)
  }

  const startScan = async () => {
    setScanning(true)
    setError(null)
    // Import dynamique Quagga2
    try {
      const Quagga = (await import('@ericblade/quagga2')).default
      quaggaRef.current = Quagga
      Quagga.init({
        inputStream: {
          type: 'LiveStream',
          target: videoRef.current!,
          constraints: { facingMode: 'environment' },
        },
        decoder: { readers: ['ean_reader', 'ean_8_reader', 'code_128_reader'] },
      }, (err: any) => {
        if (err) { setError('Caméra indisponible'); setScanning(false); return }
        Quagga.start()
        Quagga.onDetected((result: any) => {
          const code = result.codeResult.code
          Quagga.stop()
          setScanning(false)
          fetchProduct(code)
        })
      })
    } catch {
      setError('Scanner non disponible.')
      setScanning(false)
    }
  }

  const stopScan = () => {
    quaggaRef.current?.stop()
    setScanning(false)
  }

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualCode.trim()) fetchProduct(manualCode.trim())
  }

  // Analyse compatibilité ingrédients (simplifié)
  const analyseIngredients = (text: string) => {
    const ingredients = text.toLowerCase()
    const problematic = [
      { name: 'Parabens', keywords: ['methylparaben', 'propylparaben', 'butylparaben'] },
      { name: 'Sulfates', keywords: ['sodium lauryl sulfate', 'sodium laureth sulfate', 'sls', 'sles'] },
      { name: 'Silicones', keywords: ['dimethicone', 'cyclomethicone', 'cyclopentasiloxane'] },
      { name: 'Alcool dénaturé', keywords: ['alcohol denat', 'denatured alcohol', 'sd alcohol'] },
    ]
    return problematic.filter(p => p.keywords.some(k => ingredients.includes(k)))
  }

  const reset = () => {
    setProduct(null)
    setBarcode('')
    setError(null)
    setManualCode('')
  }

  return (
    <div style={{ padding: '20px', maxWidth: 480, margin: '0 auto' }}>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: "'Cormorant Garamond',serif", fontWeight: 300, fontSize: 28, marginBottom: 4 }}>
          Scan produit
        </h1>
        <p style={{ color: 'var(--muted)', fontSize: 13 }}>Vérifie la compatibilité avec ton profil</p>
      </div>

      {/* Scanner actif */}
      {scanning && (
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <div ref={videoRef} style={{ borderRadius: 16, overflow: 'hidden', background: '#000', minHeight: 280 }} />
          <button
            onClick={stopScan}
            style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', padding: 8, cursor: 'pointer', color: '#fff' }}
          >
            <X size={18} />
          </button>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div style={{ width: 220, height: 80, border: '2px solid var(--accent)', borderRadius: 8, boxShadow: '0 0 0 9999px rgba(10,7,9,0.5)' }} />
          </div>
        </div>
      )}

      {/* Boutons action */}
      {!scanning && !product && (
        <div>
          <button className="nylva-btn-primary" onClick={startScan} style={{ marginBottom: 12 }}>
            <Scan size={16} style={{ display: 'inline', marginRight: 8 }} />
            Scanner un code-barres
          </button>

          <form onSubmit={handleManual} style={{ display: 'flex', gap: 8 }}>
            <input
              className="nylva-input"
              value={manualCode}
              onChange={e => setManualCode(e.target.value)}
              placeholder="Code-barres manuel (EAN)"
              style={{ flex: 1 }}
            />
            <button type="submit" className="nylva-btn-primary" style={{ width: 'auto', padding: '12px 16px' }}>
              OK
            </button>
          </form>

          {loading && (
            <div style={{ textAlign: 'center', padding: 40 }}>
              <div className="pulse" style={{ fontFamily: "'Cormorant Garamond',serif", fontSize: 48, color: 'var(--accent)' }}>◈</div>
            </div>
          )}

          {error && (
            <div style={{ background: 'rgba(232,127,160,0.1)', border: '1px solid rgba(232,127,160,0.3)', borderRadius: 10, padding: 12, marginTop: 12, color: 'var(--red)', fontSize: 13 }}>
              {error}
            </div>
          )}
        </div>
      )}

      {/* Résultat produit */}
      {product && (
        <div>
          <div className="nylva-card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
              {product.image_url && (
                <img src={product.image_url} alt="" style={{ width: 72, height: 72, objectFit: 'contain', borderRadius: 8, background: '#fff' }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, marginBottom: 4 }}>{product.product_name || 'Produit sans nom'}</p>
                {product.brands && <p style={{ color: 'var(--muted)', fontSize: 13 }}>{product.brands}</p>}
                {product.quantity && <p style={{ color: 'var(--muted)', fontSize: 12 }}>{product.quantity}</p>}
                <p style={{ color: 'var(--muted)', fontSize: 11, marginTop: 4, fontFamily: 'var(--font-mono)' }}>EAN: {barcode}</p>
              </div>
            </div>
          </div>

          {/* Analyse ingrédients */}
          {product.ingredients_text && (
            <div className="nylva-card" style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
                Ingrédients problématiques
              </p>
              {(() => {
                const issues = analyseIngredients(product.ingredients_text!)
                return issues.length === 0
                  ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green)' }}>
                      <CheckCircle size={16} />
                      <span style={{ fontSize: 13 }}>Aucun ingrédient problématique détecté</span>
                    </div>
                  )
                  : issues.map(issue => (
                    <div key={issue.name} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--amber)', marginBottom: 8 }}>
                      <AlertCircle size={16} />
                      <span style={{ fontSize: 13 }}>{issue.name} détecté</span>
                    </div>
                  ))
              })()}
            </div>
          )}

          {!product.ingredients_text && (
            <div className="nylva-card" style={{ marginBottom: 16 }}>
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>Liste d'ingrédients non disponible pour ce produit.</p>
            </div>
          )}

          <button className="nylva-btn-ghost" onClick={reset}>
            Scanner un autre produit
          </button>
        </div>
      )}
    </div>
  )
}
