import { CustomBox } from "../CustomBox";
import { Undo } from "./undo";
import * as BABYLON from "@babylonjs/core";




export class RotateCustomBoxUndo extends Undo {

    constructor(readonly customBox: CustomBox, readonly originalRotationPosition: BABYLON.Vector3, readonly nextRotationPosition: BABYLON.Vector3) {
        super();
    }
    undo(): void {
        this.customBox.rotate(this.originalRotationPosition);
    }

    redo(): void {
        this.customBox.rotate(this.nextRotationPosition);
    }
}