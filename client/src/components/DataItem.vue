<script setup lang="ts">
import { computed, ref } from "vue";
import { md } from "./_chat/markdown";
import Document from "./Document.vue";
import Document2 from "./Document2.vue";
import Sheet from "./Sheet.vue";
import { ElDrawer, ElPopover, ElIcon } from "element-plus";
import { InfoFilled } from '@element-plus/icons-vue'

const components = {
    Document: {
        Component: Document,
        drawerProps: {
            size: '830px',
        }
    },
    Document2: {
        Component: Document2,
        drawerProps: {
            size: '830px',
        }
    },
    Sheet: {
        Component: Sheet,
        drawerProps: {
            size: '80%',
        }
    },
};

const dialogVisible = ref(false);

const props = defineProps({
    data: {
        type: Object,
        required: true
    },
    detail: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    }
});

const component = computed(() => {
    return props.data && components[props.data.type] ? components[props.data.type] : null;
});
</script>
<template>
    <div class="data-item">
        <div class="data-item-title" v-loading="!data" @click="dialogVisible=true">
            {{ title }}
            <el-popover v-if="detail" placement="top" trigger="hover" width="960px">
                <template #reference>
                    <el-icon><InfoFilled /></el-icon>
                </template>
                <div style="max-height: 540px; overflow: auto;" v-html="md.render(detail)"></div>
            </el-popover>
        </div>
        <el-drawer v-if="component" v-model="dialogVisible" title="数据详情" v-bind="component.drawerProps">
            <component.Component :value="data"></component.Component>
        </el-drawer>
    </div>
</template>