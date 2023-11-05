import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ListComponent } from './list/list.component';
import { ReceiptRoutingModule } from './receipt-routing.module';

@NgModule({
  declarations: [ListComponent],
  imports: [CommonModule, ReceiptRoutingModule],
})
export class ReceiptModule {}
