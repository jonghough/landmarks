import * as BABYLON from "@babylonjs/core";
export enum BoxState {
    Idle,
    Selected
}

BABYLON.Effect.ShadersStore["boxVertexShader"] =
    `
        precision highp float;

        attribute vec3 position;
        attribute vec3 normal;
        attribute vec2 uv;
        
        uniform mat4 worldViewProjection;
        
        varying vec2 vUV;
        
        void main(void) {
            gl_Position = worldViewProjection * vec4(position, 1.0);
            vUV = uv;
        }`;

BABYLON.Effect.ShadersStore["boxFragmentShader"] =
    `// custom.fragment.fx
precision highp float;

varying vec2 vUV;
uniform float time;

float hash(vec2 p) {
return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
vec2 i = floor(p);
vec2 f = fract(p);

float a = hash(i);
float b = hash(i + vec2(1.0, 0.0));
float c = hash(i + vec2(0.0, 1.0));
float d = hash(i + vec2(1.0, 1.0));

vec2 u = f * f * (3.0 - 2.0 * f);

return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main(void) {
// Adjust UV coordinates to create a grid pattern
vec2 gridUV = vUV * vec2(20.0, 20.0); // Scale to control the size of windows
vec2 gridPos = fract(gridUV); // Get fractional part to create grid
float gridX = gridUV.x - gridPos.x;
float gridY = gridUV.y - gridPos.y;
// Create window frames
float modTime = time - (3.0 * floor(time / 3.0));
float frameWidth = 0.1; // Adjust for frame thickness
float window = step(frameWidth, gridPos.x) * step(frameWidth, gridPos.y) * step(gridPos.x, 1.0 - frameWidth) * step(gridPos.y, 1.0 - frameWidth);

// Generate noise based on grid position and time
float noiseValue = noise(floor(gridUV) + vec2(modTime *1.0, modTime * 0.1));

// Apply threshold to create a twinkling effect
float threshold = 0.5 + 0.25 * sin(modTime * 0.04+window*0.01+0.01*gridY+0.021*gridX);
float twinkle = step(threshold, noiseValue);
float sinT = (9.0 + sin(modTime*10.0+gridX))*0.1;
float cosT = (9.0 + sin(modTime*15.0+10.6*gridY))*0.1;
// Set colors
vec4 windowColor = vec4(0.85*sinT+0.25*cosT,  sinT, 0.99*cosT, 1.0); // Light color
vec4 buildingColor = vec4(0.1,0.08,0.08, 1.0); // Building color

// Mix colors based on window and twinkle
vec4 finalColor = mix(buildingColor, windowColor, window * twinkle);

gl_FragColor = finalColor;
}
`;

export class CustomBox {
    cube: BABYLON.Mesh | null = null;
    timeOffset: number;
    name: string = "";
    constructor(public corner1: BABYLON.Vector3, public corner2: BABYLON.Vector3, scene: BABYLON.Scene) {
        this.setup(scene);
        this.timeOffset = 50 * Math.random()
    }

    private setup(scene: BABYLON.Scene) {

        let height = Math.abs(this.corner2.y - this.corner1.y);
        let width = Math.abs(this.corner1.x - this.corner2.x);
        let depth = Math.abs(this.corner1.z - this.corner2.z);
        this.cube = BABYLON.MeshBuilder.CreateBox("cube_" + this.generateRandomName(12), { height: height, width: width, depth: depth, updatable: true }, scene);
        this.name = this.cube.name;




        var customMaterial = new BABYLON.ShaderMaterial("shader", scene, {
            vertex: "box",
            fragment: "box",
        }, {
            attributes: ["position", "normal", "uv"],
            uniforms: ["world", "worldView", "worldViewProjection", "view", "projection", "time"]
        });
        this.cube.material = customMaterial;
        let __this = this;
        scene.registerBeforeRender(function () {

            var time = (performance.now() * 0.00001) + __this.timeOffset; // Convert to seconds
            customMaterial.setFloat("time", time);
        });

        // Position the cube based on the center of the two corners
        this.cube.position = this.corner1.add(this.corner2.subtract(this.corner1).scale(0.5));
    }



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

    hide() {
        if (this.cube)
            this.cube.isVisible = false;

    }

    show() {
        if (this.cube)
            this.cube.isVisible = true;

    }

    dispose() {
        this.cube?.dispose();
    }
}