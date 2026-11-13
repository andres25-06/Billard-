# Estado Actual del Proyecto · El Encuentro Tocano
**Fecha:** 2026-11-12  

---

## 1. Lo que ya está implementado y funcionando
- **Sidebar & Navegación (`Sidebar.tsx`)**:
  - Menú principal arriba (`Mapa de mesas`, `Ventas y pedidos`, `Inventario del bar`, `Caja y arqueo`, `Torneos`).
  - `Reportes` y `Ajustes y tarifas` ubicados en la parte inferior encima de `Cerrar sesión`, con indicador lateral sincronizado.
  - **Bloqueo PIN (`ModalPIN.tsx`)**: Teclado numérico de 3 columnas centrado.
- **Caja y Arqueo (`ViewCaja.tsx` + `page.tsx`)**:
  - Apertura obligatoria de caja al iniciar sesión por primera vez en el día (base fija hasta el cierre).
  - Panel de turno activo con 4 KPIs en una fila, registro de egresos menores, calculadora táctica de billetes COP y comprobante térmico 80mm imprimible.
- **Mapa de Mesas (`ViewMesas.tsx` + `backend/app/api/mesas.py`)**:
  - Modal de **Abrir Mesa** rediseñado (`Tiempo Libre` / `Prepago Fijado`), selector desplegable flotante de clientes desde PostgreSQL y modal rápido **Registrar Jugador** al presionar `Agregar`.
  - Marcador de carambolas en modo lectura en PC de control.
  - Slide-over de cobro (Efectivo / Nequi-Daviplata) con calculadora de devuelta sin scroll.
  - Notificación de pedido enviado mediante modal propio con auto-cierre a los 6 segundos.
- **Reportes (`ViewReportes.tsx`)**: *(Diseño listo, pendiente conectar datos reales)*
  - 3 KPIs, gráfica comparativa Mesas vs. Barra con eje Y en COP, popover de calendario visual por Días/Meses y modal de detalle de cierres de caja.
- **Torneos (`ViewTorneos.tsx`)**: *(Diseño listo, pendiente conectar datos reales)*
  - Fase de grupos ilimitados con scroll vertical, botones de agregar, editar y eliminar grupo, llaves eliminatorias y partidas en vivo.
- **Ajustes y Tarifas (`ViewConfiguracion.tsx`)**: *(Diseño listo, pendiente conectar datos reales)*
  - Tarifas de Tres Bandas y Pool, reglas de tiempo, personal/PIN y datos del club.

---

## 2. Estado de la Base de Datos (Lista para pruebas desde cero)
- Tablas operativas limpias (`turnos_caja`, `movimientos_caja`, `sesiones_mesa`, `jugadores_sesion`, `pedidos`, `detalle_pedidos`, `alertas_mesa`).
- **4 mesas** en estado `disponible`, **3 clientes**, **7 productos**, **1 usuario**.
- Test de integración creado en `backend/tests/test_mesas.py`.

---

## 3. Próximo paso al retomar
1. Probar en vivo el flujo completo de **Mapa de Mesas + Barra & Comandas + Caja y Arqueo** desde cero en `http://localhost:3000`.
2. Correr `backend/tests/test_mesas.py` con una mesa disponible para validar el ciclo completo.
3. Conectar a PostgreSQL los módulos de **Reportes**, **Torneos** y **Ajustes y Tarifas**.
