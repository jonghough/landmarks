import * as BABYLON from "@babylonjs/core";
import {connect} from "http2";
import {Tiler} from "./tiles";
import {GlobalConfig} from "./GlobalConfig";
const googleSatelliteTiles = "s";
const googleRoadmapTiles = "m";
const googleHybridTiles = "y";

export class TileData {
  tileSet: string = googleSatelliteTiles; //default

  tileMeshes: BABYLON.Mesh[] = [];

  public boundingBox: number[] = [];

  constructor(
    readonly tileName: string,
    readonly globalConfig: GlobalConfig,
    readonly tiler: Tiler,
    readonly x: number,
    readonly y: number,
    readonly elevation: number,
    readonly xyzTileZoomLevel: number,
  ) {
    this.tileSet = globalConfig.xyzTileSet;
  }

  /**
   *
   * @param scene
   */
  public setupTileBoundaryLines(scene: BABYLON.Scene) {
    //unshifted EPSG 3857 bounds
    this.boundingBox = this.tiler.tileBoundsin3857(this.x, this.y, this.xyzTileZoomLevel);

    // create the meshes
    this.boundingBox.forEach((b) => this.tileMeshes.push(new BABYLON.Mesh("xyztile", scene)));
    //render the tile with aerial imagery (xyz tiles).
    this.renderTiles(this.xyzTileZoomLevel, this.boundingBox, scene);
  }

  public renderTiles(tileZoomLevel: number, initialBounds: number[], scene: BABYLON.Scene) {
    const tileZoom = tileZoomLevel;
    var tileSquares = this.createTileBoundsAtLevel(tileZoom, initialBounds);
    let centersOfGr = tileSquares.map((sq) => this.findCenterOfGravity(sq));
    let subSquareTileXYsr = centersOfGr.map((c) => this.tiler.metersToTile(c[0], c[1], tileZoom));
    let subSquaresVecr = tileSquares.map((sq) => {
      let tb = [];
      let [p1x, p1y] = Tiler.wrapCoordinates(
        this.globalConfig.offsetX - sq[0],
        this.globalConfig.offsetY - sq[1],
      );
      let [p2x, p2y] = Tiler.wrapCoordinates(
        this.globalConfig.offsetX - sq[2],
        this.globalConfig.offsetY - sq[1],
      );
      let [p3x, p3y] = Tiler.wrapCoordinates(
        this.globalConfig.offsetX - sq[2],
        this.globalConfig.offsetY - sq[3],
      );
      let [p4x, p4y] = Tiler.wrapCoordinates(
        this.globalConfig.offsetX - sq[0],
        this.globalConfig.offsetY - sq[3],
      );
      tb.push(new BABYLON.Vector3(p1x, this.elevation, p1y));
      tb.push(new BABYLON.Vector3(p2x, this.elevation, p2y));
      tb.push(new BABYLON.Vector3(p3x, this.elevation, p3y));
      tb.push(new BABYLON.Vector3(p4x, this.elevation, p4y));
      return tb;
    });

    for (var i = 0; i < subSquareTileXYsr.length; i++) {
      const sxy = this.tiler.toSlippy(subSquareTileXYsr[i][0], subSquareTileXYsr[i][1], tileZoom);
      const tileURL = this.getTileUrl(sxy[0], sxy[1], tileZoom);
      console.log(tileURL);
      this.loadXYZMesh(scene, tileURL, subSquaresVecr[i], this.tileMeshes[i]);
    }
  }

  private getTileUrl(x: number, y: number, z: number) {
    switch (this.tileSet) {
      case "moon":
        return `https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm-moon-basemap-v0-1/all/${z}/${x}/${y}.png`;
      case "google-satellite":
        return `https://mt0.google.com/vt/lyrs=s&hl=en&x=${x}&y=${y}&z=${z}`;
      case "google-roadmap":
        return `https://mt0.google.com/vt/lyrs=m&hl=en&x=${x}&y=${y}&z=${z}`;
      case "google-hybrid":
        return `https://mt0.google.com/vt/lyrs=y&hl=en&x=${x}&y=${y}&z=${z}`;
      case "osm":
        return `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
      default:
        return `https://mt0.google.com/vt/lyrs=s&hl=en&x=${x}&y=${y}&z=${z}`;
    }
  }

  public refreshTiles(scene: BABYLON.Scene) {
    this.renderTiles(this.xyzTileZoomLevel, this.boundingBox, scene);
  }

  private createTileBoundsAtLevel(level: number, bounds: number[]) {
    if (level == this.xyzTileZoomLevel) {
      return [bounds];
    }

    const divX = Math.pow(2, -1 * (level - this.xyzTileZoomLevel)) * (bounds[2] - bounds[0]);
    const divY = Math.pow(2, -1 * (level - this.xyzTileZoomLevel)) * (bounds[3] - bounds[1]);
    const tileCountPerDimension = Math.pow(2, level - this.xyzTileZoomLevel);
    const tileSquares = [];
    for (var i = 0; i < tileCountPerDimension; i++) {
      for (var j = 0; j < tileCountPerDimension; j++) {
        const sq = [
          bounds[0] + divX * i,
          bounds[1] + divY * j,
          bounds[0] + divX * (i + 1),
          bounds[1] + divY * (j + 1),
        ];
        tileSquares.push(sq);
      }
    }
    return tileSquares;
  }

  private findCenterOfGravity(bounds: Array<number>): number[] {
    let centerX = 0.5 * (bounds[0] + bounds[2]);
    let centerY = 0.5 * (bounds[1] + bounds[3]);
    return [centerX, centerY];
  }

  /**
   *
   * @param scene
   * @param url
   * @param corners
   */
  private loadXYZMesh(
    scene: BABYLON.Scene,
    url: string,
    corners: Array<BABYLON.Vector3>,
    xyzMesh: BABYLON.Mesh,
  ) {
    let positions: number[] = [];
    corners.forEach((v) => {
      positions.push(v.x);
      positions.push(v.y);
      positions.push(v.z);
    });

    var indices = [0, 1, 2, 0, 2, 3];
    var uvs = [0, 0, 1, 0, 1, 1, 0, 1];
    var normals: number[] = [];

    //Calculations of normals added
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);

    var vertexData = new BABYLON.VertexData();
    vertexData.positions = positions;
    vertexData.indices = indices;
    vertexData.normals = normals; //Assignment of normal to vertexData added

    vertexData.uvs = uvs;
    vertexData.applyToMesh(xyzMesh);

    var slippyTile = new BABYLON.StandardMaterial("slippyTile", scene);
    slippyTile.specularColor = new BABYLON.Color3(0, 0, 0);
    slippyTile.specularPower = 0;
    slippyTile.diffuseTexture = new BABYLON.Texture(url, scene);
    slippyTile.diffuseColor = new BABYLON.Color3(1, 1, 1);
    xyzMesh.material = slippyTile;
    xyzMesh.actionManager = new BABYLON.ActionManager(scene);
  }

  dispose() {
    this.tileMeshes.forEach((m) => m.dispose());
  }

  hide() {
    this.tileMeshes.forEach((t) => (t.isVisible = false));
  }

  show() {
    this.tileMeshes.forEach((t) => (t.isVisible = true));
  }

  hideBy(v: number) {
    this.tileMeshes.forEach((t) => {
      t.visibility -= 0.2 * v;
      if (t.visibility < 0) {
        t.visibility = 0;
      }
    });
  }

  showBy(v: number) {
    this.tileMeshes.forEach((t) => {
      t.visibility += v;
      if (t.visibility > 1) {
        t.visibility = 1;
      }
    });
  }
  delete() {
    this.dispose();
  }
}
