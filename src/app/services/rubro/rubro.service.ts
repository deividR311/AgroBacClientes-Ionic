import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { RubroCapitalTrabajo } from 'src/app/shared/model/rubroCapitalTrabajo';
import { RubroInfraestructuraAux } from 'src/app/shared/model/rubroInfraestructuraAux';
import { RubroTractores } from 'src/app/shared/model/rubroTractores';
import { environment } from '../../../environments/environment';
import { ResourceService } from '../resource/resource.service';


@Injectable({
    providedIn: 'root'
})
export class RubroService {
    constructor(private readonly httpClient: HttpClient,
                private readonly resourceService: ResourceService) { }


    InsertarRubroCapitalTrabajo(objectValue: RubroCapitalTrabajo,esDestanqueo?: boolean): Observable<any> {
        let destanqueo: string = "";  
        if(esDestanqueo != null && esDestanqueo != undefined){
            destanqueo = "?esDestanqueo=true";
        }
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}InsertarRubroCapitalTrabajo` + destanqueo;
        return this.httpClient.post(urlService, objectValue, { headers });
    }

    InsertarRubroTractores(objectValue: RubroTractores,esDestanqueo?: boolean): Observable<any> {
        let destanqueo: string = "";  
        if(esDestanqueo != null && esDestanqueo != undefined){
            destanqueo = "?esDestanqueo=true";
        }
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}InsertarRubroTractores` + destanqueo;
        return this.httpClient.post(urlService, objectValue, { headers });
    }

    InsertarRubroInfraestructura(objectValue: RubroInfraestructuraAux,esDestanqueo?: boolean): Observable<any> {
        let destanqueo: string = "";  
        if(esDestanqueo != null && esDestanqueo != undefined){
            destanqueo = "?esDestanqueo=true";
        }
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}InsertarRubroInfraestructura` + destanqueo;
        return this.httpClient.post(urlService, objectValue, { headers });
    }

    ConsultarRubroCapitalTrabajo(guid: string, obligacion: string, idCase: number): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}ConsultarRubroCapitalTrabajo?guid=${guid}&CodigoObligacion=${obligacion}&idcase=${idCase}`;
        return this.httpClient.get(urlService, { headers });
    }

    ConsultarRubroTractores(guid: string, obligacion: string, idCase: number): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}ConsultarRubroTractores?guid=${guid}&CodigoObligacion=${obligacion}&idcase=${idCase}`;
        return this.httpClient.get(urlService, { headers });
    }

    ConsultarRubroInfraestructura(guid: string, obligacion: string, idCase: number): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
		const urlService = `${environment.urlService.url}ConsultarRubroInfraestructura?guid=${guid}&CodigoObligacion=${obligacion}&idcase=${idCase}`;
        return this.httpClient.get(urlService,{ headers });
    }
}
