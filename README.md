# 🎱 Sistema de Control y Gestión - Billar Chamo

Sistema integral y multiplataforma de control de mesas, cronometraje en vivo, pedidos de bar, inventario y arqueo de caja para clubes de billar. 

El proyecto está diseñado bajo una arquitectura modular de alto rendimiento que permite operar en red local (sin depender de internet) y que facilita el empaquetado como aplicación de escritorio y app táctil tipo Kiosco.

---

## 🎯 1. Objetivo del Proyecto

El objetivo principal es digitalizar y automatizar por completo las operaciones del club de billar a través de **3 entornos sincronizados en tiempo real**:

1. **Entorno 1 · PC de Control (Caja y Administración)**:
   * Mapa de mesas en vivo con cronómetros por segundo/minuto y cálculo automático de cobro.
   * Gestión de comandas y pedidos de bar (venta a mesas o venta directa en barra).
   * Control de inventario en tiempo real con descuento automático de stock y alertas de stock bajo.
   * Arqueo y cierre de turnos de caja discriminando métodos de pago (Efectivo, Nequi, Daviplata, Tarjeta).
   * Control de hardware (encendido y apagado de luces de mesas mediante relés).

2. **Entorno 2 · Monitor Táctil de 14" en Cada Mesa (Modo Kiosco)**:
   * Pantalla táctil para que los clientes vean su tiempo consumido y costo acumulado.
   * Marcador digital de carambolas / puntos interactivo.
   * Catálogo digital para pedir tragos, bebidas y snacks directamente a la barra.
   * Botón de "Llamar al Mesero" / "Pedir la Cuenta" con alertas visuales y sonoras en la PC de control.

3. **Entorno 3 · Smart TV Gigante (Marcadores Deportivos)**:
   * Visualización tipo transmisión deportiva con el estado de todas las mesas.
   * Marcador en vivo para partidas de campeonato, torneos y llaves eliminatorias.
   * Espacio para publicidad del local y promociones del bar.

---

## 🏛️ 2. Arquitectura Tecnológica y Metodología

