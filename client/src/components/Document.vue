<script setup lang="ts">
import { watch, ref, nextTick, onMounted, onUnmounted } from "vue";
import Editor from '@hufe921/canvas-editor'

const contentRef = ref<HTMLElement>();
const editorRef = ref<any>();
const stateRef = ref({
    changing: false,
});

const props = defineProps({
    value: Object,
})

const emit = defineEmits(["update:modelValue", "change"]);

watch(() => props.value, (newValue) => {
    if (!stateRef.value.changing) {
        if (newValue) {
            const { payload, options } = newValue;
            editorRef.value?.command.executeSetValue(payload, options);
        }
    }
})

onMounted(() => {
    editorRef.value = new Editor(contentRef.value, { main: [] });
    if (props.value) {
        const { payload, options } = props.value;
        editorRef.value?.command.executeSetValue(payload, options);
    }
    editorRef.value.listener.contentChange = () => {
        const { data, options } =  editorRef.value?.command.getValue();
        stateRef.value.changing = true;
        emit("update:modelValue", { payload: data, options });
        nextTick(() => {
            stateRef.value.changing = false;
        });
    };
})

onUnmounted(() => {
    editorRef.value.destroy();
})

</script>

<template>
    <div class="canvas-editor" ref="contentRef"></div>
</template>

<style>
.canvas-editor {
    height: 100%;
    width: 100%;
}
</style>