<script setup lang="ts">
import Chat from './components/Chat.vue'
import { dashscope as openAICompletions, CHAT_MODEL, CODER_MODEL } from './utils/openAICompletions'

import ChatServer from '../../server/index'
import PortalChatServer from '../../server/portal'

const completionsFunction = new PortalChatServer().completions;
// const completionsFunction = ChatServer.completions;
const chatCompletions: typeof openAICompletions = (messages, options) => openAICompletions(messages, { ...options, model: CHAT_MODEL });
const coderCompletions: typeof openAICompletions = (messages, options) => openAICompletions(messages, { ...options, model: CODER_MODEL });

</script>

<template>
  <div class="layout">
    <div class="wraper1">
      <Chat :completions-function="chatCompletions" />
    </div>
    <div class="wraper2">
      <Chat :completions-function="coderCompletions" />
    </div>
    <div class="wraper3">
      <Chat :completions-function="completionsFunction" />
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  height: 100%;
}
.wraper1 {
  width: 768px;
  height: 768px;
}
.wraper2 {
  width: 768px;
  height: 768px;
}
.wraper3 {
  width: 512px;
  height: 768px;
}
</style>
