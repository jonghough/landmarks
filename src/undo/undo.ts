
export abstract class Undo {


    undo(): void {

    }

    redo(): void { }
}

export class EmptyUndo extends Undo {


}