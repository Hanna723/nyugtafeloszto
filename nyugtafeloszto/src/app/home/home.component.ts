import { Component, OnInit } from '@angular/core';
import { ImageService } from '../shared/services/image.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  user?: string | null;
  images = {
    member: undefined,
    group: undefined,
    receipt: undefined,
  };

  constructor(private imageService: ImageService) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');

    for (const key in this.images) {
      console.log(key, this.images.hasOwnProperty(key));
      if (this.images.hasOwnProperty(key)) {
        const imageKey = key as keyof typeof this.images;
        console.log(imageKey);
        this.imageService.getImage(`/home/${key}.png`).subscribe((image) => {
          this.images[imageKey] = image;
          console.log(imageKey);
          console.log(this.images);
        });
      }
    }
  }
}
