<script setup lang="ts">
import { md } from "./_chat/markdown";
import { ElMessage, ElInput } from "element-plus";
import { computed, ref, nextTick } from "vue";
import BgIcon from "../bgicons/bg-icon.vue";

import { IChatProps, UserInputMessage, MessageList, isStreamMessage, MessageItem, StreamMessage, Message, TextMessage } from './chatProps'
import { MessageWithRole } from "../../../server/chatMeta";
import { fa } from "element-plus/es/locale/index.mjs";


const {
  disabled = false,
  readOnly = false,
  history = [],
  value = '',
  stream = true,
  completionsFunction = null,
  openAIProps = {}
} = defineProps<IChatProps>();


const openAICompletionsFunction: IChatProps['completionsFunction'] = async (messageList, { stream, abortSignal: signal }) => {
  return { type: 'text', content: '' };
};

const emit = defineEmits(["update:modelValue", "change"]);

const computedReadOnly = computed(() => readOnly || disabled);

const messageListElRef = ref<HTMLElement | null>(null);

// 当前对话产生的消息
const currentMessages = ref<MessageList>([]);

// 用户输入
const userInput = ref<UserInputMessage>({ 
  input: { type: 'text', content: '' },
  extra: null,
});

// 正在生成对话
const isTalking = ref<boolean>(false);
// 显示流式闪烁
const flickerShow = ref<boolean>(false);

const signalRef = ref<AbortController | null>(null);
const contentRef = ref<(HTMLElement)[]>([]);
const containerRef = ref<(HTMLElement)[]>([]);
const flickerRef = ref<(HTMLElement)[]>([]);

const computedMessageList = computed<MessageList>(() =>
  ([] as MessageList).concat(history, currentMessages.value).filter((item) => item)
);

const chatCompletion = async (userMessage: MessageWithRole, signal: AbortSignal) => {
  try {
    currentMessages.value.push(userMessage);
    // signalRef.value = signal;
    const respMessage = await (completionsFunction || openAICompletionsFunction)(computedMessageList.value, { stream, abortSignal: signal })
    if (isStreamMessage(respMessage)) {
      const tempResult: MessageItem[] = [];
      const streamMessage = respMessage as StreamMessage;
      let message: MessageItem, stop: boolean, index: number;
      currentMessages.value.push({ role: 'assistant', content: tempResult });
      const currentMessageIndex = currentMessages.value.length - 1;
      do {
          ({ message, stop, index } = await streamMessage());
          if (index > tempResult.length - 1) {
            tempResult.push(message);
          }
          else {
              if (typeof message != 'string' && message.type == 'text') {
                flickerShow.value = true;
                (tempResult[index] as TextMessage).content += message.content;
                currentMessages.value[currentMessageIndex] = { role: 'assistant', content: tempResult }; // 触发界面更新
                nextTick(() => {
                  updateCursor();
                  scrollToBottom();
                });
              } else {
                flickerShow.value = false;
                tempResult[index] = message;
                currentMessages.value[currentMessageIndex] = { role: 'assistant', content: tempResult }; // 触发界面更新
                nextTick(() => {
                  scrollToBottom();
                });
              }
          }
      } while (!stop);
      flickerShow.value = false; 
    } else {
      const message = respMessage as Message;
      currentMessages.value.push({ role: "assistant", content: message });
    }
  } catch (e: any) {
    if (e.name !== "AbortError") {
      ElMessage.info("出现错误：" + e.message);
    }
  }
}

const messageSend = async (event: KeyboardEvent) => {
  if (event.shiftKey) {
    return;
  }
  event.preventDefault();
  console.log(event);
  if (isTalking.value) {
    if (stream) {
        signalRef.value?.abort();
        isTalking.value = false;
      }
      return;
  }
  let textInput = {
    ...userInput.value?.input
  }
  userInput.value.input.content = "";
  if (!textInput.content || !textInput.content.trim()) {
    ElMessage.info("不能发送空白信息");
    return;
  }
  textInput.content = textInput.content.trim();
  const userMessage: MessageWithRole = { role: "user", content: userInput.value?.extra ? [textInput, userInput.value.extra] : textInput };
  nextTick(() => {
    scrollToBottom();
  });
  if (!value) {
    // 没有对话简介，生成一个对话简介
    // emit("update:modelValue", userInput.value.trim());
    emit("change", textInput.content);
  }
  isTalking.value = true;
  signalRef.value = new AbortController();
  const { signal } = signalRef.value;
  nextTick(async () => {
    await chatCompletion(userMessage, signal)
    isTalking.value = false;
  });
};

