import { Injectable } from '@angular/core';
import { AngularFireStorage, AngularFireUploadTask } from '@angular/fire/compat/storage';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ImageService {
  constructor(private storage: AngularFireStorage) {}

  getImage(url: string): Observable<any> {
    return this.storage.ref(url).getDownloadURL();
  }

  uploadImage(path: string, data: any): AngularFireUploadTask {
    return this.storage.upload(path, data);
  }

  deleteImage(url: string): Observable<any> {
    return this.storage.ref(url).delete();
  }
}
