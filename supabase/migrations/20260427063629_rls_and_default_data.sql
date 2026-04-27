-- Activar RLS en ambas tablas
ALTER TABLE domiciliarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE guias ENABLE ROW LEVEL SECURITY;

-- Políticas para guias (acceso total por ahora)
CREATE POLICY "Acceso total guias" ON guias
  FOR ALL USING (true) WITH CHECK (true);

-- Políticas para domiciliarios (acceso total por ahora)
CREATE POLICY "Acceso total domiciliarios" ON domiciliarios
  FOR ALL USING (true) WITH CHECK (true);

-- Insertar el domiciliario por defecto
INSERT INTO domiciliarios (nombre, telefono, activo)
VALUES ('Domiciliario Principal', '0000000000', true);
