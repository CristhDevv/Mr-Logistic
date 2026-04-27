ALTER TABLE guias 
  DROP COLUMN IF EXISTS destinatario,
  DROP COLUMN IF EXISTS direccion,
  DROP COLUMN IF EXISTS entregado,
  ADD COLUMN IF NOT EXISTS tipo TEXT CHECK (tipo IN ('envio', 'entrega')),
  ADD COLUMN IF NOT EXISTS observaciones TEXT;

ALTER TABLE guias 
  DROP CONSTRAINT IF EXISTS guias_metodo_pago_check;

ALTER TABLE guias 
  ADD CONSTRAINT guias_metodo_pago_check 
  CHECK (metodo_pago IN ('nequi', 'pago_directo'));
