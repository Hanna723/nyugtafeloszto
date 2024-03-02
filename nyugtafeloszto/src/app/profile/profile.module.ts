import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ImageCropperModule } from 'ngx-image-cropper';

import { ProfileRoutingModule } from './profile-routing.module';
import { PreviewComponent } from './preview/preview.component';
import { PasswordChangeComponent } from './password-change/password-change.component';
import { ImageUploadComponent } from './image-upload/image-upload.component';

@NgModule({
  declarations: [PreviewComponent, PasswordChangeComponent, ImageUploadComponent],
  imports: [
    CommonModule,
    ProfileRoutingModule,
    MatCardModule,
    MatButtonModule,
    FlexLayoutModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatIconModule,
    ImageCropperModule
  ],
})
export class ProfileModule {}
