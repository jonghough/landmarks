import * as BABYLON from "@babylonjs/core";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui/2D";
import { CustomBox } from "./CustomBox";

export class TileInfoBillboard {

    tileInfoPlane: BABYLON.Mesh | null = null;
    centerLatitude: number;
    centerLongitude: number;
    verticalLine: Line | null = null;
    buildingBox: CustomBox | null = null;
    companySegments: string[] | null = null;
    billboardBackgroundColor: string = "#AAAAAAFF";
    billboardTextColor: string = "#282828";
    adt: AdvancedDynamicTexture | null = null;
    adtButton: Button | null = null;

    constructor(centerLatitude: number, centerLongitude: number) {
        this.centerLatitude = centerLatitude;
        this.centerLongitude = centerLongitude;
    }

    createTileInfoBillboard(scene: BABYLON.Scene, position: BABYLON.Vector3, text: string, segments: string[]) {
        this.tileInfoPlane = BABYLON.Mesh.CreatePlane("plane", 1050, scene, true);
        this.tileInfoPlane.position = position;
        this.companySegments = segments;

        this.tileInfoPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        this.tileInfoPlane.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;
        this.adt = AdvancedDynamicTexture.CreateForMesh(this.tileInfoPlane);

        this.adtButton = Button.CreateImageWithCenterTextButton("but1", text, "tile-info.png");

        this.adtButton.width = 1;
        this.adtButton.height = 0.5;
        this.adtButton.color = this.billboardTextColor;
        this.adtButton.fontSize = 150;
        this.adtButton.background = this.billboardBackgroundColor;
        let __this = this;
        this.adtButton.onPointerUpObservable.add(function () {
            alert(`Tile center coordinates are (${__this.centerLatitude}, ${__this.centerLongitude})`);
        });

        this.adt.addControl(this.adtButton);
        this.verticalLine = new Line(scene);
        let floor = new BABYLON.Vector3(position.x, 0, position.z);
        this.verticalLine.create(this.tileInfoPlane.position.subtract(new BABYLON.Vector3(0, 300, 0)), floor);

        let r = 280 * Math.random();
        let top = new BABYLON.Vector3(position.x, 450 - r, position.z).subtract(new BABYLON.Vector3(-50, 0, -50));
        this.buildingBox = new CustomBox(floor.subtract(new BABYLON.Vector3(50, 0, 50)), top, scene);
    }

    hide() {
        if (this.tileInfoPlane)
            this.tileInfoPlane.isVisible = false;
        if (this.verticalLine) {
            this.verticalLine.hide();
        }
        if (this.buildingBox)
            this.buildingBox.hide();

    }
    show() {
        if (this.tileInfoPlane)
            this.tileInfoPlane.isVisible = true;
        if (this.verticalLine) {
            this.verticalLine.show();
        }
        if (this.buildingBox)
            this.buildingBox.show();

    }
    dispose() {
        this.tileInfoPlane?.dispose();
    }
}

class Line {
    connLine: BABYLON.LinesMesh | null = null;
    constructor(readonly scene: BABYLON.Scene) {

    }

    create(start: BABYLON.Vector3, end: BABYLON.Vector3) {
        const connectorLineOptions = {
            points: [start, end], //vec3 array,
            updatable: true,
        };
        this.connLine = BABYLON.MeshBuilder.CreateLines("connector-lines", connectorLineOptions, this.scene);
        this.connLine.color = new BABYLON.Color3(1.0, 0.05, 1.0);

        this.connLine.freezeWorldMatrix();
        this.connLine.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;

    }

    hide() {
        if (this.connLine)
            this.connLine.isVisible = false;

    }

    show() {
        if (this.connLine)
            this.connLine.isVisible = true;

    }
}