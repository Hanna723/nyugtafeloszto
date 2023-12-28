import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';

import { ListComponent } from './list/list.component';
import { MemberRoutingModule } from './member-routing.module';

@NgModule({
  declarations: [ListComponent],
  imports: [CommonModule, MemberRoutingModule, MatListModule, MatTableModule],
})
export class MemberModule {}
