const sql = `
-- Tabla de domiciliarios
CREATE TABLE domiciliarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  ultima_ubicacion TIMESTAMP WITH TIME ZONE,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de guías
CREATE TABLE guias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_guia TEXT NOT NULL UNIQUE,
  destinatario TEXT,
  direccion TEXT,
  metodo_pago TEXT CHECK (metodo_pago IN ('efectivo', 'transferencia', 'contraentrega', 'pagado')),
  monto DECIMAL(10, 2) DEFAULT 0,
  entregado BOOLEAN DEFAULT false,
  bajado_sistema BOOLEAN DEFAULT false,
  domiciliario_id UUID REFERENCES domiciliarios(id),
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_entrega TIMESTAMP WITH TIME ZONE
);
`;

async function run() {
  const res = await fetch('https://api.supabase.com/v1/projects/mmwrakffzsyhycolxcfr/query', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer sbp_20e3cdfe486939f472213fbfa783e2f4b9837bda',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

run();
