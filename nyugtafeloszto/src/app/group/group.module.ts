import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ListComponent } from './list/list.component';
import { GroupRoutingModule } from './group-routing.module';

@NgModule({
  declarations: [ListComponent],
  imports: [CommonModule, GroupRoutingModule],
})
export class GroupModule {}
