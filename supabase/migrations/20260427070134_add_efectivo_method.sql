ALTER TABLE guias DROP CONSTRAINT IF EXISTS guias_metodo_pago_check;

ALTER TABLE guias ADD CONSTRAINT guias_metodo_pago_check 
CHECK (metodo_pago IN ('nequi', 'pago_directo', 'efectivo'));