### Stack Tecnológico:
* **Frontend**: [Next.js](https://nextjs.org/) 15 (React 19, TypeScript, Tailwind CSS, Lucide Icons).
* **Backend API**: [FastAPI](https://fastapi.tiangolo.com/) (Python 3.11+, Uvicorn, Pydantic v2).
* **Base de Datos**: [PostgreSQL](https://www.postgresql.org/) 18 (Local) con soporte 100% compatible con **Supabase** para migración futura a la nube.
* **Control de Versiones BD**: Tabla dedicada `versiones_bd` para trazabilidad de migraciones.

### Estrategia de Desarrollo y Viabilidad de App:
1. **Desarrollo Web Primero**: Se construye el núcleo de la aplicación web utilizando componentes reactivos y endpoints REST optimizados.
2. **Empaquetado Multi-Entorno**:
   * **PC de Control**: Se puede utilizar vía navegador web local o empaquetado como ejecutable `.exe` mediante **Tauri / Electron** para comunicación directa con impresoras térmicas ESC/POS y tarjetas de relés USB/Serial.
   * **Tablets de Mesa**: Se configuran como **PWA (Progressive Web App)** en pantalla completa / modo Kiosco (sin barras de navegador), dando la experiencia de una aplicación nativa Android.
   * **Smart TV**: Se consume directamente por URL local o TV Box.
3. **Resiliencia Local (Sin Internet)**:
   * Toda la base de datos corre en PostgreSQL local en la PC de caja.
   * La caída de conexión a internet no detiene ni el cronómetro de las mesas ni la facturación del bar.

---

## 📂 3. Estructura Actual del Proyecto

```text
Billard-/
├── backend/                             # API Backend desarrollada en FastAPI
│   ├── .venv/                           # Entorno virtual de Python con dependencias instaladas
│   ├── app/
│   │   ├── api/
│   │   │   ├── mesas.py                 # Apertura, cierre, cronómetro, luces y carambolas
│   │   │   ├── pedidos.py               # Gestión de pedidos y descuento de stock
│   │   │   ├── productos.py             # Categorías, productos y ajuste de inventario
│   │   │   ├── caja.py                  # Turnos, apertura de caja, movimientos y arqueo
│   │   │   └── alertas.py               # Llamados de mesas y notificaciones en vivo
│   │   └── core/
│   │       ├── config.py                # Configuración y variables de entorno
│   │       └── database.py              # Pool de conexiones a PostgreSQL
│   ├── main.py                          # Entrada principal FastAPI y middlewares CORS
│   └── requirements.txt                 # Dependencias Python
│
├── frontend/                            # Aplicación Frontend desarrollada en Next.js
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css              # Estilos globales y paleta de colores "Groza"
│   │   │   ├── layout.tsx               # Plantilla raíz
│   │   │   └── page.tsx                 # Entorno 1: PC de Control (Mapa de Mesas y Caja)
│   │   └── lib/
│   │       └── api.ts                   # Cliente HTTP para conectar con la API
│   ├── tailwind.config.js               # Configuración de diseño y colores
│   └── package.json                     # Dependencias de Node.js
│
├── database/migrations/                 # Scripts SQL para PostgreSQL local
│   └── 001_initial_schema.sql           # Esquema versión 1.0.0 (Tablas, Índices y Seeds)
│
├── supabase/migrations/                 # Migraciones listas para migración futura a Supabase
│   └── 20261109000000_initial_schema.sql
│
├── mockup_entorno1.html                  # Diseño de referencia PC de Control
├── mockup_entorno2_mesa.html            # Diseño de referencia Tablet de Mesa
├── mockup_entorno3_tv.html              # Diseño de referencia Pantalla Smart TV
│
├── iniciar.bat                          # Script de arranque automático en 1 clic para Windows
├── EJECUCION.md                         # Guía paso a paso de instalación y configuración
└── README.md                            # Documentación general del sistema
```

---

## 🗄️ 4. Modelo de Base de Datos (Versión 1.0.0)

La base de datos `Billard` cuenta con **13 tablas relacionales** organizadas por módulos:

1. **`versiones_bd`**: Registro de control de versiones y migraciones aplicadas.
2. **`usuarios`**: Personal del local (Administrador, Cajero, Mesero) con PIN numérico de acceso rápido.
3. **`mesas`**: Catálogo de mesas con su tipo (`tres_bandas`, `pool`, `libre`), tarifa horaria, estado (`disponible`, `en_juego`, etc.) y estado de luz.
4. **`sesiones_mesa`**: Tiempos de juego, minutos transcurridos, tarifas aplicadas y totales liquidados.
5. **`jugadores_sesion`**: Nombres de jugadores asignados y puntuación de carambolas en tiempo real.
6. **`categorias_producto`**: Clasificación del bar (Cervezas, Licores, Bebidas, Snacks, Cocina).
7. **`productos`**: Catálogo de inventario con precios de venta, costos y niveles de stock mínimo.
8. **`pedidos`**: Órdenes de consumo solicitadas (desde la mesa, barra o caja).
9. **`detalle_pedidos`**: Ítems solicitados con cantidad, precio unitario y notas de preparación.
10. **`turnos_caja`**: Control de apertura con base en efectivo, ventas discriminadas y arqueo con descuadre.
11. **`movimientos_caja`**: Registro de ingresos, ventas por método de pago y gastos/egresos del turno.
12. **`movimientos_inventario`**: Kardex de entradas, ventas y mermas.
13. **`alertas_mesa`**: Timbre en vivo para llamados de mesero o solicitud de cuenta.

---

## 🗺️ 5. Hoja de Ruta (Roadmap)

- [x] **Fase 1: Base de Datos y Entorno Local**
  - [x] Creación del esquema relacional en PostgreSQL local.
  - [x] Tabla de versionamiento (`versiones_bd`).
  - [x] Poblado de datos semilla (5 mesas, categorías y productos iniciales).
- [x] **Fase 2: Núcleo Backend y Conexión**
  - [x] Endpoints de mesas, cronómetros y sesiones en FastAPI.
  - [x] Endpoints de pedidos, inventario, caja y alertas.
- [x] **Fase 3: Entorno 1 (PC de Control)**
  - [x] Mapa de mesas en vivo con cronómetros calculados.
  - [x] Modal de apertura (Tiempo libre vs Prepago).
  - [x] Drawer de ventas y pedidos con descuento de inventario.
  - [x] Modal de liquidación y cobro de mesa.
  - [x] Lanzador automático `iniciar.bat`.
- [ ] **Fase 4: Vistas Complementarias del Entorno 1**
  - [ ] Módulo detallado de Arqueo y Cuadre de Caja.
  - [ ] Módulo de Gestión de Inventario y Kardex.
  - [ ] Módulo de Torneos y Brackets 1 vs 1.
- [ ] **Fase 5: Entorno 2 (Tablet Kiosco de Mesa)**
  - [ ] Interfaz táctil de 14" para cliente.
  - [ ] Marcador táctil de carambolas y pedido directo a barra.
- [ ] **Fase 6: Entorno 3 (Smart TV)**
  - [ ] Tablero gigante para TV HDMI con actualización en vivo.
- [ ] **Fase 7: Migración a Supabase y Empaquetado de App**
  - [ ] Habilitar Supabase Realtime para WebSockets en la nube.
  - [ ] Empaquetado de la PC de control con Tauri/Electron.
