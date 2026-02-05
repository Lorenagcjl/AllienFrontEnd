import { AfterViewInit, Component, ViewChild, OnInit, inject } from '@angular/core';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/demo/shared/shared.module';
import { InventarioMovimientoService } from 'src/app/@theme/services/inventariomovimiento.service';
import { InventarioMovimiento } from 'src/app/demo/models/inventariomovimiento.model';
import { AlertService } from 'src/app/@theme/services/alert.service';

@Component({
  selector: 'app-inventariomovimiento',
  standalone: true,
  imports: [
    CommonModule, 
    SharedModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatTableModule, 
    MatSortModule, 
    MatPaginatorModule, 
    MatProgressBarModule,
    MatIconModule
  ],
  templateUrl: './inventariomovimiento.html',
  styleUrl: './inventariomovimiento.scss'
})
export default class InventariomovimientoComponent implements OnInit, AfterViewInit {
  private inventarioService = inject(InventarioMovimientoService);
  private alertService = inject(AlertService);

  cargando: boolean = false;
  
  // Definición de todas las columnas basadas en tu interface
  displayedColumns: string[] = [
    'fecha', 
    'tipo', 
    'producto', 
    'serial',
    'cantidadEntrada', 
    'cantidadSalida', 
    'ubicacion',
    'referencia'
  ];
  
  dataSource = new MatTableDataSource<InventarioMovimiento>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit() {
    this.cargarMovimientos();
  }

  cargarMovimientos() {
    this.cargando = true;
    this.inventarioService.listar().subscribe({
      next: (data) => {
        this.dataSource.data = data;
        this.cargando = false;
      },
      error: (err) => {
        this.cargando = false;
        this.alertService.error('Error', 'No se pudo cargar el historial de inventario');
      }
    });
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    
    // Configuración personalizada para filtrar en objetos anidados
    this.dataSource.filterPredicate = (data: InventarioMovimiento, filter: string) => {
      const searchStr = `${data.tipo} ${data.fkProducto.nombre} ${data.fkUbicacion.nombre} ${data.referenciaTipo}`.toLowerCase();
      return searchStr.includes(filter);
    };
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }
}