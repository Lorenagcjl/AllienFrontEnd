import { Navigation } from 'src/app/@theme/types/navigation';

export const menus: Navigation[] = [
  {
    id: 'navigation',
    title: 'Navigation',
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
    title: 'Usuarios',
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
        id: 'movimiento',
        title: 'Movimiento',
        type: 'item',
        classes: 'nav-item',
        url: '/component/movimiento',
        icon: '#custom-text-block',
        roles: ['Administrador']
      },
      {

        id: 'ubicacion',
        title: 'Ubicacion',
        type: 'item',
        classes: 'nav-item',
        url: '/component/ubicacion',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
      },
      // {
      //   id: 'movimiento-detalle',
      //   title: 'Movimiento Detalle',
      //   type: 'item',
      //   classes: 'nav-item',
      //   url: '/component/movimiento-detalle',
      //   icon: '#custom-text-block',
      //   roles: ['Administrador']
      // },
      {
        id: 'venta-detalle-serial',
        title: 'Venta Detalle Serial',
        type: 'item',
        classes: 'nav-item',
        url: '/component/venta-detalle-serial',
        icon: '#custom-text-block',
        roles: ['Administrador']
      }
    ]
  },
  {
    id: 'producto',
    title: 'Productos',
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
            id: 'producto',
            title: 'Producto',
            type: 'item',
            url: '/component/producto',
            roles: ['Administrador', 'Empleado']
          },
          {
            id: 'productoSerial',
            title: 'Producto Serial',
            type: 'item',
            url: '/component/producto-serial',
            roles: ['Administrador', 'Empleado']
          }
        ]
      }
    ]
  },
  {
    id: 'compra',
    title: 'Compras',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'menu-levels',
        title: 'Compras Crud',
        type: 'collapse',
        icon: '#custom-level',
        children: [
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
          }
        ]
      }
    ]
  },
  {
    id: 'other',
    title: 'Ventas',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'venta',
        title: 'Ventas',
        type: 'item',
        classes: 'nav-item',
        url: '/component/venta',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
      }
    ]
  },
  {
    id: 'other',
    title: 'Nuevo Movimiento',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'nuevoMovimiento',
        title: 'Nuevo Movimiento',
        type: 'item',
        classes: 'nav-item',
        url: '/component/nuevo-movimiento',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
      }
    ]
  },
  {
    id: 'other',
    title: 'Nueva Venta',
    type: 'group',
    icon: 'icon-navigation',
    children: [
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
    id: 'other',
    title: 'Nueva Compra',
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
      }
    ]
  }
];
