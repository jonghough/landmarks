import type { TileData } from "./TileData";



export class TileCache {

    cacheMap: Map<number, Map<number, TileData>> = new Map<number, Map<number, TileData>>();
    cacheList: TileData[] = [];
    constructor(public readonly maxSize: number) {

    }

    get(x: number, y: number): TileData | undefined {
        const yMap = this.cacheMap.get(x);
        if (yMap) {
            const tile = yMap.get(y);
            if (tile) {
                // Update the usage list to mark this tile as recently used
                this.updateUsage(tile);
                return tile;
            }
        }
        return undefined;
    }

    put(tile: TileData): void {
        let x = tile.x;
        let y = tile.y;
        // Evict least recently used tile if the cache exceeds the maximum size
        if (this.cacheList.length >= this.maxSize) {
            this.evict();
        }

        // Add the tile to the cache
        if (!this.cacheMap.has(x)) {
            this.cacheMap.set(x, new Map<number, TileData>());
        }
        const yMap = this.cacheMap.get(x)!;
        yMap.set(y, tile);

        // Mark the tile as recently used
        this.cacheList.push(tile);
    }

    // Update usage list for LRU logic
    private updateUsage(tile: TileData): void {
        const index = this.cacheList.indexOf(tile);
        if (index > -1) {
            this.cacheList.splice(index, 1);  // Remove from the current position
            this.cacheList.push(tile);        // Add it to the end (most recently used)
        }
    }

    private evict(): void {
        // slow
        // TODO improve speed
        const lruTile = this.cacheList.shift();  // Remove the first element (least recently used)
        if (lruTile) {
            for (const [x, yMap] of this.cacheMap.entries()) {
                for (const [y, tile] of yMap.entries()) {
                    if (tile === lruTile) {
                        tile.delete();
                        yMap.delete(y);  // Remove from cacheMap
                        if (yMap.size === 0) {
                            this.cacheMap.delete(x);  // Clean up empty maps
                        }
                        return;
                    }
                }
            }
        }
    }


}