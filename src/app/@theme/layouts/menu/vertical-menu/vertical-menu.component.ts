// Angular import
import { Component, inject, input, OnInit, signal } from '@angular/core';
import { CommonModule, Location, LocationStrategy } from '@angular/common';

// project import
import { Navigation ,NavigationItem } from 'src/app/@theme/types/navigation';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { MenuItemComponent } from './menu-item/menu-item.component';
import { MenuCollapseComponent } from './menu-collapse/menu-collapse.component';
import { MenuGroupVerticalComponent } from './menu-group/menu-group.component';
import { menus } from 'src/app/demo/data/menu';

@Component({
  selector: 'app-vertical-menu',
  imports: [SharedModule, MenuItemComponent, MenuCollapseComponent, MenuGroupVerticalComponent, CommonModule],
  templateUrl: './vertical-menu.component.html',
  styleUrls: ['./vertical-menu.component.scss']
})
export class VerticalMenuComponent implements OnInit{
  private location = inject(Location);
  private locationStrategy = inject(LocationStrategy);

userRole: string = '';
userName: string = '';
  filteredMenus = signal<NavigationItem[]>([]);

  ngOnInit() {
    this.userName = localStorage.getItem('username') || 'Usuario';
    this.userRole = localStorage.getItem('role') || 'Invitado';
    this.filterMenuByRole();
  }

  filterMenuByRole() {
    
    const result = menus.map((group) => {
      return {
        ...group,
        children: group.children?.filter((item) => {
          return !item.roles || item.roles.includes(this.userRole);
        })
      };
    }).filter(group => group.children && group.children.length > 0);

    this.filteredMenus.set(result);
  }
  
  fireOutClick() {
    let current_url = this.location.path();
    const baseHref = this.locationStrategy.getBaseHref();
    if (baseHref) {
      current_url = baseHref + this.location.path();
    }
    const link = "a.nav-link[ href='" + current_url + "' ]";
    const ele = document.querySelector(link);
    if (ele !== null && ele !== undefined) {
      const parent = ele.parentElement;
      const up_parent = parent?.parentElement?.parentElement;
      const last_parent = up_parent?.parentElement;
      if (parent?.classList.contains('coded-hasmenu')) {
        parent.classList.add('coded-trigger');
        parent.classList.add('active');
      } else if (up_parent?.classList.contains('coded-hasmenu')) {
        up_parent.classList.add('coded-trigger');
        up_parent.classList.add('active');
      } else if (last_parent?.classList.contains('coded-hasmenu')) {
        last_parent.classList.add('coded-trigger');
        last_parent.classList.add('active');
      }
    }
  }

  accountList = [
    {
      icon: 'ti ti-user',
      title: 'Mi cuenta'
    },
    {
      icon: 'ti ti-settings',
      title: 'Configuraciones'
    },
    {
      icon: 'ti ti-lock',
      title: 'Lock Screen'
    },
    {
      icon: 'ti ti-power',
      title: 'Cerrar Sesion'
    }
  ];
}
