<script setup lang="ts">
import Chat from './components/Chat.vue'

import ChatServer from '../../server/index'

const completionsFunction = ChatServer.completions;

</script>

<template>
  <div class="wraper">
    <Chat :completions-function="completionsFunction" />
  </div>
</template>

<style scoped>
.wraper {
  width: 1024px;
  height: 768px;
}
</style>
