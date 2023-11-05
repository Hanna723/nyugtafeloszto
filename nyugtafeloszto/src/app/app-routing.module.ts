import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
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
    loadChildren: () => import('./group/group.module').then((m) => m.GroupModule),
  },
  {
    path: 'member',
    loadChildren: () => import('./member/member.module').then((m) => m.MemberModule),
  },
  {
    path: 'receipt',
    loadChildren: () => import('./receipt/receipt.module').then((m) => m.ReceiptModule),
  },
  {
    path: '',
    redirectTo: '/home',
    pathMatch: 'full',
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
