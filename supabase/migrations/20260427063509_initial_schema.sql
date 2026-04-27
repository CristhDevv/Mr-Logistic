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
