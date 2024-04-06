<template>
  <div>
    <v-btn id="menu-activator" color="primary"> Create </v-btn>
    <v-menu activator="#menu-activator">
      <v-list>
        <v-list-item
          v-for="(item, index) in items1"
          :key="index"
          :value="index"
        >
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>

    <v-btn id="menu-activator2" color="primary"> Edit </v-btn>
    <v-menu activator="#menu-activator2">
      <v-list>
        <v-list-item
          v-for="(item, index) in items2"
          :key="index"
          :value="index"
        >
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    <v-btn id="menu-activator3" color="primary"> Operations </v-btn>
    <v-menu activator="#menu-activator3">
      <v-list>
        <v-list-item
          v-for="(item, index) in items3"
          :key="index"
          :value="index"
        >
          <v-list-item-title>{{ item }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from "vue";
import { App } from "@/src/app";

let items1 = ref<string[]>(["Create", "Edit"]);
let items2 = ref<string[]>(["Scale X", "Scale Y", "Rotate", "Translate"]);
let items3 = ref<string[]>(["Save", "Undo", "Redo", "Copy"]);
let app: App | null = null;
onMounted(() => {
  app = new App();
  app.setup();
});

function handleClick(item: string) {
  if (item === "Create") {
    app?.setCreateMode();
  }
}
</script>
