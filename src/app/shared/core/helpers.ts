export function getDocumentTypeRubro( tiposDocumento : Array<any> = [], creditJson : any ) {
    return tiposDocumento.find(
        (document : any) => document.valor === creditJson.tipoDocumento).codigo;
}