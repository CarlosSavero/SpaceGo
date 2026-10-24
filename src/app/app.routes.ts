import { Routes } from '@angular/router';

import { Inicio } from './inicio/inicio';

import { Buscar } from './buscar/buscar';

import { Alojamiento } from './alojamiento/alojamiento';

import { Favoritos } from './favoritos/favoritos';

import { Publicar } from './publicar/publicar';

import { Login } from './login/login';

export const routes: Routes = [

  { path: '', component: Inicio },

  { path: 'buscar', component: Buscar },

  { path: 'alojamiento', component: Alojamiento },

  { path: 'alojamiento/:id', component: Alojamiento },

  { path: 'favoritos', component: Favoritos },

  { path: 'publicar', component: Publicar },

  { path: 'login', component: Login },

  { path: '**', redirectTo: '' }

];