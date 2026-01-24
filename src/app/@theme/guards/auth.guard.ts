import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const userRole = localStorage.getItem('role'); 

  

  if (!userRole) {
    
    router.navigate(['/auth/login']);
    return false;
  }

  const expectedRoles = route.data['roles'] as Array<string>;
  

  if (expectedRoles && !expectedRoles.includes(userRole)) {
    
    const target = userRole === 'Empleado' ? '/empleado-dashboard' : '/admin-dashboard';
    router.navigate([target]);
    return false;
  }

  
  return true;
};