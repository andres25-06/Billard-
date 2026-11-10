-- ====================================================================
-- SISTEMA DE CONTROL DE BILLAR - ESQUEMA INICIAL DE BASE DE DATOS
-- Versión: 1.0.0
-- Diseñado para: PostgreSQL 14+ / Compatible con Supabase
-- ====================================================================

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ====================================================================
-- 1. CONTROL DE VERSIONES DE LA BASE DE DATOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS versiones_bd (
    id SERIAL PRIMARY KEY,
    version VARCHAR(50) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    aplicado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 2. USUARIOS Y PERSONAL (Roles, PIN de acceso rápido)
-- ====================================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE,
    pin_acceso VARCHAR(10) NOT NULL, -- PIN de 4 a 6 dígitos para ingreso rápido en barra/caja
    rol VARCHAR(20) NOT NULL DEFAULT 'cajero' CHECK (rol IN ('admin', 'cajero', 'mesero')),
    activo BOOLEAN DEFAULT true,
    creado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 3. MESAS DE BILLAR
-- ====================================================================
CREATE TABLE IF NOT EXISTS mesas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero INT NOT NULL UNIQUE,
    nombre VARCHAR(50) NOT NULL,
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('tres_bandas', 'pool', 'libre', 'snooker')),
    tarifa_por_hora NUMERIC(10,2) NOT NULL DEFAULT 15000.00,
    tarifa_fraccion_minutos INT NOT NULL DEFAULT 1,
    tarifa_minima NUMERIC(10,2) DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'en_juego', 'pausa', 'mantenimiento', 'reservada')),
    luz_encendida BOOLEAN DEFAULT false,
    ip_dispositivo VARCHAR(50),
    orden_visual INT DEFAULT 0,
    creado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 4. SESIONES DE MESA (Tiempo y estado de juego)
-- ====================================================================
CREATE TABLE IF NOT EXISTS sesiones_mesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mesa_id UUID NOT NULL REFERENCES mesas(id) ON DELETE RESTRICT,
    usuario_apertura_id UUID REFERENCES usuarios(id),
    usuario_cierre_id UUID REFERENCES usuarios(id),
    modalidad_tiempo VARCHAR(20) NOT NULL DEFAULT 'libre' CHECK (modalidad_tiempo IN ('libre', 'prepago')),
    minutos_prepago INT DEFAULT 0,
    hora_inicio TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    hora_fin TIMESTAMPTZ,
    minutos_totales INT DEFAULT 0,
    tarifa_hora_aplicada NUMERIC(10,2) NOT NULL,
    total_tiempo NUMERIC(10,2) DEFAULT 0.00,
    total_productos NUMERIC(10,2) DEFAULT 0.00,
    descuento NUMERIC(10,2) DEFAULT 0.00,
    total_final NUMERIC(10,2) DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'activa' CHECK (estado IN ('activa', 'pausada', 'finalizada', 'cancelada')),
    nota TEXT,
    creado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 5. JUGADORES POR SESIÓN (Marcadores de carambola y split de cuenta)
-- ====================================================================
CREATE TABLE IF NOT EXISTS jugadores_sesion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sesion_id UUID NOT NULL REFERENCES sesiones_mesa(id) ON DELETE CASCADE,
    posicion INT NOT NULL DEFAULT 1,
    nombre VARCHAR(100) NOT NULL,
    puntos_carambolas INT DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    creado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 6. CATEGORÍAS E INVENTARIO DE PRODUCTOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS categorias_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL UNIQUE,
    icono VARCHAR(50) DEFAULT 'package',
    color VARCHAR(30) DEFAULT '#4F5580',
    orden INT DEFAULT 0,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID NOT NULL REFERENCES categorias_producto(id) ON DELETE RESTRICT,
    codigo_barras VARCHAR(50),
    nombre VARCHAR(120) NOT NULL,
    descripcion TEXT,
    precio_venta NUMERIC(10,2) NOT NULL,
    precio_costo NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    stock_actual INT NOT NULL DEFAULT 0,
    stock_minimo INT NOT NULL DEFAULT 5,
    permite_inventario BOOLEAN DEFAULT true,
    activo BOOLEAN DEFAULT true,
    creado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 7. PEDIDOS (Reemplaza a comandas) Y DETALLE DE CONSUMOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_pedido VARCHAR(30) NOT NULL UNIQUE,
    sesion_id UUID REFERENCES sesiones_mesa(id) ON DELETE SET NULL,
    mesa_id UUID REFERENCES mesas(id) ON DELETE SET NULL,
    usuario_id UUID REFERENCES usuarios(id),
    origen VARCHAR(20) NOT NULL DEFAULT 'caja' CHECK (origen IN ('caja', 'tablet_mesa', 'barra', 'mesero')),
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'en_preparacion', 'servido', 'cancelado')),
    total_pedido NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    solicitado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    entregado_el TIMESTAMPTZ,
    nota TEXT
);

