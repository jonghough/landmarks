import { Undo } from "./undo";


export class UndoStack {

    undoList: Array<Undo>;
    capacity: number;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.undoList = [];
    }


    push(undo: Undo) {
        this.undoList.push(undo);
        while (this.undoList.length > this.capacity) {
            this.undoList.splice(0, 1);
        }
    }

    pop(): Undo | null {
        if (this.undoList.length == 0) { 
            return null;
        }
        var last = this.undoList[this.undoList.length - 1];
        if (last != null) {
            this.undoList.splice(this.undoList.length - 1, 1);
        }
        return last;
    }

    clear() {
        this.undoList = [];
    }
}
    
 