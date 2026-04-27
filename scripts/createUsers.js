import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bvopdxxofsbpnxoleimp.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2b3BkeHhvZnNicG54b2xlaW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE0NTc2NywiZXhwIjoyMDkyNzIxNzY3fQ.OdnNDJKaKSiVHXgeo7HyyZfbRg10pd0ndSZ64K5aZcM'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function createUsers() {
  console.log('Iniciando creación de usuarios...')
  
  // Crear admin
  const { data: admin, error: adminError } = await supabase.auth.admin.createUser({
    email: 'admin@mrlogistic.com',
    password: 'Admin2024*',
    email_confirm: true
  })
  
  if (adminError) {
    console.error('Error creando admin:', adminError.message)
  } else {
    console.log('Admin creado:', admin.user.id)
    // Insertar perfil admin
    const { error: p1Error } = await supabase.from('perfiles').upsert({
      id: admin.user.id,
      rol: 'admin',
      nombre: 'Administrador Principal'
    })
    if (p1Error) console.error('Error perfil admin:', p1Error.message)
    else console.log('Perfil admin vinculado.')
  }

  // Crear domiciliario
  const { data: domi, error: domiError } = await supabase.auth.admin.createUser({
    email: 'domiciliario@mrlogistic.com',
    password: 'Domi2024*',
    email_confirm: true
  })
  
  if (domiError) {
    console.error('Error creando domiciliario:', domiError.message)
  } else {
    console.log('Domiciliario creado:', domi.user.id)
    // Insertar perfil domiciliario
    const { error: p2Error } = await supabase.from('perfiles').upsert({
      id: domi.user.id,
      rol: 'domiciliario',
      nombre: 'Domiciliario Principal'
    })
    if (p2Error) console.error('Error perfil domiciliario:', p2Error.message)
    else console.log('Perfil domiciliario vinculado.')
  }

  console.log('Proceso finalizado.')
}

createUsers()
