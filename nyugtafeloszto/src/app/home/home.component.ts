import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ImageService } from '../shared/services/image.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
  progressBar: boolean = false;
  user?: string | null;
  images = {
    member: undefined,
    group: undefined,
    receipt: undefined,
  };
  imageSubscriptions: Subscription[] = [];

  constructor(private imageService: ImageService) {}

  ngOnInit(): void {
    this.progressBar = true;
    this.user = localStorage.getItem('user');

    const images = localStorage.getItem('images');
    if (images) {
      this.images = JSON.parse(images);
      return;
    }

    for (const key in this.images) {
      if (this.images.hasOwnProperty(key)) {
        const imageKey = key as keyof typeof this.images;
        const imageSubscription = this.imageService
          .getImage(`/home/${key}.png`)
          .subscribe((image) => {
            this.images[imageKey] = image;
            console.log(this.images);
            localStorage.setItem('images', JSON.stringify(this.images));
          });
        this.imageSubscriptions.push(imageSubscription);
      }
    }
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.progressBar = false;
    }, 1000);
  }

  ngOnDestroy(): void {
    this.imageSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
  }
}
