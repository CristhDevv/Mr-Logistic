import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bvopdxxofsbpnxoleimp.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ2b3BkeHhvZnNicG54b2xlaW1wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzE0NTc2NywiZXhwIjoyMDkyNzIxNzY3fQ.OdnNDJKaKSiVHXgeo7HyyZfbRg10pd0ndSZ64K5aZcM'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function test() {
  const { data, error } = await supabase.from('perfiles').select('*')
  if (error) console.error('Error:', error.message)
  else console.log('Perfiles encontrados:', data.length)
}

test()
