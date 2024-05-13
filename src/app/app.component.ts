import { CommonModule } from '@angular/common';
import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject, throttleTime } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  fish: any[] = [{ id: 1, positionX: 50, positionY: 50, size: 1 }];
  foods: any[] = [];
  maxSize = 2.5; // Maximum size before resetting
  private animationFrameId: number = 0;
  musicStarted = false;  // Flag to ensure music plays only once
  private chompSound: HTMLAudioElement;
  
  @ViewChild('backgroundMusic') backgroundMusic: ElementRef<HTMLAudioElement>;



  ngOnInit(): void {
    this.startAnimationLoop();
    this.chompSound = new Audio('assets/audio/nom.mp3');
  }

  ngOnDestroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  @HostListener('click', ['$event'])
  dropFood(event: MouseEvent): void {
    if (!this.musicStarted) {
      this.backgroundMusic.nativeElement.play();
      this.musicStarted = true;  // Set flag to true after first play
    }
    const x = event.clientX; // Get the x coordinate of the click
    const y = event.clientY; // Get the y coordinate of the click
    const newFood = { x, y, active: true, falling: true };
    this.foods.push(newFood);
    
  }

  startAnimationLoop(): void {
    const updatePositions = () => {
        this.updateFoodPositions();
        this.updateFishPositions();
        this.updatePassiveFishMovements();
        this.reassignUnattendedFood(); // Re-check for unassigned food periodically
        this.animationFrameId = requestAnimationFrame(updatePositions);
    };
    this.animationFrameId = requestAnimationFrame(updatePositions);
}
playChompSound(): void {
  this.chompSound.play();
}

playMusic(): void {
  this.backgroundMusic.nativeElement.play();
}

pauseMusic(): void {
  this.backgroundMusic.nativeElement.pause();
}


  updateFoodPositions(): void {
    const gravity = 0.5; // Controls the speed of the fall
    this.foods.forEach((food, index) => {
      if (food.falling) {
        food.y += gravity; // Make the food fall
        if (food.y >= window.innerHeight - 100) { // Check if the food reaches the bottom
          food.falling = false; // Stop falling when reaching the bottom or a specific height
          this.foods.splice(index, 1);
        }
      }
    });
  }

  assignFoodToFishes(): void {
    this.foods.forEach(food => {
        if (!food.assignedFish && food.active) {
            let closestFish = this.findClosestFish(food);
            if (closestFish && !closestFish.target) {  // Ensure fish isn't already pursuing another target
                food.assignedFish = closestFish;
                closestFish.target = food;
            }
        }
    });
}
reassignUnattendedFood(): void {
  this.foods.filter(food => food.active && !food.assignedFish)
            .forEach(unassignedFood => this.assignFoodToFishes());
}
updatePassiveFishMovements(): void {
  this.fish.forEach(fish => {
      if (!fish.target) {  // Only move passively if not chasing food
          fish.positionX += Math.random() * 20 - 10; // Random small movement
          fish.positionY += Math.random() * 20 - 10;
          this.boundFishWithinTank(fish);
      }
  });
}

boundFishWithinTank(fish): void {
  // Ensure fish positions stay within the visual boundaries of the tank
  fish.positionX = Math.max(0, Math.min(window.innerWidth, fish.positionX));
  fish.positionY = Math.max(0, Math.min(window.innerHeight, fish.positionY));
}
findClosestFish(food): any {
  return this.fish.reduce((closest, f) => {
      const distanceToCurrentFish = Math.sqrt((f.positionX - food.x) ** 2 + (f.positionY - food.y) ** 2);
      const distanceToClosestFish = Math.sqrt((closest.positionX - food.x) ** 2 + (closest.positionY - food.y) ** 2);
      return distanceToCurrentFish < distanceToClosestFish ? f : closest;
  }, this.fish[0]);
}

updateFishPositions(): void {
  this.fish.forEach(fish => {
      if (fish.target) {
          const targetX = fish.target.x;
          const targetY = fish.target.y;
          fish.positionX += (targetX - fish.positionX) / 10;
          fish.positionY += (targetY - fish.positionY) / 10;

          // Check if fish has reached the food
          if (Math.abs(fish.positionX - targetX) < 5 && Math.abs(fish.positionY - targetY) < 5) {
              this.eatFood(fish, targetX, targetY);
              this.playChompSound();
              fish.target = null;  // Remove the target once the food is eaten
          }
      }
  });
}
  eatFood(fish, x: number, y: number): void {
    const index = this.foods.findIndex(food => food.x === x && food.y === y);
    if (index !== -1) {
      this.foods.splice(index, 1);
      fish.size *= 1.2;
      fish.target = null; // Clear the target after eating

      if (fish.size >= this.maxSize) {
        fish.size = 1;
        this.addNewFish();
      }
    }
  }

  addNewFish(): void {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
  
    const newFish = {
      id: this.fish.length + 1,
      positionX: Math.random() * screenWidth, 
      positionY: Math.random() * screenHeight,
      size: 1
    };
    this.fish.push(newFish);
  }
}