CREATE TABLE IF NOT EXISTS detalle_pedidos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    jugador_id UUID REFERENCES jugadores_sesion(id) ON DELETE SET NULL,
    cantidad INT NOT NULL CHECK (cantidad > 0),
    precio_unitario NUMERIC(10,2) NOT NULL,
    subtotal NUMERIC(10,2) NOT NULL,
    nota TEXT
);

-- ====================================================================
-- 8. CAJA: TURNOS Y MOVIMIENTOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS turnos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    monto_apertura_base NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    fecha_cierre TIMESTAMPTZ,
    total_ventas_tiempo NUMERIC(10,2) DEFAULT 0.00,
    total_ventas_productos NUMERIC(10,2) DEFAULT 0.00,
    total_efectivo_sistema NUMERIC(10,2) DEFAULT 0.00,
    total_transferencias_sistema NUMERIC(10,2) DEFAULT 0.00,
    total_tarjetas_sistema NUMERIC(10,2) DEFAULT 0.00,
    total_egresos NUMERIC(10,2) DEFAULT 0.00,
    efectivo_declarado_cierre NUMERIC(10,2) DEFAULT 0.00,
    diferencia_cierre NUMERIC(10,2) DEFAULT 0.00,
    estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN ('abierto', 'cerrado')),
    observaciones_cierre TEXT
);

CREATE TABLE IF NOT EXISTS movimientos_caja (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turno_id UUID NOT NULL REFERENCES turnos_caja(id) ON DELETE RESTRICT,
    sesion_id UUID REFERENCES sesiones_mesa(id) ON DELETE SET NULL,
    pedido_id UUID REFERENCES pedidos(id) ON DELETE SET NULL,
    tipo VARCHAR(25) NOT NULL CHECK (tipo IN ('venta_mesa', 'venta_barra', 'ingreso_manual', 'egreso_gasto', 'retiro_caja')),
    metodo_pago VARCHAR(25) NOT NULL CHECK (metodo_pago IN ('efectivo', 'nequi', 'daviplata', 'tarjeta_debito', 'tarjeta_credito', 'transferencia', 'mixto')),
    monto NUMERIC(10,2) NOT NULL,
    referencia_comprobante VARCHAR(100),
    descripcion TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    creado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 9. KARDEX / MOVIMIENTOS DE INVENTARIO
-- ====================================================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    tipo VARCHAR(25) NOT NULL CHECK (tipo IN ('entrada_compra', 'venta_pedido', 'merma', 'ajuste_inventario')),
    cantidad INT NOT NULL,
    stock_anterior INT NOT NULL,
    stock_nuevo INT NOT NULL,
    motivo TEXT,
    usuario_id UUID NOT NULL REFERENCES usuarios(id),
    creado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ====================================================================
-- 10. ALERTAS EN VIVO PARA MESAS (Llamar mesero / Pedir cuenta)
-- ====================================================================
CREATE TABLE IF NOT EXISTS alertas_mesa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mesa_id UUID NOT NULL REFERENCES mesas(id) ON DELETE CASCADE,
    tipo VARCHAR(30) NOT NULL DEFAULT 'llamado_mesero' CHECK (tipo IN ('llamado_mesero', 'solicitud_cuenta', 'alerta_tiempo')),
    mensaje VARCHAR(255) NOT NULL,
    atendida BOOLEAN DEFAULT false,
    atendida_por UUID REFERENCES usuarios(id),
    creado_el TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    atendida_el TIMESTAMPTZ
);

