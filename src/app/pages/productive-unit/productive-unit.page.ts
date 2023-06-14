import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ResourceService } from 'src/app/services/resource/resource.service';
import { ToasterService } from 'src/app/services/toaster/toaster.service';
import { Credit } from 'src/app/shared/model/credit';
import { Support } from 'src/app/shared/model/support';
import { Thumbnail } from 'src/app/shared/model/thumbnail';
import { AlertController, Platform } from '@ionic/angular';
import { RubroService } from 'src/app/services/rubro/rubro.service';
import { Enumerator } from 'src/app/shared/enum/enumerator.enum';
import { RubroCapitalTrabajo } from 'src/app/shared/model/rubroCapitalTrabajo';
import { entidadConsultaRubros } from 'src/app/shared/model/EntidadConsultaRubros';
import { RubroActividad } from 'src/app/shared/model/rubroActividad';
import { ParametroService } from 'src/app/services/Parametro/parametro.service';
import { Parametro } from 'src/app/shared/model/parametro';
import { AuxiliarEditaActividad } from 'src/app/shared/model/auxiliarEditaActividad';
import { MetaDataFoto } from 'src/app/shared/model/metadataFoto';
import { Photo } from 'src/app/shared/model/Photo';
import { environment } from 'src/environments/environment';
import { PersistenceService } from 'angular-persistence';
import { DatabaseComponent } from 'src/app/shared/components/database/database.component';
import { SQLite } from '@ionic-native/sqlite/ngx';
import { forkJoin } from 'rxjs';
import { EntidadMetadataAux } from 'src/app/shared/model/EntidadMetadataAux';
import { EntidadParametroAux } from 'src/app/shared/model/EntidadParametroAux';
import { Guid } from 'guid-typescript';
import { RubroEntity } from 'src/app/shared/model/rubroEntity';
import { LoadingService } from 'src/app/services/loading/loading.service';
import { Login } from 'src/app/shared/model/login';
import { getDocumentTypeRubro } from 'src/app/shared/core/helpers';

@Component({
  selector: 'app-productive-unit',
  templateUrl: './productive-unit.page.html',
  styleUrls: ['./productive-unit.page.scss'],
})
export class ProductiveUnitPage implements OnInit {
  @ViewChild(DatabaseComponent) databaseComponent: DatabaseComponent;
  credit: Credit;
  productiveUnitFormGroup: FormGroup;
  tiposSoportes: Array<Array<Thumbnail>>;
  supportTypeList: Array<Support>;
  supportTypeListAux: Array<MetaDataFoto>;
  executedCostMaxValue: number;
  mensajeboton: false;
  rubroEntity: RubroCapitalTrabajo;
  entidadConsulta: entidadConsultaRubros;
  heading: any;
  ListaActividad: Array<RubroActividad>;
  parametroActividad: Array<Parametro>;
  parametroType: Array<Parametro>;
  parametroMaximoActividad: Parametro;
  minPhotosProyectoFinaciado: number;
  maxPhotosProyectoFinaciado: number;
  minSizePhotosParm: number;
  maxSizePhotosParm: number;
  cantidadMinimaFotos = false;
  actividadesValidas = false;
  idAux = 0;
  dataBaseOffline = new DatabaseComponent(this.sqlite, this.persistenceService);
  userLogged : Login;

  //document type
  documentType : number;
  tiposDocumento: any;

  constructor(
    private readonly alertController: AlertController,
    private readonly formBuilder: FormBuilder,
    private readonly parametroService: ParametroService,
    private readonly persistenceService: PersistenceService,
    private readonly resourceService: ResourceService,
    private readonly router: Router,
    private readonly rubroService: RubroService,
    private readonly toasterService: ToasterService,
    private readonly sqlite: SQLite,
    private readonly loadingService: LoadingService,
  ) {
    this.rubroEntity = new RubroCapitalTrabajo();
    this.executedCostMaxValue = 150000000;
    this.entidadConsulta = new entidadConsultaRubros();
    this.ListaActividad = new Array<RubroActividad>();
    this.parametroActividad = new Array<Parametro>();
    this.parametroMaximoActividad = new Parametro();
    this.supportTypeList = new Array<Support>();
    this.userLogged = this.resourceService.GetUser();
    this.tiposDocumento = new Array<Parametro>();
  }

  ngOnInit() {
    this.InitializeForm();
    this.GetHeading();
    this.InitializeMachinerySupportType();

    this.tiposDocumento = this.router.getCurrentNavigation().extras.state;
  }

