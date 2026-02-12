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
    id: 'producto',
    title: 'CRUD',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'menu-levels',
        title: 'Productos Crud',
        type: 'collapse',
        icon: '#custom-level',
        children: [
          {
            id: 'comisionesMiUsuarios',
            title: 'Comisiones generadas',
            type: 'item',
            url: '/component/comisiones-mi-usuarios',
            roles: ['Administrador', 'Empleado']
          },
          {
            id: 'comisionesUsuarios',
            title: 'Comision de cada usuario',
            type: 'item',
            url: '/component/comisiones-usuarios',
            roles: ['Administrador', 'Empleado']
          },
          {
            id: 'historialPrecioVenta',
            title: 'Historial Precio Venta',
            type: 'item',
            url: '/component/historial-precios',
            roles: ['Administrador', 'Empleado']
          },
          {
            id: 'productoSerial',
            title: 'Producto Serial',
            type: 'item',
            url: '/component/producto-serial',
            roles: ['Administrador', 'Empleado']
          },
          {
            id: 'compraProducto',
            title: 'Compra Producto',
            type: 'item',
            url: '/component/compra-producto',
            roles: ['Administrador', 'Empleado']
          },
          {
            id: 'compraProductoDetalle',
            title: 'Detalle Compra Producto',
            type: 'item',
            url: '/component/compra-producto-detalle',
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
        roles: ['Administrador']
      },
      {
        id: 'movimiento-detalle',
        title: 'Movimiento Detalle',
        type: 'item',
        url: '/component/movimiento-detalle',
        roles: ['Administrador']
      },

      {
        id: 'venta-detalle-serial',
        title: 'Venta Detalle Serial',
        type: 'item',
        url: '/component/venta-detalle-serial',
        roles: ['Administrador']
      },

      {
        id: 'inventariomovimiento',
        title: 'Inventario Movimiento',
        type: 'item',
        url: '/component/inventariomovimiento',
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
