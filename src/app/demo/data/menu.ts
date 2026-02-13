import { Navigation } from 'src/app/@theme/types/navigation';

export const menus: Navigation[] = [
  {
    id: 'navigation',
    title: 'Navegación',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'Inicio',
        title: 'Inicio',
        type: 'item',
        classes: 'nav-item',
        url: '/admin-dashboard',
        icon: '#custom-status-up',
        roles: ['Administrador']
      },

      {
        id: 'inicio-empl',
        title: 'Inicio',
        type: 'item',
        url: '/empleado-dashboard',
        icon: '#custom-status-up',
        roles: ['Empleado']
      }
    ]
  },
  {
    id: 'ui-component',
    title: 'Catálogos',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'usuarios',
        title: 'Usuarios',
        type: 'item',
        classes: 'nav-item',
        url: '/component/usuarios',
        icon: '#custom-text-block',
        roles: ['Administrador']
      },
      {
        id: 'color',
        title: 'Cliente',
        type: 'item',
        classes: 'nav-item',
        url: '/component/color',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
      },
      {
            id: 'producto',
            title: 'Producto',
            type: 'item',
            classes: 'nav-item',
            url: '/component/producto',
            icon: '#custom-clipboard',
            roles: ['Administrador', 'Empleado']
          },
          {

        id: 'ubicacion',
        title: 'Ubicacion',
        type: 'item',
        classes: 'nav-item',
        url: '/component/ubicacion',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
      }

    ]
  },
  {
    id: 'other',
    title: 'Operaciones',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'nuevaCompra',
        title: 'Nueva Compra',
        type: 'item',
        classes: 'nav-item',
        url: '/component/nueva-compra',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
      },
      {
        id: 'nuevoMovimiento',
        title: 'Nuevo Movimiento',
        type: 'item',
        classes: 'nav-item',
        url: '/component/nuevo-movimiento',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
      },
      {
        id: 'nuevaVenta',
        title: 'Nueva Venta',
        type: 'item',
        classes: 'nav-item',
        url: '/component/nueva-venta',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
      }
    ]
  },
  {
  id: 'gestion',
  title: 'Gestión',
  type: 'group',
  icon: 'icon-navigation',
  children: [

    // =========================
    // OPERATIVO (ADMIN + EMPLEADO)
    // =========================
    {
      id: 'gestion-operativa',
      title: 'Gestión Operativa',
      type: 'collapse',
      icon: '#custom-level',
      roles: ['Administrador', 'Empleado'],
      children: [
        {
          id: 'comisionesMiUsuarios',
          title: 'Comisiones generadas',
          type: 'item',
          url: '/component/comisiones-mi-usuarios',
          roles: ['Administrador', 'Empleado']
        },
        
        {
          id: 'historialPrecioVenta',
          title: 'Historial de precios',
          type: 'item',
          url: '/component/historial-precios',
          roles: ['Administrador', 'Empleado']
        },
        {
          id: 'venta',
          title: 'Ventas',
          type: 'item',
          url: '/component/venta',
          roles: ['Administrador', 'Empleado']
        },
        {
          id: 'movimiento',
          title: 'Movimiento',
          type: 'item',
          url: '/component/movimiento',
          roles: ['Administrador', 'Empleado']
        },
        {
          id: 'inventariomovimiento',
          title: 'Inventario movimiento',
          type: 'item',
          url: '/component/inventariomovimiento',
          roles: ['Administrador', 'Empleado']
        }
      ]
    },

    // =========================
    // ADMINISTRATIVO (SOLO ADMIN)
    // =========================
    {
      id: 'gestion-admin',
      title: 'Gestión Administrativa',
      type: 'collapse',
      icon: '#custom-level',
      roles: ['Administrador'],
      children: [
        {
          id: 'comisionesUsuarios',
          title: 'Comisión por usuario',
          type: 'item',
          url: '/component/comisiones-usuarios',
          roles: ['Administrador']
        },
        {
          id: 'compraProducto',
          title: 'Compra de producto',
          type: 'item',
          url: '/component/compra-producto',
          roles: ['Administrador']
        },
        {
          id: 'compraProductoDetalle',
          title: 'Detalle compra producto',
          type: 'item',
          url: '/component/compra-producto-detalle',
          roles: ['Administrador']
        },
        {
          id: 'productoSerial',
          title: 'Producto serial',
          type: 'item',
          url: '/component/producto-serial',
          roles: ['Administrador']
        },
        
        {
          id: 'movimiento-detalle',
          title: 'Movimiento detalle',
          type: 'item',
          url: '/component/movimiento-detalle',
          roles: ['Administrador']
        },
        {
          id: 'venta-detalle-serial',
          title: 'Venta detalle serial',
          type: 'item',
          url: '/component/venta-detalle-serial',
          roles: ['Administrador']
        }
      ]
    }

  ]
},
  {
    id: 'other',
    title: 'Admin Catalogos',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'catalogos',
        title: 'Catalogos',
        type: 'item',
        classes: 'nav-item',
        url: '/component/catalogo',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
      }
    ]
  },
  {
    id: 'other',
    title: 'Configuracion IVA',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'catalogos',
        title: 'Establecer IVA',
        type: 'item',
        classes: 'nav-item',
        url: '/component/config-iva',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
      }
    ]
  }
];
