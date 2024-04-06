import { CustomBox } from "../CustomBox";
import { Undo } from "./undo";


export class DeleteCustomBoxUndo extends Undo {

    constructor(readonly customBoxMap: Map<string, CustomBox>, readonly customBox: CustomBox) {
        super();
    }

    undo(): void {
        this.customBoxMap.set(this.customBox.name, this.customBox)
    }

    redo(): void {
        this.customBoxMap.delete(this.customBox.name);
    }
}