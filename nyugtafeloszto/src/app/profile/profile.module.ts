import { NgModule } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { AccountDeleteComponent } from './account-delete/account-delete.component';
import { MatTableModule } from '@angular/material/table';
import { ListComponent } from './list/list.component';
import { MatSortModule } from '@angular/material/sort';
import { MAT_DATE_LOCALE } from '@angular/material/core';

@NgModule({
  declarations: [
    PreviewComponent,
    PasswordChangeComponent,
    ImageUploadComponent,
    AccountDeleteComponent,
    ListComponent,
  ],
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
    ImageCropperModule,
    MatTableModule,
    MatSortModule,
  ],
  providers: [
    DatePipe,
    {
      provide: MAT_DATE_LOCALE,
      useValue: 'hun',
    },
  ],
})
export class ProfileModule {}
