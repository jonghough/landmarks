import * as BABYLON from "@babylonjs/core";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui/2D";
import type { GlobalConfig } from "./GlobalConfig";
import { Tiler } from "./tiles";

export class InfoBillboard {

    tileInfoPlane: BABYLON.Mesh | null = null;
    centerLatitude: number;
    centerLongitude: number;
    billboardBackgroundColor: string = "#AAAAAAFF";
    billboardTextColor: string = "#282828";
    adt: AdvancedDynamicTexture | null = null;
    adtButton: Button | null = null;
    titleText: string | null = null;
    globalConfig: GlobalConfig;

    constructor(globalConfig: GlobalConfig, readonly infoDialogOpenCallback: (title: string, text: string, homePage: string) => void, centerLatitude: number, centerLongitude: number) {
        this.globalConfig = globalConfig;
        this.centerLatitude = centerLatitude;
        this.centerLongitude = centerLongitude;
    }

    createTileInfoBillboard(scene: BABYLON.Scene, position: BABYLON.Vector3, text: string, address: string, url: string) {
        this.tileInfoPlane = BABYLON.Mesh.CreatePlane("plane", 6000, scene, true);
        this.titleText = text;
        this.tileInfoPlane.position = position;
        this.tileInfoPlane.position.y = 8000;

        this.tileInfoPlane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;
        this.tileInfoPlane.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;
        this.adt = AdvancedDynamicTexture.CreateForMesh(this.tileInfoPlane);

        this.adtButton = Button.CreateImageWithCenterTextButton("button", text, "tile-info.png");

        this.adtButton.width = 1;
        this.adtButton.height = 0.5;
        this.adtButton.color = this.billboardTextColor;
        this.adtButton.fontSize = 150;
        this.adtButton.fontFamily = "Garamond";
        this.adtButton.background = this.billboardBackgroundColor;
        let __this = this;
        this.adtButton.onPointerUpObservable.add(function () {
            let title = __this.titleText == null ? "" : __this.titleText;
            __this.infoDialogOpenCallback(title, address, url);
        });


        this.adt.addControl(this.adtButton);


    }


    updatePosition() {
        let t = new Tiler();
        let meters = t.laloToMeters(this.centerLatitude, this.centerLongitude);
        let ox = this.globalConfig.offsetX - meters[0];
        let oy = this.globalConfig.offsetY - meters[1];
        if (this.tileInfoPlane) {
            this.tileInfoPlane.position.x = ox;
            this.tileInfoPlane.position.z = oy;
        }
    }

    hide() {
        if (this.tileInfoPlane)
            this.tileInfoPlane.isVisible = false;


    }
    show(segment: string) {
        this.billboardTextColor = '#FFFFFF';
        this.billboardBackgroundColor = '#000000';
        if (this.adtButton) {
            this.adtButton.background = this.billboardBackgroundColor;
            this.adtButton.color = this.billboardTextColor;
        }
        if (this.tileInfoPlane)
            this.tileInfoPlane.isVisible = true;


    }
    dispose() {
        this.adt?.dispose();
        this.adtButton?.dispose();
        this.tileInfoPlane?.dispose();
    }
} 
