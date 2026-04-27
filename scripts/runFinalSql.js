const sql = `
CREATE TABLE IF NOT EXISTS domiciliarios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  telefono TEXT,
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8),
  ultima_ubicacion TIMESTAMP WITH TIME ZONE,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guias (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero_guia TEXT UNIQUE NOT NULL,
  metodo_pago TEXT CHECK (metodo_pago IN ('nequi', 'pago_directo', 'efectivo')),
  monto DECIMAL(10, 2) DEFAULT 0,
  bajado_sistema BOOLEAN DEFAULT FALSE,
  domiciliario_id UUID REFERENCES domiciliarios(id),
  fecha_registro TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fecha_entrega TIMESTAMP WITH TIME ZONE,
  tipo TEXT CHECK (tipo IN ('envio', 'entrega')),
  observaciones TEXT,
  entregado BOOLEAN DEFAULT FALSE,
  latitud DECIMAL(10, 8),
  longitud DECIMAL(11, 8)
);

CREATE TABLE IF NOT EXISTS caja (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  estado TEXT CHECK (estado IN ('abierta', 'cerrada')) DEFAULT 'abierta',
  nombre_apertura TEXT NOT NULL,
  base_caja DECIMAL(10,2) DEFAULT 0,
  base_domiciliario DECIMAL(10,2) DEFAULT 0,
  fecha_apertura TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  nombre_cierre TEXT,
  total_recaudado_oficina DECIMAL(10,2),
  total_recaudado_domiciliario DECIMAL(10,2),
  total_esperado_caja DECIMAL(10,2),
  observaciones_cierre TEXT,
  fecha_cierre TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS perfiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  rol TEXT CHECK (rol IN ('admin', 'domiciliario')) NOT NULL,
  nombre TEXT NOT NULL
);

ALTER TABLE domiciliarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE guias ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total domiciliarios" ON domiciliarios FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total guias" ON guias FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total caja" ON caja FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Acceso total perfiles" ON perfiles FOR ALL USING (true) WITH CHECK (true);

INSERT INTO perfiles (id, rol, nombre) VALUES ('5a17161b-4c11-4982-86c2-9b7084f54477', 'admin', 'Administrador Principal') ON CONFLICT DO NOTHING;
INSERT INTO perfiles (id, rol, nombre) VALUES ('2a9d4c68-09bf-4396-88bf-a8001fd5fd6b', 'domiciliario', 'Domiciliario Principal') ON CONFLICT DO NOTHING;
`;

async function run() {
  const projectId = 'bvopdxxofsbpnxoleimp';
  const token = 'sbp_20e3cdfe486939f472213fbfa783e2f4b9837bda';

  const res = await fetch('https://api.supabase.com/v1/projects/' + projectId + '/query', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: sql })
  });
  
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Response:', text);
}

run();
