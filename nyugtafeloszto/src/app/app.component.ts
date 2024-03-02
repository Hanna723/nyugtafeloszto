import { Component } from '@angular/core';
import { PreviewComponent } from './profile/preview/preview.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  title = 'nyugtafeloszto';
  image?: string;

  setImage(componentRef: any): void {
    if (!(componentRef instanceof PreviewComponent)) {
      return;
    }

    componentRef.uploadedImage.subscribe((image) => {
      this.image = image;
    });
  }
}
