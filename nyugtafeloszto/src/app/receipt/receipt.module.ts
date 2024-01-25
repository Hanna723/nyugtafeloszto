import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { ListComponent } from './list/list.component';
import { ReceiptRoutingModule } from './receipt-routing.module';

@NgModule({
  declarations: [ListComponent],
  imports: [
    CommonModule,
    ReceiptRoutingModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
  ],
  providers: [DatePipe],
})
export class ReceiptModule {}
