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
    title: 'Componentes',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'typography',
        title: 'Usuarios',
        type: 'item',
        classes: 'nav-item',
        url: '/component/typography',
        icon: '#custom-text-block',
        roles: ['Administrador']
      },
      {
        id: 'color',
        title: 'Clientes',
        type: 'item',
        classes: 'nav-item',
        url: '/component/color',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
      },
      {
        id: 'table',
        title: 'Productos',
        type: 'item',
        classes: 'nav-item',
        url: 'https://tabler-icons.io/',
        icon: '#custom-mouse-circle',
        target: true,
        external: true
      },
      {
        id: 'table',
        title: 'Ubicaciones',
        type: 'item',
        classes: 'nav-item',
        url: 'https://tabler-icons.io/',
        icon: '#custom-mouse-circle',
        target: true,
        external: true
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
            id: 'compra',
            title: 'Compra',
            type: 'item',
            url: '/component/compra',
            roles: ['Administrador', 'Empleado']
          },
          {
            id: 'detalleCompra',
            title: 'Detalle Compra',
            type: 'item',
            url: '/component/detalle-compra',
            roles: ['Administrador', 'Empleado']
          }
        ]
      }
    ]
  },
  {
    id: 'other',
    title: 'Other',
    type: 'group',
    icon: 'icon-navigation',
    children: [
      {
        id: 'menu-levels',
        title: 'Menu levels',
        type: 'collapse',
        icon: '#custom-level',
        children: [
          {
            id: 'level-2-1',
            title: 'Level 2.1',
            type: 'item',
            url: 'javascript:'
          },
          {
            id: 'menu-level-2.2',
            title: 'Menu Level 2.2',
            type: 'collapse',
            classes: 'edge',
            children: [
              {
                id: 'menu-level-3.1',
                title: 'Menu Level 3.1',
                type: 'item',
                url: 'javascript:'
              },
              {
                id: 'menu-level-3.2',
                title: 'Menu Level 3.2',
                type: 'item',
                url: 'javascript:'
              },
              {
                id: 'menu-level-3.3',
                title: 'Menu Level 3.3',
                type: 'collapse',
                classes: 'edge',
                children: [
                  {
                    id: 'menu-level-4.1',
                    title: 'Menu Level 4.1',
                    type: 'item',
                    url: 'javascript:'
                  },
                  {
                    id: 'menu-level-4.2',
                    title: 'Menu Level 4.2',
                    type: 'item',
                    url: 'javascript:'
                  }
                ]
              }
            ]
          },
          {
            id: 'menu-level-2.3',
            title: 'Menu Level 2.3',
            type: 'collapse',
            classes: 'edge',
            children: [
              {
                id: 'menu-level-3.1',
                title: 'Menu Level 3.1',
                type: 'item',
                url: 'javascript:'
              },
              {
                id: 'menu-level-3.2',
                title: 'Menu Level 3.2',
                type: 'item',
                url: 'javascript:'
              },
              {
                id: 'menu-level-3.3',
                title: 'Menu Level 3.3',
                type: 'collapse',
                classes: 'edge',
                children: [
                  {
                    id: 'menu-level-4.1',
                    title: 'Menu Level 4.1',
                    type: 'item',
                    url: 'javascript:'
                  },
                  {
                    id: 'menu-level-4.2',
                    title: 'Menu Level 4.2',
                    type: 'item',
                    url: 'javascript:'
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'sample-page',
        title: 'Sample Page',
        type: 'item',
        classes: 'nav-item',
        url: '/sample-page',
        icon: '#custom-notification-status'
      }
    ]
  }
];
