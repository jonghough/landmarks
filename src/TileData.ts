
import * as BABYLON from "@babylonjs/core";
import { connect } from "http2";
import { Tiler } from "./tiles";
import { GlobalConfig } from "./GlobalConfig";
const googleSatelliteTiles = "s";
const googleRoadmapTiles = "m";
const googleHybridTiles = "y";
/**
 * Latitude is encoded as x value
 * Longitude as z value
 *  Height / elevation as y value
 * 
 * TileData will be initially given in NDS.Live coordinates, which can be converted to EPSG:4326 (WSG84) coordinates, and
 * to EPSG:3857 coordinates. Using a projected coordinate system, with meter metric is preferrable over using the latitude longitude coordinates.
 * However the range of 3857 coordiante values is large (ref: https://epsg.io/3857), and it seems BABYLON.js's 
 * rendering engine is not suited to render at coordinates at the larger values, so we do a shift. of coordinates to bring the values into an
 * "aceptable" range. The shift is hardcoded and generally will be usable for the Japan region. Not tested in other regions. Other shifts values may be
 * necessary in, for example, the USA.
 */
export class TileData {


    tileBounds: Array<BABYLON.Vector3> = [];

    tileCenterOfGravity: BABYLON.Vector3 = BABYLON.Vector3.Zero();

    tileSet: string = googleSatelliteTiles; //default

    tileMeshes: BABYLON.Mesh[] = [];

    public ndsTileBounds: number[] = [];

    constructor(
        readonly tileName: string, readonly globalConfig: GlobalConfig, readonly tiler: Tiler, readonly x: number, readonly y: number, readonly xyzTileZoomLevel: number) {
    }

    /**
     * 
     * @param scene 
     */
    public setupTileBoundaryLines(scene: BABYLON.Scene) {


        let bounds = this.tiler.tileBoundsin3857(this.x, this.y, this.xyzTileZoomLevel);

        let shiftedBounds = [
            new BABYLON.Vector3(this.globalConfig.offsetX - bounds[0], 0, this.globalConfig.offsetY - bounds[1]),
            new BABYLON.Vector3(this.globalConfig.offsetX - bounds[2], 0, this.globalConfig.offsetY - bounds[1]),
            new BABYLON.Vector3(this.globalConfig.offsetX - bounds[2], 0, this.globalConfig.offsetY - bounds[3]),
            new BABYLON.Vector3(this.globalConfig.offsetX - bounds[0], 0, this.globalConfig.offsetY - bounds[3]),
            new BABYLON.Vector3(this.globalConfig.offsetX - bounds[0], 0, this.globalConfig.offsetY - bounds[1]),
        ];

        const boundsgrid = {
            points: shiftedBounds,
            updatable: true,
        };
        let boundaryLines = BABYLON.MeshBuilder.CreateLines("lines_" + this.tileName, boundsgrid, scene);
        boundaryLines.color = new BABYLON.Color3(1, 1, 1);


        this.tileBounds.push(new BABYLON.Vector3(this.globalConfig.offsetX - bounds[0], 0, this.globalConfig.offsetY - bounds[1]));
        this.tileBounds.push(new BABYLON.Vector3(this.globalConfig.offsetX - bounds[2], 0, this.globalConfig.offsetY - bounds[1]));
        this.tileBounds.push(new BABYLON.Vector3(this.globalConfig.offsetX - bounds[2], 0, this.globalConfig.offsetY - bounds[3]));
        this.tileBounds.push(new BABYLON.Vector3(this.globalConfig.offsetX - bounds[0], 0, this.globalConfig.offsetY - bounds[3]));

        this.tileBounds.forEach(v => {
            this.tileCenterOfGravity.x += v.x / 4;
            this.tileCenterOfGravity.z += v.z / 4;

        });
        //unshifted EPSG 3857 bounds
        this.ndsTileBounds = bounds;
        // create the meshes
        this.ndsTileBounds.forEach(b => this.tileMeshes.push(new BABYLON.Mesh("xyztile", scene)));
        //render the tile with aerial imagery (xyz tiles).
        this.renderTiles(this.xyzTileZoomLevel, this.ndsTileBounds, scene);

    }




