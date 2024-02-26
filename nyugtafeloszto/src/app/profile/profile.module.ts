import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ProfileRoutingModule } from './profile-routing.module';
import { PreviewComponent } from './preview/preview.component';
import { EditComponent } from './edit/edit.component';

@NgModule({
  declarations: [PreviewComponent, EditComponent],
  imports: [CommonModule, ProfileRoutingModule],
})
export class ProfileModule {}
