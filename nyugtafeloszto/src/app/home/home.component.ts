import { Component, OnDestroy, OnInit } from '@angular/core';
import { ImageService } from '../shared/services/image.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  user?: string | null;
  images = {
    member: undefined,
    group: undefined,
    receipt: undefined,
  };
  imageSubscriptions: Subscription[] = [];

  constructor(private imageService: ImageService) {}

  ngOnInit(): void {
    this.user = localStorage.getItem('user');

    for (const key in this.images) {
      if (this.images.hasOwnProperty(key)) {
        const imageKey = key as keyof typeof this.images;
        const imageSubscription = this.imageService
          .getImage(`/home/${key}.png`)
          .subscribe((image) => {
            this.images[imageKey] = image;
          });
        this.imageSubscriptions.push(imageSubscription);
      }
    }
  }

  ngOnDestroy(): void {
    this.imageSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
