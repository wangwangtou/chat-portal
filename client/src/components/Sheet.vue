<template>
    <div class="sheet-container" :id="univerId"></div>
</template>

<script setup lang="ts">
import { onMounted, watch, ref } from 'vue'

import { createUniver, defaultTheme, LocaleType, merge } from '@univerjs/presets'
import { UniverSheetsConditionalFormattingPreset } from '@univerjs/presets/preset-sheets-conditional-formatting'
import sheetsConditionalFormattingZhCN from '@univerjs/presets/preset-sheets-conditional-formatting/locales/zh-CN'
import { UniverSheetsCorePreset } from '@univerjs/presets/preset-sheets-core'
import sheetsCoreZhCN from '@univerjs/presets/preset-sheets-core/locales/zh-CN'
import { UniverSheetsDataValidationPreset } from '@univerjs/presets/preset-sheets-data-validation'
import sheetsDataValidationZhCN from '@univerjs/presets/preset-sheets-data-validation/locales/zh-CN'
import { UniverSheetsDrawingPreset } from '@univerjs/presets/preset-sheets-drawing'
import sheetsDrawingZhCN from '@univerjs/presets/preset-sheets-drawing/locales/zh-CN'
import { UniverSheetsFilterPreset } from '@univerjs/presets/preset-sheets-filter'
import sheetsFilterZhCN from '@univerjs/presets/preset-sheets-filter/locales/zh-CN'
import { UniverSheetsHyperLinkPreset } from '@univerjs/presets/preset-sheets-hyper-link'
import sheetsHyperLinkZhCN from '@univerjs/presets/preset-sheets-hyper-link/locales/zh-CN'

import '@univerjs/presets/lib/styles/preset-sheets-core.css'
import '@univerjs/presets/lib/styles/preset-sheets-conditional-formatting.css'
import '@univerjs/presets/lib/styles/preset-sheets-data-validation.css'
import '@univerjs/presets/lib/styles/preset-sheets-drawing.css'
import '@univerjs/presets/lib/styles/preset-sheets-filter.css'
import '@univerjs/presets/lib/styles/preset-sheets-hyper-link.css'

import Papa from 'papaparse';

const univerId = `univer-${new Date().getTime()}-${(Math.random() * 10000).toFixed()}`
const workbookRef = ref<any>();

const props = defineProps({
    value: Object,
})

const emit = defineEmits(["update:modelValue", "change"]);
// 帮我搜索历年人口平均年龄，输出到表格中
const updateSheetData = (newValue: any) => {
    const { csv, style } = newValue;
    const { data: rows } = Papa.parse(csv, {
        header: false,
        skipEmptyLines: true
    });
    if (workbookRef.value) {
        const [worksheet] = workbookRef.value.getSheets();
        rows.forEach((row: any[], rowIndex: number) => {
            row.forEach((cellValue, colIndex) => {
                // worksheet.setCellValue(rowIndex, colIndex, cellValue);
            });
        });
    }
}


watch(() => props.value, (newValue) => {
    if (newValue) updateSheetData(newValue);
})

onMounted(() => {
    const { univerAPI } = createUniver({
        locale: LocaleType.ZH_CN,
        locales: {
            [LocaleType.ZH_CN]: merge(
                {},
                sheetsCoreZhCN,
                sheetsConditionalFormattingZhCN,
                sheetsDataValidationZhCN,
                sheetsDrawingZhCN,
                sheetsFilterZhCN,
                sheetsHyperLinkZhCN,
            ),
        },
        theme: defaultTheme,
        presets: [
            UniverSheetsCorePreset({
                container: univerId,
            }),
            UniverSheetsConditionalFormattingPreset(),
            UniverSheetsDataValidationPreset(),
            UniverSheetsDrawingPreset(),
            UniverSheetsFilterPreset(),
            UniverSheetsHyperLinkPreset(),
        ],
    })
    window.univerAPI = univerAPI;
    workbookRef.value = univerAPI.createWorkbook({ id: 'workbook-1' });
    
    if (props.value) updateSheetData(props.value);
})
</script>

<style>
.sheet-container {
    height: 100%;
    width: 100%;
}
/* 匹配 属性 id 是以 univer-doc-selection-container 开头的元素，设置z-index为3000 */
[id^=univer-doc-selection-container],
.univer-popup-fixed {
    z-index: 3000!important;
}
.univer-z-\[1071\] {
    z-index: 2071;
}
.univer-z-\[1100\] {
    z-index: 2100;
}
.univer-z-\[1001\] {
    z-index: 2001;
}
</style>