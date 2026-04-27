import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bvopdxxofsbpnxoleimp.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2b3BkeHhvZnNicG54b2xlaW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE0NTc2NywiZXhwIjoyMDkyNzIxNzY3fQ.OdnNDJKaKSiVHXgeo7HyyZfbRg10pd0ndSZ64K5aZcM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listUsersAndGenSql() {
  const { data: { users }, error } = await supabase.auth.admin.listUsers()
  
  if (error) {
    console.error('Error listing users:', error.message)
    return
  }

  console.log('\n--- USUARIOS ENCONTRADOS ---')
  users.forEach(u => console.log(`${u.email}: ${u.id}`))

  const admin = users.find(u => u.email === 'admin@mrlogistic.com')
  const domi = users.find(u => u.email === 'domiciliario@mrlogistic.com')

  if (admin && domi) {
    console.log('\n--- SQL PARA COPIAR Y PEGAR EN EL DASHBOARD ---')
    console.log(`
-- 1. Crear tablas si no existen
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

-- 2. Insertar perfiles de usuarios creados
INSERT INTO perfiles (id, rol, nombre) VALUES ('${admin.id}', 'admin', 'Administrador Principal') ON CONFLICT DO NOTHING;
INSERT INTO perfiles (id, rol, nombre) VALUES ('${domi.id}', 'domiciliario', 'Domiciliario Principal') ON CONFLICT DO NOTHING;
    `)
  }
}

listUsersAndGenSql()
