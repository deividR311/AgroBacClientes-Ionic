import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Obligation } from 'src/app/shared/model/Obligation';
import { environment } from '../../../environments/environment';
import { ResourceService } from '../resource/resource.service';


@Injectable({
    providedIn: 'root'
})
export class ObligationService {

    // hostVisitor
    rubrosAmount: number;
    obligation : Obligation;
    activeState: number = 1;
    //

    constructor(private readonly httpClient: HttpClient,
                private readonly resourceService: ResourceService) {
        this.obligation = new Obligation();
    }

    ConsultarCantidadRubros(idCase: number, obligacion: string): Observable<any> {
      const headers = this.resourceService.GetTransactionContext();
      const urlService = `${environment.urlService.url}ConsultaCantidadRubros?IdCase=${idCase}&CodigoObligacion=${obligacion}`;
      return this.httpClient.get(urlService,{ headers });
    }

    InsertarHostVisitor( objectValue: Obligation ): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}InsertarObligacion`;

        return this.httpClient.post(urlService, objectValue, { headers });
    }

    ConsultarHostVisitor( idCase: number, obligacion: string ): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
		const urlService = `${environment.urlService.url}ConsultaObligacion?idCase=${idCase}&codigoObligacion=${obligacion}`;
        return this.httpClient.get(urlService,{ headers });
    }

    // host visitor
  async saveHostVisitor( idCase: number, obligacion: string ) {
    if (this.resourceService.IsOnline()) {
      const hostVisitor = await this.getHostVisitor( idCase, obligacion );
      if (!hostVisitor) {
        const rubrosAmount = await this.getCantidadRubros( idCase, obligacion );
        if ( rubrosAmount > 0 ) {
          this.fillHostVisitor( idCase, obligacion );
          this.insertHostVisitor();
        }
      }
    }
  }

  async fillHostVisitor( idCase: number, obligacion: string ) {
    this.obligation.codigoObligacion = obligacion;
    this.obligation.idCase = idCase;
    this.obligation.estado = this.activeState;
    this.obligation.nombreCompleto = null;
    this.obligation.celular = null;
    this.obligation.numeroIdentificacion = null;
    this.obligation.tipoIdentificacion = null;
  }

  insertHostVisitor() {
    const request = this.InsertarHostVisitor( this.obligation );
    request.subscribe(
      (res) => {  }
    )
  }

  async getHostVisitor( idCase: number, obligacion: string ) {
    const request = this.ConsultarHostVisitor(idCase, obligacion);
    return new Promise((resolve) => {
      request.subscribe(async (res) => {
        const { resultData } = res;
        (resultData && resultData.length > 0) ? resolve(resultData[0]) : resolve(null);
      });
    })
  }
  // cantidad Rubros
  async getCantidadRubros( idCase: number, obligacion: string ) {
    const request = this.ConsultarCantidadRubros( idCase, obligacion );
    return new Promise((resolve) => {
      request.subscribe(
        async (res) => {
          const { resultData } = res;
          resolve(resultData[0]);
        }
      )
    })
  }
  // cantidad Rubros
  //
}
