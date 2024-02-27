import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

import { ProfileRoutingModule } from './profile-routing.module';
import { PreviewComponent } from './preview/preview.component';
import { EditComponent } from './edit/edit.component';
import { FlexLayoutModule } from '@angular/flex-layout';

@NgModule({
  declarations: [PreviewComponent, EditComponent],
  imports: [
    CommonModule,
    ProfileRoutingModule,
    MatCardModule,
    MatButtonModule,
    FlexLayoutModule,
  ],
})
export class ProfileModule {}
