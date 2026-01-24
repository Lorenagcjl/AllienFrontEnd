// angular import
import { Component, inject, OnInit} from '@angular/core';
import { Router } from '@angular/router';
// project import
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { LoginService } from 'src/app/@theme/services/login.service';

@Component({
  selector: 'app-nav-right',
  imports: [SharedModule],
  templateUrl: './toolbar-right.component.html',
  styleUrls: ['./toolbar-right.component.scss']
})
export class NavRightComponent {
  private loginService = inject(LoginService);
  private router = inject(Router);

  userName: string = '';
  userRole: string = '';


  ngOnInit() {
    this.userName = localStorage.getItem('username') || 'Usuario';
    this.userRole = localStorage.getItem('role') || 'Invitado';
  }
  
  handleLogout() {
    // Limpiamos los datos del navegador
    localStorage.clear();
    // Navegamos al login
    this.router.navigate(['/login']);
  }
  
}
