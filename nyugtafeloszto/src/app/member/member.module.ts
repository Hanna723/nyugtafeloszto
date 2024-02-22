import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';

import { ListComponent } from './list/list.component';
import { MemberRoutingModule } from './member-routing.module';
import { MatIconModule } from '@angular/material/icon';
@NgModule({
  declarations: [ListComponent],
  imports: [
    CommonModule,
    MemberRoutingModule,
    MatListModule,
    MatTableModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSortModule,
    MatIconModule,
  ],
})
export class MemberModule {}
