<template>
  <div>
    <v-btn id="menu-activator" class="control-button" color="primary"> Capital Cities </v-btn>
    <v-menu activator="#menu-activator">
      <v-list>
        <v-list-item
          v-for="(item, index) in items1"
          :key="index"
          :value="index"
          @click="clickCapitalCity(item)"
        >
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-btn id="menu-activator2" class="control-button" color="primary"> Select XYZ Tiles </v-btn>
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

    <v-btn id="menu-activator3" class="control-button" color="primary" @click="centerCamera">
      Center Camera
    </v-btn>

    <!-- Dialog Component -->
    <v-dialog v-model="dialog" persistent max-width="600px">
      <v-card>
        <v-card-title class="headline">Welcome</v-card-title>
        <v-card-text>
          <div class="instructions">
            Use the
            <span class="key">W</span>, <span class="key">A</span>, <span class="key">S</span>,
            <span class="key">D</span> keys, or the <span class="key">↑</span>,
            <span class="key">←</span>, <span class="key">↓</span>, <span class="key">→</span> keys,
            to move around the map.
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

    <v-dialog v-model="infoDialog" persistent max-width="600px">
      <v-card>
        <v-card-title class="headline">{{ infoTitle }}</v-card-title>
        <v-card-text>{{ infoText }}</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" @click="infoDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
import {ref, onMounted, reactive} from "vue";
import {App} from "@/src/app";

let items1 = ref<string[]>([]);
let xyzTileItems = ref<string[]>([
  "Google Satellite",
  "Google Roadmap",
  "Google Hybrid",
  "Open Streetmap",
  "Moon",
]);
let dialog = ref<boolean>(true);
let infoDialog = ref<boolean>(false);
let infoTitle = ref<string>("");
let infoText = ref<string>("");

let app: App | null = null;
onMounted(() => {
  app = new App(showInfoDialog);
  items1.value = Array.from(app.getCapitalCityNames());
});
function openUrl(url: string) {
  window.open(url, "__blank");
}
function clickCapitalCity(item: string) {
  app?.selectCapital(item);
}

function centerCamera() {
  app?.centerCamera();
}

function refreshTiles(item: string) {
  app?.refreshTiles(item);
}

function showInfoDialog(title: string, text: string) {
  infoDialog.value = true;
  infoText.value = text;
  infoTitle.value = title;
}
</script>

<style scoped>
.control-button {
  padding: 5px;
  margin: 10px;
}
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
