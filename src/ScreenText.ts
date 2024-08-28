import * as BABYLON from "@babylonjs/core";
import { AdvancedDynamicTexture, Image, TextBlock } from "@babylonjs/gui/2D";
import { GlobalConfig } from "./GlobalConfig";


export class ScreenText {


    constructor(readonly globalConfig: GlobalConfig, readonly getCameraPosition: Function) {
        const advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("screenText");
        var image = new Image("connector-image", null);
        image.width = 1;
        image.height = 1;
        advancedTexture.addControl(image);

        let textBlock = new TextBlock("connector", " ");

        textBlock.height = 1.0;
        textBlock.width = 0.4;
        textBlock.resizeToFit = true;
        textBlock.isPointerBlocker = true;
        textBlock.textWrapping = true;
        textBlock.color = "white";
        textBlock.fontSize = 12;
        textBlock.textHorizontalAlignment = 0;
        textBlock.horizontalAlignment = 0;
        textBlock.verticalAlignment = 0;
        advancedTexture.addControl(textBlock);

        setInterval(() => {
            var pos = this.getCameraPosition();
            if (pos != null) {
                let text = pos[0].toFixed(12) + ", " + pos[2].toFixed(12);
                textBlock.text = text;
            }
        }, 0.2 * 1000);

    }

}