    /**
     * Renders the xyz tiles (using `slippy` scheme) onto meshes whose bounds are defined by the
     * bounds of the NDS.Live tile that this instance represents. the `initialBounds` represents the bounds of the NDS.Live tile
     * in EPSG 3857 coordinates, and is of the form `[minx, miny, maxx, maxy]`, where xs and ys represent the latitude and longitude
     * respectively. 
     * Note that this method is assuming the NDS.Live tiles are at NDS Tiling Level 14, which corresponds, in terms of coordinates,
     * to the XYZ tiles at level 15.
     * @param tileZoomLevel zoom level to tile at. Must be an integer greater than 14.
     * @param initialBounds the initial bounds of the NDS.Live tile.
     * @param scene The scene object.
     */
    public renderTiles(tileZoomLevel: number, initialBounds: number[], scene: BABYLON.Scene) {
        const tileZoom = tileZoomLevel;
        var tileSquares = this.createTileBoundsAtLevel(tileZoom, initialBounds);
        let centersOfGr = tileSquares.map(sq => this.findCenterOfGravity(sq));
        let subSquareTileXYsr = centersOfGr.map(c => this.tiler.metersToTile(c[0], c[1], tileZoom));
        let subSquaresVecr = tileSquares.map(sq => {
            let tb = [];
            tb.push(new BABYLON.Vector3(this.globalConfig.offsetX - sq[0], 0, this.globalConfig.offsetY - sq[1]));
            tb.push(new BABYLON.Vector3(this.globalConfig.offsetX - sq[2], 0, this.globalConfig.offsetY - sq[1]));
            tb.push(new BABYLON.Vector3(this.globalConfig.offsetX - sq[2], 0, this.globalConfig.offsetY - sq[3]));
            tb.push(new BABYLON.Vector3(this.globalConfig.offsetX - sq[0], 0, this.globalConfig.offsetY - sq[3]));
            return tb;
        });

        for (var i = 0; i < subSquareTileXYsr.length; i++) {
            const sxy = this.tiler.toSlippy(subSquareTileXYsr[i][0], subSquareTileXYsr[i][1], tileZoom);

            const tileURL = `https://mt0.google.com/vt/lyrs=${this.tileSet}&hl=en&x=${sxy[0]}&y=${sxy[1]}&z=${tileZoom}`;
            console.log(tileURL);
            this.loadXYZMesh(scene, tileURL, subSquaresVecr[i], this.tileMeshes[i]);
            /**
             * Ref: 
             *      const tileURL = `https://mt0.google.com/vt/lyrs=s&hl=en&x=${slippyXY[0]}&y=${slippyXY[1]}&z=15`;
             *      const osmTileURL = "https://tile.openstreetmap.org/15/28869/12973.png";
             */
        }
    }

    public refreshTiles(scene: BABYLON.Scene) {
        this.renderTiles(this.xyzTileZoomLevel, this.ndsTileBounds, scene);
    }

    private createTileBoundsAtLevel(level: number, bounds: number[]) {

        if (level == this.xyzTileZoomLevel) {
            return [bounds];
        }

        const divX = Math.pow(2, -1 * (level - this.xyzTileZoomLevel)) * (bounds[2] - bounds[0]);
        const divY = Math.pow(2, -1 * (level - this.xyzTileZoomLevel)) * (bounds[3] - bounds[1]);
        const tileCountPerDimension = Math.pow(2, (level - this.xyzTileZoomLevel));
        const tileSquares = []
        for (var i = 0; i < tileCountPerDimension; i++) {
            for (var j = 0; j < tileCountPerDimension; j++) {
                const sq = [
                    bounds[0] + divX * i,
                    bounds[1] + divY * j,
                    bounds[0] + divX * (i + 1),
                    bounds[1] + divY * (j + 1)
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
    private loadXYZMesh(scene: BABYLON.Scene, url: string, corners: Array<BABYLON.Vector3>, xyzMesh: BABYLON.Mesh) {

        let positions: number[] = [];
        corners.forEach(v => {
            positions.push(v.x);
            positions.push(v.y);
            positions.push(v.z);
        });

        var indices = [0, 1, 2, 0, 2, 3];
        var uvs = [
            0, 0, 1, 0, 1, 1,
            0, 1];
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
        this.tileMeshes.forEach(m => m.dispose());
    }

    delete() {
        this.dispose();
    }
}