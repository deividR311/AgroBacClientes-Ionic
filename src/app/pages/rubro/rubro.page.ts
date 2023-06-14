import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ObligationService } from 'src/app/services/obligation/obligation.service';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { Credit } from 'src/app/shared/model/credit';
import { Parametro } from 'src/app/shared/model/parametro';

@Component({
  selector: 'app-rubro',
  templateUrl: './rubro.page.html',
  styleUrls: ['./rubro.page.scss'],
})
export class RubroPage implements OnInit {
  obligacionesRequiresInternet = false;
  creditsUser: Array<Credit>;

  tiposDocumento: any;

  constructor(
    private readonly resourceService: ResourceService,
    private readonly router: Router,
    private readonly toasterService: ToasterService,
    private readonly obligationService : ObligationService) {
    this.tiposDocumento = new Array<Parametro>();
    this.tiposDocumento = this.router.getCurrentNavigation().extras.state;
  }

  ngOnInit() {
  }

  ionViewWillEnter() {
    this.GetHeadings();
    this.obligacionesRequiresInternet = false;
  }

  GetHeadings() {
    const test1 = this.resourceService.CheckPersistence('obligacion');
    const test2 = this.resourceService.CheckPersistence('credits');
    if ( test1 && test2) {
      const obligacion = this.resourceService.GetPersistenceValue('obligacion');
      const credits = JSON.parse(this.resourceService.GetPersistenceValue('credits'));
      this.creditsUser = credits.filter((f: { obligacion: any; }) => f.obligacion === obligacion);
      this.obligationService.saveHostVisitor( this.creditsUser[0].idCase, this.creditsUser[0].obligacion );
    }
  }

  CheckHeading(credit: Credit) {
    switch (Number(credit.tipoRubro)) {
      case Enumerator.HEADING_GROUP_THREE:
        this.resourceService.SetPersistenceValue('Heading', JSON.stringify(credit));
        this.router.navigate(['/infraestructure'], { state : this.tiposDocumento });
        break;
      case Enumerator.HEADING_GROUP_TWO:
        this.resourceService.SetPersistenceValue('Heading', JSON.stringify(credit));
        this.router.navigate(['/implements'], { state : this.tiposDocumento });
        break;
      case Enumerator.HEADING_GROUP_ONE:
        this.resourceService.SetPersistenceValue('Heading', JSON.stringify(credit));
        this.router.navigate(['/productive-unit'], { state : this.tiposDocumento });
        break;
      default:
        this.resourceService.GetResourceValues().then(
          (data) => {
            this.toasterService.PresentToastMessage(data['mobile.generics.InvalidHeading']);
          }
        );
    }
  }
}
