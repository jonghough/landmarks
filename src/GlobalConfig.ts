import * as BABYLON from "@babylonjs/core";

export class GlobalConfig {
  public globalMaterials: Map<string, BABYLON.ShaderMaterial>;
  /**
   *
   * @param xyzTileSet
   * @param xyzTileZoomLevel
   * @param showMeshProperties
   * @param cameraForwardSpeed
   * @param cameraLateralSpeed
   */
  constructor(
    public xyzTileSet: string,
    public xyzTileZoomLevel: number,
    public farPlaneDistance: number,
    public showMeshProperties: boolean,
    public cameraForwardSpeed: number,
    public cameraLateralSpeed: number,
    public offsetX: number,
    public offsetY: number,
    public offsetSet: boolean = false,
    public initialLatitude: number,
    public initialLongitude: number,
    public featureInfoDisplayCallback: (arg: string) => void = (arg: string) => {},
  ) {
    this.globalMaterials = new Map<string, BABYLON.ShaderMaterial>();
  }
}