-- ====================================================================
-- 11. ÍNDICES DE RENDIMIENTO
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_mesas_estado ON mesas(estado);
CREATE INDEX IF NOT EXISTS idx_sesiones_estado ON sesiones_mesa(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_estado ON pedidos(estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_sesion ON pedidos(sesion_id);
CREATE INDEX IF NOT EXISTS idx_turnos_estado ON turnos_caja(estado);
CREATE INDEX IF NOT EXISTS idx_alertas_atendida ON alertas_mesa(atendida);

-- ====================================================================
-- 12. DISPARADOR (TRIGGER) PARA ACTUALIZACIÓN AUTOMÁTICA DE TIMESTAMP
-- ====================================================================
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_el = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_actualizar_usuarios BEFORE UPDATE ON usuarios FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE OR REPLACE TRIGGER trg_actualizar_mesas BEFORE UPDATE ON mesas FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE OR REPLACE TRIGGER trg_actualizar_sesiones BEFORE UPDATE ON sesiones_mesa FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();
CREATE OR REPLACE TRIGGER trg_actualizar_productos BEFORE UPDATE ON productos FOR EACH ROW EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- 13. REGISTRO DE VERSIÓN Y DATOS SEMILLA (SEED DATA)
-- ====================================================================
INSERT INTO versiones_bd (version, nombre, descripcion)
VALUES ('1.0.0', 'Esquema Inicial - Entorno 1 PC Control', 'Creación de tablas centrales: mesas, sesiones, pedidos, turnos_caja, productos e inventario sin fiados.')
ON CONFLICT (version) DO NOTHING;

-- Usuario Inicial por Defecto
INSERT INTO usuarios (nombre, email, pin_acceso, rol)
VALUES ('Andrés Ardila', 'admin@billar.com', '1234', 'admin')
ON CONFLICT DO NOTHING;

-- Mesas Iniciales (3 de Tres Bandas y 1 de Pool)
INSERT INTO mesas (numero, nombre, tipo, tarifa_por_hora, estado, luz_encendida, orden_visual)
VALUES
(1, 'Mesa 1 - Tres Bandas', 'tres_bandas', 18000.00, 'disponible', false, 1),
(2, 'Mesa 2 - Tres Bandas', 'tres_bandas', 18000.00, 'disponible', false, 2),
(3, 'Mesa 3 - Tres Bandas', 'tres_bandas', 18000.00, 'disponible', false, 3),
(4, 'Mesa 4 - Pool',        'pool',        14000.00, 'disponible', false, 4)
ON CONFLICT (numero) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    tipo = EXCLUDED.tipo,
    tarifa_por_hora = EXCLUDED.tarifa_por_hora,
    orden_visual = EXCLUDED.orden_visual;

-- Categorías de Productos
INSERT INTO categorias_producto (nombre, icono, color, orden)
VALUES 
('Cervezas Nacionales', 'beer', '#1FA37A', 1),
('Cervezas Importadas', 'wine', '#383E5C', 2),
('Licores y Botellas', 'glass-water', '#7E22CE', 3),
('Tragos y Cocteles', 'cup-soda', '#E0535F', 4),
('Bebidas no alcohólicas', 'coffee', '#0284C7', 5),
('Snacks y Mecatos', 'cookie', '#D99A1E', 6)
ON CONFLICT (nombre) DO NOTHING;

-- Productos Iniciales
INSERT INTO productos (categoria_id, codigo_barras, nombre, precio_venta, precio_costo, stock_actual, stock_minimo)
SELECT id, '7702001', 'Cerveza Poker 330ml', 6000.00, 3800.00, 48, 12 FROM categorias_producto WHERE nombre = 'Cervezas Nacionales'
UNION ALL
SELECT id, '7702002', 'Cerveza Club Colombia Dorada', 7000.00, 4200.00, 36, 12 FROM categorias_producto WHERE nombre = 'Cervezas Nacionales'
UNION ALL
SELECT id, '7702003', 'Cerveza Corona 355ml', 9000.00, 5800.00, 24, 6 FROM categorias_producto WHERE nombre = 'Cervezas Importadas'
UNION ALL
SELECT id, '7702004', 'Aguardiente Antioqueño Media', 45000.00, 31000.00, 10, 3 FROM categorias_producto WHERE nombre = 'Licores y Botellas'
UNION ALL
SELECT id, '7702005', 'Ron Medellín Añejo Media', 48000.00, 33000.00, 8, 3 FROM categorias_producto WHERE nombre = 'Licores y Botellas'
UNION ALL
SELECT id, '7702006', 'Agua Cristal con Gas 600ml', 4000.00, 1800.00, 20, 6 FROM categorias_producto WHERE nombre = 'Bebidas no alcohólicas'
UNION ALL
SELECT id, '7702007', 'Papas Margarita Pollo', 3500.00, 2100.00, 30, 8 FROM categorias_producto WHERE nombre = 'Snacks y Mecatos'
ON CONFLICT DO NOTHING;