// 获取最后一节文本节点
const getLastTextNode = (node: HTMLElement) : HTMLElement | null => {
  if (node.nodeType === Node.TEXT_NODE) {
    return node;
  }
  for (let i = node.childNodes.length - 1; i >= 0; i--) {
    let result = getLastTextNode(node.childNodes[i] as HTMLElement);
    if (result) {
      return result;
    }
  }
  return null;
};

const updateCursor = () => {
  if (contentRef.value.length == 0) return; 
  // 获取最后一个文本元素
  let lastTextNode = getLastTextNode(
    contentRef.value[contentRef.value.length - 1]
  );
  // 创建一个临时的文本节点，以便选中最后一个文字
  let tempText = document.createTextNode(".");
  if (lastTextNode) {
    lastTextNode.previousSibling?.appendChild(tempText);
  } else {
    contentRef.value[contentRef.value.length - 1]?.appendChild(tempText);
  }

  // 选中最后一个文字
  const range = document.createRange();
  range.setStart(tempText, 0);
  range.setEnd(tempText, 0);

  // 这个文字是相对于浏览器
  const rect = range.getBoundingClientRect();
  const textRect =
    containerRef.value[containerRef.value.length - 1]?.getBoundingClientRect();

  if (textRect) {
    const x = rect.left - textRect.left;
    const y = rect.top - textRect.top - 13; // 10 是光标高度的一半，为了居中显示光标

    flickerRef.value[
      flickerRef.value.length - 1
    ].style.transform = `translate(${x}px,${y}px)`;

    tempText.remove();
  }
};

const scrollToBottom = () => {
  if (!messageListElRef.value) return;
  messageListElRef.value.scrollTop = messageListElRef.value.scrollHeight;
};

</script>

<template>
  <div
    class="chat-container"
    :style="!computedReadOnly ? {} : { paddingBottom: 0 }">
    <div class="message-container log_content_nor" ref="messageListElRef">
      <div>
        <div
          class="message"
          v-for="(msg, index) in computedMessageList"
          :key="index">
          <div v-if="msg.role === 'user'" class="user">
            <div class="header">
              <img src="@/assets/imgs/img-head.png" />
            </div>
            <div
              class="content">
              <template v-for="(item, index) in (Array.isArray(msg.content) ? msg.content : [msg.content])">
                <div v-if="item.type == 'text' || typeof item == 'string'" v-html="md.render(typeof item == 'string' ? item : item.content)"></div>
                <div v-else-if="item.type == 'image'" v-loading="item.image_url == null">
                  <img v-if="item.image_url" :src="item.image_url"/>
                </div>
                <div v-else-if="item.type == 'data'" v-loading="item.data == null">
                  data
                </div>
              </template>
            </div>
          </div>
          <div v-if="msg.role === 'assistant'" class="assistant">
            <div class="header">
              <img src="@/assets/imgs/img-robot-head.png" />
            </div>
            <div
              class="content"
              v-if="index !== computedMessageList.length - 1">
              <template v-for="(item, index) in (Array.isArray(msg.content) ? msg.content : [msg.content])">
                <div v-if="item.type == 'text' || typeof item == 'string'" v-html="md.render(typeof item == 'string' ? item : item.content)"></div>
                <div v-else-if="item.type == 'image'" v-loading="item.image_url == null">
                  <img v-if="item.image_url" :src="item.image_url"/>
                </div>
                <div v-else-if="item.type == 'data'" v-loading="item.data == null">
                  data
                </div>
              </template>
            </div>
            <div class="content" ref="containerRef" v-else>
              <template v-for="(item, index) in (Array.isArray(msg.content) ? msg.content : [msg.content])">
                <div v-if="item.type == 'text' || typeof item == 'string'" >
                  <div ref="contentRef" v-html="md.render(typeof item == 'string' ? item : item.content)"></div>
                  <i class="flicker" v-show="flickerShow" ref="flickerRef"></i>
                </div>
                <div v-else-if="item.type == 'image'" v-loading="item.image_url == null">
                  <img v-if="item.image_url" :src="item.image_url"/>
                </div>
                <div v-else-if="item.type == 'data'" v-loading="item.data == null">
                  data
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-if="!computedReadOnly" class="input-container">
      <el-input
        type="textarea"
        class="log_content_nor"
        :rows="2"
        resize="none"
        v-model="userInput.input.content"
        placeholder="通过shift+回车换行"
        @keydown.enter="messageSend">
      </el-input>
      <div
        class="send-box"
        @click="messageSend"
        :style="{
          color: '#fff',
          backgroundColor: '#005de1',
          borderColor: '#005de1',
        }">
        <bg-icon v-if="!isTalking" icon="#bg-ic-send"></bg-icon>
        <bg-icon v-else icon="#bg-ic-stop"></bg-icon>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.chat-container {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: #f7f7f9;
  border-radius: 4px;
  border: solid 1px #dadee7;
  box-sizing: border-box;
}
.self {
  text-align: right;
}
.assistant {
  text-align: left;
}
.input-container {
  position: absolute;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  width: 100%;
  height: 98px;
  padding: 16px;
  background-color: #ffffff;
  border-top: solid 1px #dadee7;
  box-sizing: border-box;
}

