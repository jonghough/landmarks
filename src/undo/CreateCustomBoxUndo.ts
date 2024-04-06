import { CustomBox } from "../CustomBox";
import { Undo } from "./undo";


export class CreateCustomBoxUndo extends Undo {

    constructor(readonly customBoxMap: Map<string, CustomBox>, readonly customBox: CustomBox) {
        super();
    }

    undo(): void {
        this.customBoxMap.delete(this.customBox.name)
    }

    redo(): void {
        this.customBoxMap.set(this.customBox.name, this.customBox);
    }
}