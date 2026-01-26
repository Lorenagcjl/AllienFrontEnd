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
        title: 'Clientes',
        type: 'item',
        classes: 'nav-item',
        url: '/component/color',
        icon: '#custom-clipboard',
        roles: ['Administrador', 'Empleado']
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
  }
];