  async ionViewWillEnter() {
    this.GetHeading();
    this.InitializeForm();


    if (this.resourceService.IsOnline()) {
      if (!this.resourceService.CheckPersistence('ListaActividad')) {
        this.ConsultarRubroCapitalTrabajo();
      }

      this.ConsultarParametroActividad();
      this.ConsultarParametroGetId();
      await this.CatalogosCantidadFotos();
    } else {
      if (this.resourceService.IsDevice()) {
        if (!this.resourceService.CheckPersistence('ListaActividad')) {
          this.ConsultarRubroCapitalTrabajoOffline();
        }
        await this.ConsultarParametroActividadOffline();
        await this.ConsultarParametroGetIdOffline();
        await this.CatalogosCantidadFotosOffline();
      }
    }
    await this.ValidarChecPersitence();
  }

  InitializeForm() {
    this.productiveUnitFormGroup = this.formBuilder.group({
      foto: [],
    });
  }

  InitializeMachinerySupportType() {
    this.supportTypeList = [
      {
        description: ' Fotografia Proyecto Financiado',
        minPictures: this.minPhotosProyectoFinaciado,
        maxPictures: this.maxPhotosProyectoFinaciado,
        maxSizeHeight: 1080,
        maxSizeWidth: 1920,
        maxWeight: this.maxSizePhotosParm,
        minWeight: this.minSizePhotosParm,
        requireMetaData: true,
        thumbnails: [],
      }
    ];
    this.supportTypeListAux = [];

  }

  GetHeading() {
    // Invalid Heading
    if (!this.resourceService.CheckPersistence('Heading')) {
      this.resourceService.GetResourceValues().then((data) => {
        this.toasterService.PresentToastMessage(
          data['mobile.generics.InvalidHeading']
        );
      });
      this.router.navigate(['/credits']);
    } else {
      this.credit = JSON.parse(this.resourceService.GetPersistenceValue('Heading'));
    }
  }

  async HandleMedia(event: Thumbnail, index: number) {

    if (await this.ValidarformatoImagen(event.src)) {
      if (await this.CheckImageSize(event.src, index)) {
        this.supportTypeList[index].thumbnails.push({
          id: event.id,
          src: event.src,
          photoBase64: event.photoBase64,
          metadata: event.metadata
        });
      }
    }
    this.validarBotonGuardar();
  }

