import React, { forwardRef } from 'react'

const FacturaPOS = forwardRef(({ guia }, ref) => {
  if (!guia) return null

  const fecha = new Date(guia.fecha_registro).toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div style={{ display: 'none' }}>
      <div 
        ref={ref} 
        style={{
          width: '58mm',
          padding: '2mm',
          backgroundColor: 'white',
          color: 'black',
          fontFamily: 'monospace',
          fontSize: '10px',
          lineHeight: '1.2'
        }}
      >
        {/* Encabezado */}
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold' }}>INTERRAPIDÍSIMO</div>
          <div>Villa Rica Cauca</div>
          <div>Cra 16 2-27</div>
          <div>Tel: 3218520024</div>
          <div>NIT: 16843021</div>
        </div>

        <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>
        <div style={{ textAlign: 'center', fontWeight: 'bold', marginBottom: '4px' }}>
          ----COMPROBANTE----
        </div>
        
        <div style={{ marginBottom: '2px' }}>
          Fecha: {fecha}
        </div>
        <div style={{ marginBottom: '4px', fontWeight: 'bold' }}>
          No. Guía: {guia.numero_guia}
        </div>

        <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Tipo:</span>
          <span style={{ fontWeight: 'bold' }}>{guia.tipo?.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Pago:</span>
          <span style={{ fontWeight: 'bold' }}>{guia.metodo_pago?.toUpperCase().replace('_', ' ')}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '2px' }}>
          <span>Valor:</span>
          <span style={{ fontWeight: 'bold' }}>${parseFloat(guia.monto).toLocaleString('es-CO')}</span>
        </div>

        <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>
        
        <div style={{ marginBottom: '2px' }}>Observaciones:</div>
        <div style={{ wordWrap: 'break-word', marginBottom: '4px' }}>
          {guia.observaciones || 'S/N'}
        </div>

        <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>
        
        <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
          Estado: {guia.bajado_sistema ? 'OK' : 'PEND'}
        </div>

        <div style={{ borderTop: '1px dashed black', margin: '4px 0' }}></div>
        
        <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '9px' }}>
          Gracias por preferirnos<br />
          Interrapidísimo<br />
          su aliado de confianza
        </div>

        {/* Padding final para el corte de la impresora */}
        <div style={{ height: '10mm' }}></div>
      </div>
      
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-content, .printable-content * {
            visibility: visible;
          }
          .printable-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm !important;
          }
        }
      `}</style>
    </div>
  )
})

export default FacturaPOS
