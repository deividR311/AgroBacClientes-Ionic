import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ResourceService } from '../resource/resource.service';


@Injectable({
    providedIn: 'root'
})
export class ParametroService {
    constructor(private readonly httpClient: HttpClient,
                private readonly resourceService: ResourceService) { }

    ConsultarParametro(id): Observable<any> {
        const headers = this.resourceService.GetTransactionContext();
        const urlService = `${environment.urlService.url}ConsultarParametro?id=${id}`;
        return this.httpClient.get(urlService, {headers});
    }
}
