import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DetalleventaForm } from './detalleventa-form';

describe('DetalleventaForm', () => {
  let component: DetalleventaForm;
  let fixture: ComponentFixture<DetalleventaForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DetalleventaForm]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DetalleventaForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
