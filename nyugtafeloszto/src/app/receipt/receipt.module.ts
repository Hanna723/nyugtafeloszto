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
import { MatNativeDateModule } from '@angular/material/core';
import { MatChipsModule } from '@angular/material/chips';

import { ListComponent } from './list/list.component';
import { ReceiptRoutingModule } from './receipt-routing.module';
import { EditComponent } from './edit/edit.component';

@NgModule({
  declarations: [ListComponent, EditComponent],
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
  ],
  providers: [DatePipe],
})
export class ReceiptModule {}
