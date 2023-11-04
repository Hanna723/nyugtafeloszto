import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ListComponent } from './list/list.component';
import { MemberRoutingModule } from './member-routing.module';

@NgModule({
  declarations: [ListComponent],
  imports: [CommonModule, MemberRoutingModule],
})
export class MemberModule {}
