import { Component, OnInit } from '@angular/core';
import { PersistenceService } from 'angular-persistence';
import { UnlockingService } from 'src/app/services/unlocking/unlocking.service';

@Component({
  selector: 'app-principal',
  templateUrl: './principal.page.html',
  styleUrls: ['./principal.page.scss'],
})
export class PrincipalPage implements OnInit {
  constructor(
    private readonly persistenceService: PersistenceService,
    private unlockingService : UnlockingService
  ) { }

  ngOnInit() {
    if ( this.persistenceService.get('Online') ) {
      this.unlockingService.UploadPendingChanges();
    }
  }
}