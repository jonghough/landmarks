import * as BABYLON from "@babylonjs/core";
import { AdvancedDynamicTexture, Button } from "@babylonjs/gui/2D";
import { CustomBox } from "./CustomBox";


class ColorCache {
    private cache: Map<string, string> = new Map();

    getColorForString(str: string): string {
        if (!this.cache.has(str)) {
            // Generate a new color if not already cached
            const color = stringToColor(str);
            this.cache.set(str, color);
        }
        return this.cache.get(str) as string;
    }
}

function stringToColor(str: string): string {
    // Create a hash from the string
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Convert hash to RGB color
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
}

function hexToRgb(hex: string): { r: number, g: number, b: number } {
    // Remove the hash if present
    hex = hex.replace('#', '');

    // Parse the r, g, b values
    let bigint = parseInt(hex, 16);
    let r = (bigint >> 16) & 255;
    let g = (bigint >> 8) & 255;
    let b = bigint & 255;

    return { r, g, b };

}

function luminance(r: number, g: number, b: number): number {
    const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getTextColor(backgroundColor: string): string {
    const { r, g, b } = hexToRgb(backgroundColor);
    const bgLuminance = luminance(r, g, b);

    // Threshold for luminance
    return bgLuminance > 0.5 ? '#000000' : '#FFFFFF';
}
export class InfoBillboard {

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
    titleText: string | null = null;
    static colorCache: ColorCache = new ColorCache();

    constructor(readonly infoDialogOpenCallback: (title: string, text: string, homePage: string) => void, centerLatitude: number, centerLongitude: number) {
        this.centerLatitude = centerLatitude;
        this.centerLongitude = centerLongitude;
    }

    createTileInfoBillboard(scene: BABYLON.Scene, position: BABYLON.Vector3, text: string, address: string, url: string, segments: string[]) {
        this.tileInfoPlane = BABYLON.Mesh.CreatePlane("plane", 1050, scene, true);
        this.titleText = text;
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
            let title = __this.titleText == null ? "" : __this.titleText;
            __this.infoDialogOpenCallback(title, address, url);
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
    show(segment: string) {
        let color = InfoBillboard.colorCache.getColorForString(segment);
        let textColor = getTextColor(color);
        this.billboardTextColor = textColor;
        this.billboardBackgroundColor = color;
        if (this.adtButton) {
            this.adtButton.background = this.billboardBackgroundColor;
            this.adtButton.color = this.billboardTextColor;
        }
        if (this.tileInfoPlane)
            this.tileInfoPlane.isVisible = true;
        if (this.verticalLine) {
            this.verticalLine.show();
        }
        if (this.buildingBox)
            this.buildingBox.show();

    }
    dispose() {
        this.adt?.dispose();
        this.adtButton?.dispose();
        this.verticalLine?.dispose();
        this.buildingBox?.dispose();
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

    dispose() {
        this.connLine?.dispose();
    }
}