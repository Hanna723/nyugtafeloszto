import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { authGuard } from './shared/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then((m) => m.HomeModule),
  },
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: 'group',
    loadChildren: () =>
      import('./group/group.module').then((m) => m.GroupModule),
    canActivate: [authGuard],
  },
  {
    path: 'member',
    loadChildren: () =>
      import('./member/member.module').then((m) => m.MemberModule),
    canActivate: [authGuard],
  },
  {
    path: 'receipt',
    loadChildren: () =>
      import('./receipt/receipt.module').then((m) => m.ReceiptModule),
  },
  {
    path: 'profile',
    loadChildren: () =>
      import('./profile/profile.module').then((m) => m.ProfileModule),
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: '/home',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
