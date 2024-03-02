import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ImageCroppedEvent } from 'ngx-image-cropper';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
})
export class ImageUploadComponent {
  croppedImage: any = '';

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { imageChangedEvent: any },
    public dialogRef: MatDialogRef<ImageUploadComponent>
  ) {}

  imageCropped(event: ImageCroppedEvent) {
    if (event.objectUrl) {
      this.croppedImage = event.blob;
    }
  }

  saveCroppedImage() {
    this.dialogRef.close(this.croppedImage);
  }

  close(): void {
    this.dialogRef.close();
  }
}
