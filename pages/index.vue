<template>
  <div>
    <v-btn id="menu-activator" color="primary"> Companies </v-btn>
    <v-menu activator="#menu-activator">
      <v-list>
        <v-list-item
          v-for="(item, index) in items1"
          :key="index"
          :value="index"
          @click="clickSegment(item)"
        >
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-btn id="menu-activator2" color="primary" @click="centerCamera">
      Center Camera
    </v-btn>
    <v-menu activator="#menu-activator2">
      <v-list>
        <v-list-item
          v-for="(item, index) in xyzTileItems"
          :key="index"
          :value="index"
          @click="refreshTiles(item)"
        >
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn id="menu-activator3" color="primary" @click="centerCamera">
      Center Camera
    </v-btn>

    <v-btn id="menu-activator4" color="primary"> Operations </v-btn>

    <!-- Dialog Component -->
    <v-dialog v-model="dialog" persistent max-width="600px">
      <v-card>
        <v-card-title class="headline">Welcome</v-card-title>
        <v-card-text>
          <div class="instructions">
            Use the
            <span class="key">W</span>, <span class="key">A</span>,
            <span class="key">S</span>, <span class="key">D</span> keys, or the
            <span class="key">↑</span>, <span class="key">←</span>,
            <span class="key">↓</span>, <span class="key">→</span> keys, to move
            around the map.
          </div>
          <div class="instructions">
            Use the
            <span class="key">space</span> key to move upwards.
          </div>
          <div class="instructions">Use the mouse 🖱 to move upwards.</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="dialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { App } from "@/src/app";

let items1 = ref<string[]>(["Business Segments"]);
let xyzTileItems = ref<string[]>([
  "Google Satellite",
  "Google Roadmap",
  "Google Hybrid",
]);
let dialog = ref<boolean>(true);
let app: App | null = null;
onMounted(() => {
  app = new App();
  items1.value = Array.from(app.uniqueSegments);
});

function clickSegment(item: string) {
  app?.selectBySegment(item);
}

function centerCamera() {
  app?.centerCamera();
}

function refreshTiles(item: string) {
  app?.refreshTiles(item);
}
</script>

<style scoped>
.instructions {
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.key {
  display: inline-block;
  background-color: #eee;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 5px 10px;
  margin: 0 5px;
  font-weight: bold;
  font-size: 14px;
  font-family: monospace;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
