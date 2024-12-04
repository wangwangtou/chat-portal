import { defineComponent, h } from 'vue';
// 放到main中去引用
// import './bg_svg_icons.js';

import './style.scss'

function getSvgIcons() {
    const svgs = document.querySelectorAll('svg[aria-hidden=true] symbol[id]');
    const result = [];

    svgs.forEach(svg => {
        const id = svg.getAttribute('id');
        if (id.startsWith('bg-')) {
            result.push({ groupName: 'BGIcon', iconName: id });
        }
    })
    return result;
}


export const BGIcon = defineComponent({
    props: ['icon'],
    setup(props, ctx) {
        return () => h('svg', { class: "bg-icon", 'aria-hidden': true }, [h('use', { 'xlink:href': (props.icon?.startsWith('#') ? '' : '#') + props.icon })])
    },
})


const icons = {};
let iconsReady = false;

export const getBgIconReady = () => document.readyState == 'complete'

export const getBGIcons = () => {
    if (document.readyState != 'complete') return icons;
    if (!iconsReady) {
        const BGIconList: { groupName: string, iconName: string }[] = getSvgIcons();
        BGIconList.reduce((pre, icon) => {
            pre[icon.iconName] = defineComponent({
                setup() {
                    return () => h(BGIcon, { icon: icon.iconName })
                },
            })
            return pre;
        }, icons);
    }
    return icons;
}