import { NgModule } from '@angular/core';
import { CommonModule, DatePipe, NgFor } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';

import { ListComponent } from './list/list.component';
import { ReceiptRoutingModule } from './receipt-routing.module';
import { EditComponent } from './edit/edit.component';
import { PreviewComponent } from './preview/preview.component';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [ListComponent, EditComponent, PreviewComponent],
  imports: [
    CommonModule,
    ReceiptRoutingModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatChipsModule,
    MatDialogModule,
  ],
  providers: [
    DatePipe,
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'hun',
    },
  ],
})
export class ReceiptModule {}
