import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { PreviewComponent } from './preview/preview.component';
import { MatDialogModule } from '@angular/material/dialog';
import { MAT_DATE_LOCALE } from '@angular/material/core';

import { ListComponent } from './list/list.component';
import { MemberRoutingModule } from './member-routing.module';
import { MatCheckboxModule } from '@angular/material/checkbox';
@NgModule({
  declarations: [ListComponent, PreviewComponent],
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
    MatProgressBarModule,
    MatDialogModule,
    MatCheckboxModule,
  ],
  providers: [
    DatePipe,
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'hun',
    },
  ],
})
export class MemberModule {}
