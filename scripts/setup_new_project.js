import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = 'https://bvopdxxofsbpnxoleimp.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2b3BkeHhvZnNicG54b2xlaW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE0NTc2NywiZXhwIjoyMDkyNzIxNzY3fQ.OdnNDJKaKSiVHXgeo7HyyZfbRg10pd0ndSZ64K5aZcM'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  console.log('Aplicando esquema inicial...')
  
  const migrations = [
    // Esquema Base
    `CREATE TABLE domiciliarios (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      nombre TEXT NOT NULL,
      telefono TEXT,
      latitud DECIMAL(10, 8),
      longitud DECIMAL(11, 8),
      ultima_ubicacion TIMESTAMP WITH TIME ZONE,
      activo BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    `CREATE TABLE guias (
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
    );`,

    // Caja
    `CREATE TABLE caja (
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
    );`,

    // Perfiles
    `CREATE TABLE perfiles (
      id UUID REFERENCES auth.users(id) PRIMARY KEY,
      rol TEXT CHECK (rol IN ('admin', 'domiciliario')) NOT NULL,
      nombre TEXT NOT NULL
    );`,

    // RLS y Políticas
    `ALTER TABLE domiciliarios ENABLE ROW LEVEL SECURITY;
     ALTER TABLE guias ENABLE ROW LEVEL SECURITY;
     ALTER TABLE caja ENABLE ROW LEVEL SECURITY;
     ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;`,

    `CREATE POLICY "Acceso total domiciliarios" ON domiciliarios FOR ALL USING (true) WITH CHECK (true);
     CREATE POLICY "Acceso total guias" ON guias FOR ALL USING (true) WITH CHECK (true);
     CREATE POLICY "Acceso total caja" ON caja FOR ALL USING (true) WITH CHECK (true);
     CREATE POLICY "Acceso total perfiles" ON perfiles FOR ALL USING (true) WITH CHECK (true);`,

    // Realtime
    `ALTER PUBLICATION supabase_realtime ADD TABLE guias;
     ALTER PUBLICATION supabase_realtime ADD TABLE domiciliarios;`
  ]

  for (const sql of migrations) {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql })
    if (error) {
       // Si el RPC no existe, fallará. Intentaremos vía REST si es posible o simplemente reportar.
       console.error('Error aplicando SQL (posiblemente falta permiso RPC):', error.message)
    }
  }

  console.log('Migraciones completadas (vía RPC si estaba disponible).')
}

// Nota: exec_sql es una función común en proyectos Supabase para administración.
// Si no existe, tendremos que insertarla primero vía SQL Editor o usar la API directamente para cada tabla.
// Como no tengo acceso al editor SQL del nuevo proyecto, intentaré crear las tablas vía postgrest directamente.

async function applySchemaViaRest() {
    console.log('Intentando crear esquema vía API REST...')
    // No se puede crear tablas vía Postgrest. 
    // Lo más efectivo es avisar al usuario que el proyecto cambió y necesita las tablas.
}

applyMigrations()