  async DeleteMedia(x: number, y: number) {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      header: 'Confirmación',
      message: '<strong>¿Está seguro que desea eliminar esta foto? </strong>' +
              '<p class="alertmsg">RECUERDE QUE LOS CAMBIOS SOLO SE APLICARÁN UNA VEZ DE CLICK EN EL BOTÓN GUARDAR DE ESTE FORMULARIO</p>',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => { },
        },
        {
          text: 'Aceptar',
          handler: () => {
            var o = this.supportTypeList[x].thumbnails[y].metadata;
            this.supportTypeList[x].thumbnails.splice(y, 1);
            if(o !== undefined && o != null)
            {
              o.id = -1;
              o.tipo = 0;
              this.supportTypeListAux.push(o);
            }
            this.validarBotonGuardar();
          },
        },
      ],
    });
    await alert.present();
  }

  async window() {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      message: 'Debe agregar los soportes fotográficos que evidencien la ejecución de los recursos financiados, como Facturas, Pagos de nóminas o Certificados por contador con respectiva tarjeta profesional',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => { },
        },
        {
          text: 'Aceptar',
          handler: () => {
            const auxiliarEditaActividad = new AuxiliarEditaActividad();
            auxiliarEditaActividad.estado = true;
            auxiliarEditaActividad.indiceEdita = 0;

            this.resourceService.SetPersistenceValue('RegisterOrUpdate',
              JSON.stringify(auxiliarEditaActividad));
            this.resourceService.SetPersistenceValue('ListaActividad', JSON.stringify(this.ListaActividad));
            this.router.navigate(['/actividad']);
          },
        },
      ],
    });
    await alert.present();
  }

  accion(v) {
    this.mensajeboton = v;
  }

  async DeleteActivity(x: number) {
    const alert = await this.alertController.create({
      cssClass: 'contenedor-principal',
      header: 'Confirmación',
      message: '<strong>¿Está seguro que desea eliminar esta actividad de inversión?</strong>',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => { },
        },
        {
          text: 'Aceptar',
          handler: () => {
            this.eliminarActividadLista(x);
          },
        },
      ],
    });
    await alert.present();
  }


  async ConsultarRubroCapitalTrabajo() {
    this.heading = JSON.parse(this.resourceService.GetPersistenceValue('Heading'));
    const { guidRubro, obligacion, idCase } = this.heading;
    
    this.rubroService.ConsultarRubroCapitalTrabajo(guidRubro, obligacion, idCase)
      .subscribe(
        async (res) => {
          if (res.resultData !== null) {
            this.rubroEntity = res.resultData[0];
            this.idAux = this.rubroEntity.rubro.id;
            res.resultData[0].rubro.guid = this.credit.guidRubro;
            this.ListaActividad =  res.resultData[0].listaActividades != null ?
            res.resultData[0].listaActividades : this.ListaActividad;

            if (this.resourceService.IsDevice()) {
              // Inserta informacion del rubro en la tabla sqlite
              if (res.resultData[0].rubro.listaMetaDataFoto !== null) {
                this.InsertarSQLite(res.resultData[0].rubro, res.resultData[0].listaActividades);
              }
            }
            const arregloMetadata = [];
            if (res.resultData[0].rubro.listaMetaDataFoto !== null) {
              for (const metadata of res.resultData[0].rubro.listaMetaDataFoto) {
                arregloMetadata.push(metadata);
              }

              if (res.resultData[0].listaActividades != null) {
                for (const actividad of res.resultData[0].listaActividades) {
                  if (actividad.listaMetaDataFoto !== null) {
                    for (const metadata of actividad.listaMetaDataFoto) {
                      arregloMetadata.push(metadata);
                    }
                  }
                }
              }
            }

            await this.FillPhotos(arregloMetadata);
            this.validarBotonGuardar();
          } else {
            this.idAux = 0;
          }
        },
        (err) => { }
      );
  }

  async ValidarChecPersitence() {
    if (this.resourceService.CheckPersistence('ListaActividad')) {
      this.ListaActividad = JSON.parse(this.resourceService.GetPersistenceValue('ListaActividad'));
      this.rubroEntity.listaActividades = new Array<RubroActividad>();

      if (this.parametroActividad.length > 0) {
        this.ListaActividad.forEach(actividad => {

          const desc = this.parametroActividad.find(parametro =>
            parametro.id.toString() === actividad.idActividad.toString());

          if (desc.descripcion !== undefined) {
            actividad.descripcionActividad = desc.descripcion;
          }

          this.rubroEntity.listaActividades.push(actividad);
        });
      } else {
        this.resourceService.ClearPersistenceKey('ListaActividad');
      }

      this.validarBotonGuardar();
    }
  }

  ConsultarParametroActividad() {
    this.parametroService.ConsultarParametro(Enumerator.ID_ACTIVIDAD)
      .subscribe(
        async (res) => {
          this.parametroActividad = res.resultData;
          // Esta informacion se guarda en tablas locales
          if (this.resourceService.IsDevice()) {
            this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
            await this.dataBaseOffline.deleteDataParametro(Enumerator.ID_ACTIVIDAD);
            for (const parametro of this.parametroActividad) {
              this.dataBaseOffline.insertDataParametro(parametro, Enumerator.ID_ACTIVIDAD);
            }
            const datos = await this.dataBaseOffline.selectDataParametro(Enumerator.ID_ACTIVIDAD);
          }
        },
        (err) => { }
      );
  }


  eliminarActividadLista(id) {
    /* Borramos la actividad de la lista */
    if(this.rubroEntity.listaActividades[id].id > 0)
      this.rubroEntity.listaActividades[id].id *= -1;
    else
    {
      this.rubroEntity.listaActividades.splice(id, 1);
      this.ListaActividad.splice(id, 1);
    }
      
    this.validarBotonGuardar();
  }

  edit(actividad, index) {
    /* Buscamos el resgitro en la lista */
    const auxiliarEditaActividad = new AuxiliarEditaActividad();
    auxiliarEditaActividad.estado = false;
    auxiliarEditaActividad.indiceEdita = index;
    this.resourceService.SetPersistenceValue('ListaActividad', JSON.stringify(this.ListaActividad));
    this.resourceService.SetPersistenceValue('RegisterOrUpdate', JSON.stringify(auxiliarEditaActividad));
    this.resourceService.SetPersistenceValue('ActividadEdita', JSON.stringify(actividad));
    this.router.navigate(['/actividad']);
  }

  async guardarRubroCapitalTrabajo() {
    this.loadingService.loadingPresent();
    /* Consumimos servicio para insertar el rubro */
    if (this.rubroEntity.rubro === undefined) {
      this.rubroEntity.rubro = new RubroEntity();
    }

    for (const actividad of this.rubroEntity.listaActividades)
    {
      if (actividad.listaMetaDataFoto === null)
      {
        actividad.listaMetaDataFoto = [];
      }
    }
    
    this.rubroEntity.rubro.listaMetaDataFoto = await this.GetMediaForm();
    this.rubroEntity.rubro.guid = this.credit.guidRubro;
    this.rubroEntity.rubro.idCase = this.credit.idCase.toString();
    this.rubroEntity.rubro.codigoObligacion = this.credit.obligacion;
    this.rubroEntity.rubro.descripcion = this.credit.descripcionRubro;
    this.rubroEntity.rubro.codigoTipoRubro = Number(this.credit.codigoRubro);
    this.rubroEntity.rubro.codigoTipoRubro = Enumerator.CODIGO_CAPITAL_TRABAJO;
    this.rubroEntity.rubro.fechaLimiteAutogestion = this.credit.fechaLimiteAutogestion;
    this.rubroEntity.rubro.tipoIdentificacion = getDocumentTypeRubro( this.tiposDocumento, this.credit );
    this.rubroEntity.rubro.numeroIdentificacion = this.credit.identificacionCliente;
    this.rubroEntity.rubro.id = this.idAux;
    this.rubroEntity.rubro.usuarioCreacion = this.userLogged.usuario;
    
    if (this.resourceService.IsOnline()) {
      this.servicioGuardarRubroCapital(this.rubroEntity, true);
    } else {
      await this.guardadoOffline(this.rubroEntity);
      this.resourceService.GetResourceValues().then(
        (data) => {
          this.loadingService.loadingDismiss();
          this.toasterService.PresentToastMessage(data['mobile.generics.SavedOffline']);
          this.resourceService.ClearPersistenceKey('ListaActividad');
          this.router.navigate(['/rubro']);
        }
      );
    }
  }

  async GetMediaForm(): Promise<Array<MetaDataFoto>> {
    const mediaList: Array<MetaDataFoto> = [];

    for (const support of this.supportTypeList[0].thumbnails) {
      const nombre = await this.UploadMedia(support);
      // El id debe tener informacion, si es una insercion su valor debe ser 0
      // caso contrario su respectivo valor
      if (support.metadata.id === undefined || support.metadata.id === null) {
        support.metadata.id = 0;
      }
      if (typeof (support.metadata) === 'undefined') {
        support.metadata = {
          altitud: '',
          fechaHora: new Date().toISOString(),
          nombreArchivo: '',
          ubicacion: '',
          base64: support.photoBase64,
          lugar: '',
          id: 0,
          tipo: 0
        };
      }
      support.metadata.nombreArchivo = nombre;
      support.metadata.tipo = Enumerator.PHOTOGRAPH_FINANCED_PROJECT;
      mediaList.push(support.metadata);
    }
    for (var support of this.supportTypeListAux) {
      mediaList.push(support);
    }
    return mediaList;
  }

  async UploadMedia(media: Thumbnail, nombreArchivo = null) {
    // Guid enviado desde front
    const photo = new Photo();
    if (nombreArchivo !== null && nombreArchivo !== undefined) {
      const indice = nombreArchivo.indexOf('.jpeg');
      if (indice != 0) {
        photo.guid = nombreArchivo.substring(0, indice);
      }
      else{
        photo.guid = Guid.create().toString();
      }
    } else {
      photo.guid = Guid.create().toString();
    }
    photo.photoBase64 = media.photoBase64;
    /*if (this.Online && media.id === 0) {
      await this.homeService.SubirFoto(photo).toPromise().then(
        (res: HttpResponse<string>) => {
        }
      );
    }*/
    return photo.guid + '.jpeg';
  }

  async FillPhotos(media) {
    this.supportTypeList = [
      {
        description: ' Fotografia Proyecto Financiado',
        minPictures: this.minPhotosProyectoFinaciado,
        maxPictures: this.maxPhotosProyectoFinaciado,
        maxSizeHeight: 1080,
        maxSizeWidth: 1920,
        maxWeight: this.maxSizePhotosParm,
        minWeight: this.minSizePhotosParm,
        requireMetaData: true,
        thumbnails: [],
      }
    ];

    const arreglo = media.filter(m => m.tipo === Enumerator.PHOTOGRAPH_FINANCED_PROJECT);
    for (const photo of arreglo) {
      const thumbnail: Thumbnail = {
        id: photo.id,
        metadata: photo,
        src: `${environment.urlStorage.url}${photo.nombreArchivo}`,
        photoBase64: photo.base64
      };
      this.supportTypeList[0].thumbnails.push(thumbnail);
    }
    const arregloEliminadas = media.filter(m => m.tipo === 0);
    for (const photo of arregloEliminadas) {
      this.supportTypeListAux.push(photo);
    }
  }

  replaceBase64(listaMetaDataFoto) {
    for (const elementMetaDataFoto of listaMetaDataFoto) {
      elementMetaDataFoto.base64 = '';
    }
    return listaMetaDataFoto;
  }

  ConsultarParametroGetId() {
    this.parametroService.ConsultarParametro(Enumerator.RUBRO_TYPE)
      .subscribe(
        async (res) => {
          this.parametroType = res.resultData;
          // Se inserta esta informacion en la tabla local
          if (this.resourceService.IsDevice()) {
            this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
            await this.dataBaseOffline.deleteDataParametro(Enumerator.RUBRO_TYPE);
            for (const parametro of this.parametroType) {
              this.dataBaseOffline.insertDataParametro(parametro, Enumerator.RUBRO_TYPE);
            }
            const datos = await this.dataBaseOffline.selectDataParametro(Enumerator.RUBRO_TYPE);
          }
        },
        (err) => { }
      );
  }

  async ConsultarParametroGetIdOffline() {
    // Consulta informacion del tipo de parametro
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    this.parametroType = await this.dataBaseOffline.selectDataParametro(Enumerator.RUBRO_TYPE);
  }

  async ConsultarParametroActividadOffline() {
    // Consulta informacion de actividad
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    this.parametroActividad = await this.dataBaseOffline.selectDataParametro(Enumerator.ID_ACTIVIDAD);
  }

  async InsertarSQLite(rubro, listaActividades) {

    // Inserta rubro
    this.InsertarRubro(rubro, true);

    // Inserta actividades
    this.InsertarActividades(rubro, listaActividades);

    // Arreglo metadata
    const arregloMetadata = [];
    if (rubro.listaMetaDataFoto !== null) {
      for (const metadata of rubro.listaMetaDataFoto) {
        const entidadResultados = new EntidadMetadataAux();
        entidadResultados.identificadorActividad = null;
        entidadResultados.metadata = metadata;
        arregloMetadata.push(entidadResultados);
      }
    }
    if (listaActividades !== null) {
      let idActividad = 0;
      for (const actividad of listaActividades) {
        if (actividad.listaMetaDataFoto !== null) {
          for (const metadata of actividad.listaMetaDataFoto) {
            const entidadResultados = new EntidadMetadataAux();
            entidadResultados.identificadorActividad = idActividad;
            entidadResultados.metadata = metadata;
            arregloMetadata.push(entidadResultados);
          }
          idActividad++;
        }
      }
    }

    // Inserta metadata
    this.InsertarMetadata(rubro, arregloMetadata);
  }

  async InsertarRubro(rubro, opcion) {
    // Rubro
    // Elimina la informacion del rubro
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);

    let datos = await this.dataBaseOffline.selectDataRubro(rubro.guid, rubro.codigoObligacion);
    if (datos.length > 0) {
      await this.dataBaseOffline.deleteDataRubro(rubro.guid, rubro.codigoObligacion);
    }

    // Inserta la informacion del rubro
    await this.dataBaseOffline.insertDataRubro(rubro, opcion,Enumerator.CODIGO_CAPITAL_TRABAJO);

    // Informacion del rubro
    datos = await this.dataBaseOffline.selectDataRubro(rubro.guid, rubro.codigoObligacion);
  }

  async InsertarActividades(rubro, listaActividades) {
    // Actividades
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    let actividades = await this.dataBaseOffline.selectDataRubroActividad
      (rubro.guid, rubro.codigoObligacion);
    if (actividades.length > 0) {
      await this.dataBaseOffline.deleteDataRubroActividad(rubro.guid, rubro.codigoObligacion);
    }
    actividades = await this.dataBaseOffline.selectDataRubroActividad
      (rubro.guid, rubro.codigoObligacion);
    if (listaActividades !== null) {
      for (const actividad of listaActividades) {
        await this.dataBaseOffline.insertDataRubroActividad(rubro.guid, actividad, rubro.codigoObligacion);
      }
    }
    // Check table Actividades
    actividades = await this.dataBaseOffline.selectDataRubroActividad(rubro.guid, rubro.codigoObligacion);
  }

  async InsertarMetadata(rubro, arregloMetadata) {
    // Metadata
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    let datosMetadata = await this.dataBaseOffline.
      selectDataMetaDataFoto(rubro.guid, rubro.codigoObligacion);
    if (datosMetadata.length > 0) {
      await this.dataBaseOffline.deleteDataMetaDataFoto(rubro.guid, rubro.codigoObligacion);
    }
    datosMetadata = await this.dataBaseOffline.selectDataMetaDataFoto(rubro.guid, rubro.codigoObligacion);
    for (const metadata of arregloMetadata) {
        await this.dataBaseOffline.insertDataMetaDataFoto(rubro.guid, metadata, rubro.codigoObligacion);
    }
    // Check table metadata
    datosMetadata = await this.dataBaseOffline.selectDataMetaDataFoto(rubro.guid, rubro.codigoObligacion);
  }

  async CatalogosCantidadFotos() {
    const minPhotosProyectoFinaciado = await this.parametroService.
      ConsultarParametro(Enumerator.MIN_PHOTOS_CAPITAL_FINANCED_PROJECT);
    const maxPhotosProyectoFinaciado = await this.parametroService.
      ConsultarParametro(Enumerator.MAX_PHOTOS_CAPITAL_FINANCED_PROJECT);
    const minSizePhotosParm = await this.parametroService.
      ConsultarParametro(Enumerator.MIN_SIZE_PHOTOS_CAPITAL);
    const maxSizePhotosParm = await this.parametroService.
      ConsultarParametro(Enumerator.MAX_SIZE_PHOTOS_CAPITAL);
      
    await forkJoin([minPhotosProyectoFinaciado, maxPhotosProyectoFinaciado, minSizePhotosParm,
      maxSizePhotosParm]).subscribe(
        (res) => {
          this.minPhotosProyectoFinaciado = Number(res[0]?.resultData[0].valor);
          this.maxPhotosProyectoFinaciado = Number(res[1]?.resultData[0].valor);
          this.minSizePhotosParm = Number(res[2]?.resultData[0].valor);
          this.maxSizePhotosParm = Number(res[3]?.resultData[0].valor);
          this.updateValues();
          if (this.resourceService.IsDevice()) {
            // Se inserta esta informacion en tablas locales
            this.sqlLite(res);
          }
        }
      );
  }

  updateValues() {
    if (this.supportTypeList.length > 0)
    {
      this.supportTypeList[0].maxPictures = this.maxPhotosProyectoFinaciado;
      this.supportTypeList[0].minPictures = this.minPhotosProyectoFinaciado;
      this.supportTypeList[0].maxWeight = this.maxSizePhotosParm;
      this.supportTypeList[0].minWeight = this.minSizePhotosParm;
      this.validarBotonGuardar();
    }
  }

  async ConsultarRubroCapitalTrabajoOffline() {
    if (this.persistenceService.get('user') !== undefined) {

      // Rubro
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
      const datosRubro = await this.dataBaseOffline.
        selectDataRubro(this.credit.guidRubro, this.credit.obligacion);
      if (datosRubro.length > 0)
      {
        this.rubroEntity.rubro = datosRubro[0];
      this.idAux = this.rubroEntity.rubro.id;
      // Metadata
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
      const datosMetadataRubro =
        await this.dataBaseOffline.selectDataMetaDataFoto(this.credit.guidRubro, this.credit.obligacion);
      if (this.rubroEntity.rubro !== undefined) {
        this.rubroEntity.rubro.listaMetaDataFoto = [];
        for (const metadata of datosMetadataRubro) {
          if (metadata.identificadorActividad === null) {
            this.rubroEntity.rubro.listaMetaDataFoto.push(metadata);
          }
        }

        // // Graficar imagenes
        const photos = this.rubroEntity.rubro.listaMetaDataFoto;
        if (photos[0] !== undefined) {
          this.FillPhotos(photos);
        }
      }

      // Lista Actividades
      this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
      const datosActividades =
        await this.dataBaseOffline.selectDataRubroActividad(this.credit.guidRubro, this.credit.obligacion);
        let idActividad = 0;
      for (const actividad of datosActividades) {
        let photo = [];
        photo = datosMetadataRubro.filter(metadata =>
          metadata.identificadorActividad === idActividad);
        actividad.listaMetaDataFoto = photo;
        idActividad++;
      }
      this.rubroEntity.listaActividades = datosActividades;
      this.ListaActividad = this.rubroEntity.listaActividades;
      }
    }
  }

  sqlLite(res) {
    if (this.resourceService.IsDevice()) {
      const arregloEnumerator = [];
      arregloEnumerator.push(Enumerator.MIN_PHOTOS_CAPITAL_FINANCED_PROJECT);
      arregloEnumerator.push(Enumerator.MAX_PHOTOS_CAPITAL_FINANCED_PROJECT);
      arregloEnumerator.push(Enumerator.MIN_SIZE_PHOTOS_CAPITAL);
      arregloEnumerator.push(Enumerator.MAX_SIZE_PHOTOS_CAPITAL);
      const arregloParametros = [];
      for (let i = 0; i < res.length; i++) {
        const entidadResultados = new EntidadParametroAux();
        entidadResultados.parametro = res[i]?.resultData[0];
        entidadResultados.idBusqueda = arregloEnumerator[i];
        arregloParametros.push(entidadResultados);
      }
      this.deleteParametrosSQLite(arregloParametros);
    }
  }

  async deleteParametrosSQLite(arregloParametros) {
    // Borra la informacion asociados a parametros de fotos
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    for (const parametro of arregloParametros) {
      await this.dataBaseOffline.deleteDataParametro
        (parametro.idBusqueda);
    }
    this.insertParametrosSQLite(arregloParametros);
  }

  async insertParametrosSQLite(arregloParametros) {
    // Inserta informacion de parametros de fotos
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    for (const parametro of arregloParametros) {
      this.dataBaseOffline.insertDataParametro
        (parametro.parametro, parametro.idBusqueda);
    }
    const datosConsultados = [];
    for (const parametro of arregloParametros) {
      // informacion de la table parametro de parametros de fotos
      const datos = await this.dataBaseOffline.selectDataParametro(parametro.idBusqueda);
      datosConsultados.push(datos);
    }
  }

  async CatalogosCantidadFotosOffline() {
    const minPhotosProyectoFinanciado = await this.dataBaseOffline.selectDataParametro
      (Enumerator.MIN_PHOTOS_CAPITAL_FINANCED_PROJECT);
    // Dejar esta instancia en este punto o databaseComponent sera indefinido
    this.databaseComponent = new DatabaseComponent(this.sqlite, this.persistenceService);
    const maxPhotosProyectoFinanciado = await this.dataBaseOffline.selectDataParametro
      (Enumerator.MAX_PHOTOS_CAPITAL_FINANCED_PROJECT);
    const minSizePhotosParm = await this.dataBaseOffline.selectDataParametro
      (Enumerator.MIN_SIZE_PHOTOS_CAPITAL);
    const maxSizePhotosParm = await this.dataBaseOffline.selectDataParametro
      (Enumerator.MAX_SIZE_PHOTOS_CAPITAL);
    this.minPhotosProyectoFinaciado = minPhotosProyectoFinanciado[0].valor;
    this.maxPhotosProyectoFinaciado = maxPhotosProyectoFinanciado[0].valor;
    this.minSizePhotosParm = minSizePhotosParm[0].valor;
    this.maxSizePhotosParm = maxSizePhotosParm[0].valor;
    this.updateValues();
  }

  servicioGuardarRubroCapital(rubro, navegacion) {
    this.rubroService.InsertarRubroCapitalTrabajo(rubro).subscribe(
      (res) => {
        if (res.responseCode === Enumerator.HTTP_RESPONSE_OK) {
          this.resourceService.GetResourceValues().then(
            (data) => {
              this.resourceService.ClearPersistenceKey('ListaActividad');
              this.toasterService.PresentToastMessage(data['mobile.generics.Saved']);
              // Se actualiza la informacion almacenada en la tabla local
              rubro.rubro = res.resultData[0].rubro;
              rubro.listaActividades = res.resultData[0].listaActividades;
              this.InsertarSQLite(rubro.rubro, rubro.listaActividades);
              if (navegacion) {
                this.router.navigate(['/rubro']);
              }
            }
          );
        }
      },
      (err) => { }
    );
  }

  async guardadoOffline(rubro) {

    if (rubro.rubro.costoEjecutado === undefined)
    {
      rubro.rubro.costoEjecutado = 0;
    }

    if (rubro.rubro.fechaLimiteAutoGestion === undefined)
    {
      rubro.rubro.fechaLimiteAutoGestion = rubro.rubro.fechaLimiteAutogestion;
    }

    if (rubro.rubro.fechaCreacion === undefined)
    {
      rubro.rubro.fechaCreacion = new Date().toISOString();
      rubro.rubro.fechaModificacion = new Date().toISOString();
    }

    if (rubro.rubro.usuarioCreacion === undefined)
    {
      if (this.resourceService.GetPersistenceValue("user"))
      {
        rubro.rubro.usuarioCreacion = this.resourceService.GetPersistenceValue("user").usuario;
        rubro.rubro.usuarioModificacion = this.resourceService.GetPersistenceValue("user").usuario;
      }
      rubro.rubro.fechaCreacion = new Date().toISOString();
      rubro.rubro.fechaModificacion = new Date().toISOString();
    }
    

    // Rubro
    this.InsertarRubro(rubro.rubro, false);

    // Inserta actividades
    this.InsertarActividades(rubro.rubro, rubro.listaActividades);

    // Arreglo metadata
    const arregloMetadata = [];
    if (rubro.rubro.listaMetaDataFoto !== null) {
      for (const metadata of rubro.rubro.listaMetaDataFoto) {
        const entidadResultados = new EntidadMetadataAux();
        entidadResultados.identificadorActividad = null;
        entidadResultados.metadata = metadata;
        arregloMetadata.push(entidadResultados);
      }
    }
    if (rubro.listaActividades !== null) {
      let idActividad = 0;
      for (const actividad of rubro.listaActividades) {
        const arregloMetadataActividadAux = actividad.listaMetaDataFoto;
        for (const metadata of arregloMetadataActividadAux) {
          const entidadResultados = new EntidadMetadataAux();
          // Revisar esta parte
          entidadResultados.identificadorActividad = idActividad;
          entidadResultados.metadata = metadata;
          arregloMetadata.push(entidadResultados);
        }
        idActividad++;
      }
    }

    // Inserta metadata
    this.InsertarMetadata(rubro.rubro, arregloMetadata);
    this.resourceService.ClearPersistenceKey('ListaActividad');
  }

  validarBotonGuardar() {
    // Validaciones para habilitar el boton guardar
    if (this.minPhotosProyectoFinaciado !== undefined) {
      if (this.supportTypeList[0].thumbnails.length >= this.minPhotosProyectoFinaciado) {
        this.cantidadMinimaFotos = true;
      } else {
        this.cantidadMinimaFotos = false;
      }
    }
    if (this.rubroEntity.listaActividades !== null) {
      if (this.rubroEntity.listaActividades.filter(item => item.id >= 0).length > 0) {
        this.actividadesValidas = true;
      } else {
        this.actividadesValidas = false;
      }
    } else {
      // this.actividadesValidas = false;
    }
  }

  async ValidarformatoImagen(support): Promise<boolean> {
    if (!support.includes('/9j/')) {
      const alert = await this.alertController.create({
        cssClass: 'contenedor-principal',
        header: 'Confirmación',
        message: '<strong>La imagen no cumple con el formato correcto.</strong>',
        buttons: [
          {
            text: 'Aceptar',
            handler: () => { }
          }
        ]
      });

      await alert.present();
      return false;
    }

    return true;
  }

  async CheckImageSize(base64: string, index: number) {
    // Check file size from base64 string in Kbytes
    const size = ((base64.length * (3 / 4)) / 1000);

    if (size <= (this.maxSizePhotosParm * 1000) &&
      size >= (this.minSizePhotosParm * 1000))
      {
        return true;
      }
      else {
        const alert = await this.alertController.create({
          cssClass: 'contenedor-principal',
          header: 'Confirmación',
          message: `<strong>Únicamente se permiten imágenes que pesen menos de
          ${this.maxSizePhotosParm} Mb y más de ${this.minSizePhotosParm}
           Mb</strong>`,
          buttons: [
            {
              text: 'Aceptar',
              handler: () => {
              }
            }
          ]
        });
        await alert.present();
      }
  }
}