.input-container :deep(.el-input-group__append) {
  background-color: #fff;
}

.input-container .el-textarea :deep(.el-textarea__inner) {
  &::-webkit-scrollbar {
    width: 0px;
    /*对垂直流动条有效*/
    height: 0px;
    /*对水平流动条有效*/
  }
}

.send-box {
  width: 36px;
  height: 36px;
  font-size: 18px;
  font-weight: 200;
  line-height: 34px;
  text-align: center;
  cursor: pointer;
  margin-left: 10px;
  border-radius: 4px;
  border: 1px solid #dadee7;
}

.message-container {
  width: 100%;
  height: calc(100% - 100px);
  padding: 24px;
  overflow-y: auto;
  box-sizing: border-box;

  .message {
    width: 100%;
    overflow: hidden;

    .header {
      width: 32px;
      height: 32px;
      margin-top: 4px;
      overflow: hidden;
      border-radius: 50%;

      img {
        width: 100%;
      }
    }

    .content {
      min-height: 46px;
      background-color: #ccdff9;
      border-radius: 4px;
      line-height: 26px;
      padding: 10px 16px;
      max-width: calc(100% - 42px);
    }

    .user {
      float: right;
      margin-bottom: 24px;
      .header {
        float: right;
        margin-left: 10px;
      }

      .content {
        float: right;
        text-align: left;
      }
    }

    .assistant {
      float: left;
      margin-bottom: 24px;
      .header {
        float: left;
        margin-right: 10px;
      }

      .content {
        float: left;
        background-color: #ffffff;
        position: relative;

        .flicker {
          position: absolute;
          left: 10px;
          top: 19px;
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #000;
          animation: flicker 1s infinite;
        }
      }
    }
  }
}

html :deep(.content) {
}
.content {
  :deep(.hljs) {
    padding: 8px 16px;
    margin: 0px 16px;
    border-radius: 4px;
    color: #383a42;
    background: #fafafa;

    .hljs-comment,
    .hljs-quote {
      color: #a0a1a7;
      font-style: italic;
    }
    .hljs-doctag,
    .hljs-formula,
    .hljs-keyword {
      color: #a626a4;
    }
    .hljs-deletion,
    .hljs-name,
    .hljs-section,
    .hljs-selector-tag,
    .hljs-subst {
      color: #e45649;
    }
    .hljs-literal {
      color: #0184bb;
    }
    .hljs-addition,
    .hljs-attribute,
    .hljs-meta .hljs-string,
    .hljs-regexp,
    .hljs-string {
      color: #50a14f;
    }
    .hljs-attr,
    .hljs-number,
    .hljs-selector-attr,
    .hljs-selector-class,
    .hljs-selector-pseudo,
    .hljs-template-variable,
    .hljs-type,
    .hljs-variable {
      color: #986801;
    }
    .hljs-bullet,
    .hljs-link,
    .hljs-meta,
    .hljs-selector-id,
    .hljs-symbol,
    .hljs-title {
      color: #4078f2;
    }
    .hljs-built_in,
    .hljs-class .hljs-title,
    .hljs-title.class_ {
      color: #c18401;
    }
    .hljs-emphasis {
      font-style: italic;
    }
    .hljs-strong {
      font-weight: 700;
    }
    .hljs-link {
      text-decoration: underline;
    }
  }

  :deep(p:last-of-type) {
    margin-bottom: 0px;
  }
}

.input-container :deep(.el-textarea__inner) {
  min-height: 36px !important;
}

@keyframes flicker {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
