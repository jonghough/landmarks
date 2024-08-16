import type { TileData } from "./TileData";




export class TileCache {
    cacheMap: Map<number, Map<number, Map<number, TileData>>> = new Map<number, Map<number, Map<number, TileData>>>();
    cacheList: TileData[] = [];
    tileCoords: Map<TileData, [number, number, number]> = new Map<TileData, [number, number, number]>();
    maxSize: number;

    constructor(maxSize: number) {
        this.maxSize = maxSize;
    }

    // Get a tile from the cache
    get(z: number, x: number, y: number): TileData | undefined {
        const xMap = this.cacheMap.get(z)?.get(x);
        if (xMap) {
            const tile = xMap.get(y);
            if (tile) {
                this.updateUsage(tile);
                return tile;
            }
        }
        return undefined;
    }

    // Add a tile to the cache
    put(z: number, x: number, y: number, tile: TileData): void {
        if (this.cacheList.length >= this.maxSize) {
            this.evict();
        }

        if (!this.cacheMap.has(z)) {
            this.cacheMap.set(z, new Map<number, Map<number, TileData>>());
        }
        const xMap = this.cacheMap.get(z)!;
        if (!xMap.has(x)) {
            xMap.set(x, new Map<number, TileData>());
        }
        const yMap = xMap.get(x)!;
        yMap.set(y, tile);

        this.cacheList.push(tile);
        this.tileCoords.set(tile, [z, x, y]);
    }

    // Update usage list for LRU logic
    private updateUsage(tile: TileData): void {
        const index = this.cacheList.indexOf(tile);
        if (index > -1) {
            this.cacheList.splice(index, 1);
            this.cacheList.push(tile);
        }
    }

    // Evict the least recently used tile
    private evict(): void {
        const lruTile = this.cacheList.shift();
        if (lruTile) {
            const [z, x, y] = this.tileCoords.get(lruTile)!;
            const xMap = this.cacheMap.get(z)!;
            const yMap = xMap.get(x)!;
            yMap.delete(y);

            if (yMap.size === 0) {
                xMap.delete(x);
                if (xMap.size === 0) {
                    this.cacheMap.delete(z);
                }
            }
            lruTile.delete();
            this.tileCoords.delete(lruTile);
        }
    }

    clear() {
        this.tileCoords = new Map();
        this.cacheList.forEach(t => t.delete());
        this.cacheList = [];
        this.cacheMap = new Map();
    }

    activateZLevel(z: number) {
        this.cacheList.filter(t => t !== undefined).forEach(t => {

            t.xyzTileZoomLevel == z ? t.show() : t.hide();
        });
    }

    showAndHide(z: number, v: number) {
        this.cacheList.filter(t => t !== undefined).forEach(t => {

            t.xyzTileZoomLevel == z ? t.showBy(v) : t.hideBy(v);
        });
    }
}


