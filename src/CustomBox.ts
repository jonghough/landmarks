import * as BABYLON from "@babylonjs/core";
import { TranslateCustomBoxUndo } from "./undo/TranslateCustomBoxUndo";
import { RotateCustomBoxUndo } from "./undo/RotateCustomBoxUndo";
import { EmptyUndo, Undo } from "./undo/undo";
import { ScaleCustomBoxUndo } from "./undo/ScaleCustomBoxUndo";
export enum BoxState {
    Idle,
    Selected
}
export class CustomBox {
    boxState: BoxState = BoxState.Idle;
    cube: BABYLON.Mesh | null = null;
    xScaleLinesMesh: BABYLON.LinesMesh | null = null;
    yScaleLinesMesh: BABYLON.LinesMesh | null = null;
    zScaleLinesMesh: BABYLON.LinesMesh | null = null;
    rotateBarLinesMesh: BABYLON.LinesMesh | null = null;
    rotAngle: number = 0;
    scaleFactor: number = 0.1;
    name: string = "";
    constructor(public corner1: BABYLON.Vector3, public corner2: BABYLON.Vector3, scene: BABYLON.Scene) {
        this.setup(scene);
    }


    //https://doc.babylonjs.com/features/featuresDeepDive/mesh/creation/set/box
    private setup(scene: BABYLON.Scene) {
        let size = this.corner2.subtract(this.corner1).length();

        // Create a cube using MeshBuilder.CreateBox
        let height = Math.abs(this.corner2.y - this.corner1.y);
        let width = Math.abs(this.corner1.x - this.corner2.x);
        let depth = Math.abs(this.corner1.z - this.corner2.z);
        this.cube = BABYLON.MeshBuilder.CreateBox("cube_" + this.generateRandomName(12), { height: height, width: width, depth: depth, updatable: true }, scene);
        this.name = this.cube.name;
        // Position the cube based on the center of the two corners
        this.cube.position = this.corner1.add(this.corner2.subtract(this.corner1).scale(0.5));
        // this.cube.rotate(BABYLON.Vector3.Up(),Math.PI/20);
        let avgZ = 0.5 * (this.corner1.z + this.corner2.z);
        let xDiff = Math.sign(this.corner1.x - this.corner2.x);
        let xp1 = new BABYLON.Vector3(this.corner1.x + 5 * xDiff, 10, avgZ);
        let xp2 = new BABYLON.Vector3(this.corner2.x - 5 * xDiff, 10, avgZ);
        let xScalePts: BABYLON.Vector3[] = [xp1, xp2];
        this.xScaleLinesMesh = BABYLON.MeshBuilder.CreateLines("lines_xscale", {
            points: xScalePts,
            updatable: true,
        }, scene);
    }


    changeCorners(scene: BABYLON.Scene, newCorner2: BABYLON.Vector3) {
        if (this.cube == null) {
            throw new Error();
        }
        // this.cube.dispose();
        // this.corner2 = newCorner2; 
        // this.setup(scene);
        this.cube.rotate(BABYLON.Vector3.Up(), Math.PI / 20);

    }

    move(newPosition: BABYLON.Vector3): Undo {
        if (this.cube == null) {
            throw new Error();
        }
        const originalPosition = this.cube.position.clone();
        this.cube.position = newPosition;
        return new TranslateCustomBoxUndo(this, originalPosition, newPosition);
    }

    rotate(newPosition: BABYLON.Vector3): Undo {
        if (this.cube == null) {
            throw new Error()
        }
        console.log(this.cube.position + " CUBE")
        console.log(newPosition + " CLICKED")
        let u = new BABYLON.Vector2(this.cube?.position.x, this.cube?.position.z);
        let v = new BABYLON.Vector2(newPosition.x, newPosition.z).subtract(u).normalize();
        let s = new BABYLON.Vector2(1, 0);
        let t = this.cube.rotationQuaternion;
        console.log("t  " + t);
        let currenta = 0
        if (t != null) {
            currenta = t.y;
        }
        let angle = Math.acos(v.dot(s));
        console.log("angle: " + angle);
        let c = Math.sign(-v.y);
        console.log("c " + c);
        angle = (angle * c);//-currenta;
        let originalRotation = this.rotAngle;
        this.cube.rotation = new BABYLON.Vector3(0, 0, 0);
        this.cube.rotate(BABYLON.Vector3.Up(), angle);
        this.rotAngle = angle;
        // this.cube.addRotation(0,angle,0);
        console.log(this.rotAngle);

        return new RotateCustomBoxUndo(this, originalRotation, this.rotAngle);
    }

    // scaleX(scalePosition: BABYLON.Vector3): ScaleCustomBoxUndo {
    //     if (this.cube == null) {
    //         throw new Error();
    //     }

    //     let dist = this.cube.position.x - scalePosition.x;
    //     this.cube.scaling.x = dist / 5;
    //     return new ScaleCustomBoxUndo();
    // }

    scaleXBy(i: number): ScaleCustomBoxUndo {
        if (this.cube == null) {
            throw new Error();
        }
        let s = Math.sign(i);
        let scale = this.cube.scaling.clone();
        this.cube.scaling.x += this.scaleFactor * s;
        return new ScaleCustomBoxUndo(this, scale, this.cube.scaling, "x");
    }

    scaleYBy(i: number): ScaleCustomBoxUndo {
        if (this.cube == null) {
            throw new Error();
        }
        let s = Math.sign(i);
        let scale = this.cube.scaling.clone();
        this.cube.scaling.y += this.scaleFactor * s;
        return new ScaleCustomBoxUndo(this, scale, this.cube.scaling, "y");
    }

    scaleZBy(i: number): ScaleCustomBoxUndo {
        if (this.cube == null) {
            throw new Error();
        }
        let s = Math.sign(i);
        let scale = this.cube.scaling.clone();
        this.cube.scaling.z += this.scaleFactor * s;
        return new ScaleCustomBoxUndo(this, scale, this.cube.scaling, "z");
    }

    // scaleY(scalePosition: BABYLON.Vector3): ScaleCustomBoxUndo {
    //     if (this.cube == null) {
    //         throw new Error();
    //     }

    //     let dist = this.cube.position.y - scalePosition.y;
    //     this.cube.scaling.x = dist / 5;
    //     return new ScaleCustomBoxUndo();
    // }

    // scaleZ(scalePosition: BABYLON.Vector3): ScaleCustomBoxUndo {
    //     if (this.cube == null) {
    //         throw new Error();
    //     }

    //     let dist = this.cube.position.z - scalePosition.z;
    //     this.cube.scaling.x = dist / 5;
    //     return new ScaleCustomBoxUndo();
    // }
    generateRandomName(length: number): string {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }
}