// import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
// import { AppRoutingModule } from './app/app-routing.module';
// import { AppComponent } from './app/app.component';
// import { importProvidersFrom } from '@angular/core';

// bootstrapApplication(AppComponent, {
//   providers: [importProvidersFrom(BrowserModule, AppRoutingModule)]
// }).catch((err) => console.error(err));

import { BrowserModule, bootstrapApplication } from '@angular/platform-browser';
import { AppRoutingModule } from './app/app-routing.module';
import { AppComponent } from './app/app.component';
import { importProvidersFrom, LOCALE_ID } from '@angular/core';

import { registerLocaleData } from '@angular/common';
import localeEsEc from '@angular/common/locales/es-EC';

registerLocaleData(localeEsEc);

bootstrapApplication(AppComponent, {
  providers: [
    importProvidersFrom(BrowserModule, AppRoutingModule),
    { provide: LOCALE_ID, useValue: 'es-EC' },
  ],
}).catch((err) => console.error(err));
