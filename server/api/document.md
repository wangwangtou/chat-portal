### 数据结构

```typescript
// 数据元素
interface IElement {
  // 基础
  id?: string;
  type?: {
    TEXT = 'text',
    IMAGE = 'image',
    TABLE = 'table',
    HYPERLINK = 'hyperlink',
    SUPERSCRIPT = 'superscript',
    SUBSCRIPT = 'subscript',
    SEPARATOR = 'separator',
    PAGE_BREAK = 'pageBreak',
    CONTROL = 'control',
    CHECKBOX = 'checkbox',
    RADIO = 'radio',
    LATEX = 'latex',
    TAB = 'tab',
    DATE = 'date',
    BLOCK = 'block'
  };
  value: string;
  valueList?: IElement[]; // 复合元素（超链接、标题、列表等）使用
  extension?: unknown;
  externalId?: string;
  // 样式
  font?: string;
  size?: number;
  width?: number;
  height?: number;
  bold?: boolean;
  color?: string;
  highlight?: string;
  italic?: boolean;
  underline?: boolean;
  strikeout?: boolean;
  rowFlex?: {
    LEFT = 'left',
    CENTER = 'center',
    RIGHT = 'right',
    ALIGNMENT = 'alignment',
    JUSTIFY = 'justify'
  };
  rowMargin?: number;
  letterSpacing?: number;
  textDecoration?: {
    style?: TextDecorationStyle;
  };
  // 组信息-可用于批注等其他成组使用场景
  groupIds?: string[];
  // 表格
  conceptId?: string;
  colgroup?: {
    width: number;
  }[];
  trList?: {
    height: number;
    pagingRepeat?: boolean;
    extension?: unknown;
    externalId?: string;
    tdList: {
      colspan: number;
      rowspan: number;
      conceptId?: string;
      verticalAlign?: VerticalAlign;
      backgroundColor?: string;
      borderTypes?: TdBorder[];
      slashTypes?: TdSlash[];
      value: IElement[];
      extension?: unknown;
      externalId?: string;
      disabled?: boolean;
      deletable?: boolean;
    }[];
  }[];
  borderType?: TableBorder;
  borderColor?: string;
  tableToolDisabled?: boolean;
  // 超链接
  url?: string;
  // 上下标
  actualSize?: number;
  // 分割线
  dashArray?: number[];
  // 控件
  control?: {
    type: {
      TEXT = 'text',
      SELECT = 'select',
      CHECKBOX = 'checkbox',
      RADIO = 'radio'
      DATE = 'date',
      NUMBER = 'number'
    };
    value: IElement[] | null;
    placeholder?: string;
    conceptId?: string;
    prefix?: string;
    postfix?: string;
    preText?: string;
    postText?: string;
    minWidth?: number;
    underline?: boolean;
    border?: boolean;
    extension?: unknown;
    indentation?: ControlIndentation;
    rowFlex?: RowFlex
    deletable?: boolean;
    disabled?: boolean;
    pasteDisabled?: boolean;
    code: string | null;
    min?: number;
    max?: number;
    flexDirection: FlexDirection;
    valueSets: {
      value: string;
      code: string;
    }[];
    isMultiSelect?: boolean;
    multiSelectDelimiter?: string;
    dateFormat?: string;
    font?: string;
    size?: number;
    bold?: boolean;
    color?: string;
    highlight?: string;
    italic?: boolean;
    strikeout?: boolean;
    selectExclusiveOptions?: {
      inputAble?: boolean;
    }
  };
  controlComponent?: {
    PREFIX = 'prefix',
    POSTFIX = 'postfix',
    PLACEHOLDER = 'placeholder',
    VALUE = 'value',
    CHECKBOX = 'checkbox',
    RADIO = 'radio'
  };
  // 复选框
  checkbox?: {
    value: boolean | null;
  };
  // 单选框
  radio?: {
    value: boolean | null;
  };
  // LaTeX
  laTexSVG?: string;
  // 日期
  dateFormat?: string;
  // 图片
  imgDisplay?: {
    INLINE = 'inline',
    BLOCK = 'block'
  }
  imgFloatPosition?: {
    x: number;
    y: number;
    pageNo?: number;
  }
  // 内容块
  block?: {
    type: {
      IFRAME = 'iframe',
      VIDEO = 'video'
    };
    iframeBlock?: {
      src?: string;
      srcdoc?: string;
    };
    videoBlock?: {
      src: string;
    };
  };
  // 标题
  level?: TitleLevel;
  title?: {
    conceptId?: string;
    deletable?: boolean;
    disabled?: boolean;
  };
  // 列表
  listType?: ListType;
  listStyle?: ListStyle;
  listWrap?: boolean;
  // 区域
  areaId?: string;
  area?: {
    extension?: unknown;
    top?: number;
    borderColor?: string;
    backgroundColor?: string;
    mode?: AreaMode;
  };
}

declare enum EditorComponent {
    COMPONENT = "component",
    MENU = "menu",
    MAIN = "main",
    FOOTER = "footer",
    CONTEXTMENU = "contextmenu",
    POPUP = "popup",
    CATALOG = "catalog",
    COMMENT = "comment"
}
declare enum EditorContext {
    PAGE = "page",
    TABLE = "table"
}
declare enum EditorMode {
    EDIT = "edit",
    CLEAN = "clean",
    READONLY = "readonly",
    FORM = "form",
    PRINT = "print",
    DESIGN = "design"
}
declare enum EditorZone {
    HEADER = "header",
    MAIN = "main",
    FOOTER = "footer"
}
declare enum PageMode {
    PAGING = "paging",
    CONTINUITY = "continuity"
}
declare enum PaperDirection {
    VERTICAL = "vertical",
    HORIZONTAL = "horizontal"
}
declare enum WordBreak {
    BREAK_ALL = "break-all",
    BREAK_WORD = "break-word"
}
declare enum RenderMode {
    SPEED = "speed",
    COMPATIBILITY = "compatibility"
}
// 表格配置
interface ITableOption {
  tdPadding?: IPadding // 单元格内边距。默认：[0, 5, 5, 5]
  defaultTrMinHeight?: number // 默认表格行最小高度。默认：42
  defaultColMinWidth?: number // 默认表格列最小宽度（整体宽度足够时应用，否则会按比例缩小）。默认：40
}

// 页眉配置
interface IHeader {
  top?: number // 距离页面顶部大小。默认：30
  maxHeightRadio?: MaxHeightRatio // 占页面最大高度比。默认：HALF
  disabled?: boolean // 是否禁用
  editable?: boolean // 禁止编辑标题内容
}

// 页脚配置
interface IFooter {
  bottom?: number // 距离页面底部大小。默认：30
  maxHeightRadio?: MaxHeightRatio // 占页面最大高度比。默认：HALF
  disabled?: boolean // 是否禁用
  editable?: boolean // 禁止编辑页脚内容
}

// 页码配置
interface IPageNumber {
  bottom?: number // 距离页面底部大小。默认：60
  size?: number // 字体大小。默认：12
  font?: string // 字体。默认：Microsoft YaHei
  color?: string // 字体颜色。默认：#000000
  rowFlex?: RowFlex // 行对齐方式。默认：CENTER
  format?: string // 页码格式。默认：{pageNo}。示例：第{pageNo}页/共{pageCount}页
  numberType?: NumberType // 数字类型。默认：ARABIC
  disabled?: boolean // 是否禁用
  startPageNo?: number // 起始页码。默认：1
  fromPageNo?: number // 从第几页开始出现页码。默认：0
  maxPageNo?: number | null // 最大页码（从0开始）。默认：null
}

// 水印配置
interface IWatermark {
  data: string // 文本。
  color?: string // 颜色。默认：#AEB5C0
  opacity?: number // 透明度。默认：0.3
  size?: number // 字体大小。默认：200
  font?: string // 字体。默认：Microsoft YaHei
  repeat?: boolean // 重复水印。默认：false
  gap?: [horizontal: number, vertical: number] // 水印间距。默认：[10,10]
}

// 占位文本配置
interface IPlaceholder {
  data: string // 文本。
  color?: string // 颜色。默认：#DCDFE6
  opacity?: number // 透明度。默认：1
  size?: number // 字体大小。默认：16
  font?: string // 字体。默认：Microsoft YaHei
}

// 行号配置
interface ILineNumberOption {
  size?: number // 字体大小。默认：12
  font?: string // 字体。默认：Microsoft YaHei
  color?: string // 颜色。默认：#000000
  disabled?: boolean // 是否禁用。默认：true
  right?: number // 距离正文距离。默认：20
  type?: LineNumberType // 编号类型（每页重新编号、连续编号）。默认：连续编号
}

// 页面边框配置
interface IPageBorderOption {
  color?: string // 颜色。默认：#000000
  lineWidth?: number // 宽度。默认：1
  padding?: IPadding // 距离正文内边距。默认：[0, 5, 0, 5]
  disabled?: boolean // 是否禁用。默认：true
}

// 选项配置
interface IEditorOption {
  mode?: EditorMode // 编辑器模式：编辑、清洁（不显示视觉辅助元素。如：分页符）、只读、表单（仅控件内可编辑）、打印（不显示辅助元素、未书写控件及前后括号）、设计模式（不可删除、只读等配置不控制）。默认：编辑
  defaultType?: string // 默认元素类型。默认：TEXT
  defaultColor?: string // 默认字体颜色。默认：#000000
  defaultFont?: string // 默认字体。默认：Microsoft YaHei
  defaultSize?: number // 默认字号。默认：16
  minSize?: number // 最小字号。默认：5
  maxSize?: number // 最大字号。默认：72
  defaultBasicRowMarginHeight?: number // 默认行高。默认：8
  defaultRowMargin?: number // 默认行间距。默认：1
  defaultTabWidth?: number // 默认tab宽度。默认：32
  width?: number // 纸张宽度。默认：794
  height?: number // 纸张高度。默认：1123
  scale?: number // 缩放比例。默认：1
  pageGap?: number // 纸张间隔。默认：20
  underlineColor?: string // 下划线颜色。默认：#000000
  strikeoutColor?: string // 删除线颜色。默认：#FF0000
  rangeColor?: string // 选区颜色。默认：#AECBFA
  rangeAlpha?: number // 选区透明度。默认：0.6
  rangeMinWidth?: number // 选区最小宽度。默认：5
  searchMatchColor?: string // 搜索高亮颜色。默认：#FFFF00
  searchNavigateMatchColor?: string // 搜索导航高亮颜色。默认：#AAD280
  searchMatchAlpha?: number // 搜索高亮透明度。默认：0.6
  highlightAlpha?: number // 高亮元素透明度。默认：0.6
  resizerColor?: string // 图片尺寸器颜色。默认：#4182D9
  resizerSize?: number // 图片尺寸器大小。默认：5
  marginIndicatorSize?: number // 页边距指示器长度。默认：35
  marginIndicatorColor?: string // 页边距指示器颜色。默认：#BABABA
  margins?: IMargin // 页面边距。默认：[100, 120, 100, 120]
  pageMode?: PageMode // 纸张模式：连页、分页。默认：分页
  renderMode?: RenderMode // 渲染模式：极速（多个字组合渲染）、兼容（逐字渲染：避免浏览器字体等环境差异）。默认：极速
  defaultHyperlinkColor?: string // 默认超链接颜色。默认：#0000FF
  table?: ITableOption // 表格配置。{tdPadding?:IPadding; defaultTrMinHeight?:number; defaultColMinWidth?:number}
  header?: IHeader // 页眉信息。{top?:number; maxHeightRadio?:MaxHeightRatio;}
  footer?: IFooter // 页脚信息。{bottom?:number; maxHeightRadio?:MaxHeightRatio;}
  pageNumber?: IPageNumber // 页码信息。{bottom:number; size:number; font:string; color:string; rowFlex:RowFlex; format:string; numberType:NumberType;}
  paperDirection?: PaperDirection // 纸张方向：纵向、横向
  inactiveAlpha?: number // 正文内容失焦时透明度。默认值：0.6
  historyMaxRecordCount?: number // 历史（撤销重做）最大记录次数。默认：100次
  printPixelRatio?: number // 打印像素比率（值越大越清晰，但尺寸越大）。默认：3
  maskMargin?: IMargin // 编辑器上的遮盖边距（如悬浮到编辑器上的菜单栏、底部工具栏）。默认：[0, 0, 0, 0]
  letterClass?: string[] // 排版支持的字母类。默认：a-zA-Z。内置可选择的字母表类：LETTER_CLASS
  contextMenuDisableKeys?: string[] // 禁用的右键菜单。默认：[]
  scrollContainerSelector?: string // 滚动区域选择器。默认：document
  wordBreak?: WordBreak // 单词与标点断行：BREAK_WORD首行不出现标点&单词不拆分、BREAK_ALL按字符宽度撑满后折行。默认：BREAK_WORD
  watermark?: IWatermark // 水印信息。{data:string; color?:string; opacity?:number; size?:number; font?:string;}
  control?: IControlOption // 控件信息。 {placeholderColor?:string; bracketColor?:string; prefix?:string; postfix?:string; borderWidth?: number; borderColor?: string; activeBackgroundColor?: string;}
  checkbox?: ICheckboxOption // 复选框信息。{width?:number; height?:number; gap?:number; lineWidth?:number; fillStyle?:string; strokeStyle?: string; verticalAlign?: VerticalAlign;}
  radio?: IRadioOption // 单选框信息。{width?:number; height?:number; gap?:number; lineWidth?:number; fillStyle?:string; strokeStyle?: string; verticalAlign?: VerticalAlign;}
  cursor?: ICursorOption // 光标样式。{width?: number; color?: string; dragWidth?: number; dragColor?: string;}
  title?: ITitleOption // 标题配置。{ defaultFirstSize?: number; defaultSecondSize?: number; defaultThirdSize?: number defaultFourthSize?: number; defaultFifthSize?: number; defaultSixthSize?: number;}
  placeholder?: IPlaceholder // 编辑器空白占位文本
  group?: IGroup // 成组配置。{opacity?:number; backgroundColor?:string; activeOpacity?:number; activeBackgroundColor?:string; disabled?:boolean}
  pageBreak?: IPageBreak // 分页符配置。{font?:string; fontSize?:number; lineDash?:number[];}
  zone?: IZoneOption // 编辑器区域配置。{tipDisabled?:boolean;}
  background?: IBackgroundOption // 背景配置。{color?:string; image?:string; size?:BackgroundSize; repeat?:BackgroundRepeat; applyPageNumbers?:number[]}。默认：{color: '#FFFFFF'}
  lineBreak?: ILineBreakOption // 换行符配置。{disabled?:boolean; color?:string; lineWidth?:number;}
  separator?: ISeparatorOption // 分隔符配置。{lineWidth?:number; strokeStyle?:string;}
  lineNumber?: ILineNumberOption // 行号配置。{size?:number; font?:string; color?:string; disabled?:boolean; right?:number}
  pageBorder?: IPageBorderOption // 页面边框配置。{color?:string; lineWidth:number; padding?:IPadding; disabled?:boolean;}
  badge?: IBadgeOption // 徽章配置。{top?:number; left?:number}
}

// 数据结构
interface IWord {
    title: string; // 文档文件名
    payload: { // 内容
        header?: IElement[]; // 页眉
        main: IElement[]; // 正文
        footer?: IElement[]; // 页脚
    };
    options: IEditorOption; // 配置
}
```

### 示例数据

```typescript
const data: IWord = {
    title: "文档.docx",
    payload: {
        main: [
            {
                level: 'first',
                type: 'title',
                value: '',
                valueList: [
                    { value: '一级标题', size: 20 }
                ]
            },
            { value: '正文文本', size: 14 },
            { value: '\n', size: 14 },
        ]
    },
    options: {
        "mode": "edit",
        "defaultType": "TEXT",
        "defaultColor": "#000000",
        "defaultFont": "Microsoft YaHei",
        "defaultSize": 16,
        "minSize": 5,
        "maxSize": 72,
        "defaultRowMargin": 1,
        "defaultBasicRowMarginHeight": 8,
        "defaultTabWidth": 32,
        "width": 794,
        "height": 1123,
        "scale": 1,
        "pageGap": 20,
        "underlineColor": "#000000",
        "strikeoutColor": "#FF0000",
        "rangeAlpha": 0.6,
        "rangeColor": "#AECBFA",
        "rangeMinWidth": 5,
        "searchMatchAlpha": 0.6,
        "searchMatchColor": "#FFFF00",
        "searchNavigateMatchColor": "#AAD280",
        "highlightAlpha": 0.6,
        "resizerColor": "#4182D9",
        "resizerSize": 5,
        "marginIndicatorSize": 35,
        "marginIndicatorColor": "#BABABA",
        "margins": [
            100,
            120,
            100,
            120
        ],
        "pageMode": "paging",
        "renderMode": "speed",
        "defaultHyperlinkColor": "#0000FF",
        "paperDirection": "vertical",
        "inactiveAlpha": 0.6,
        "historyMaxRecordCount": 100,
        "wordBreak": "break-word",
        "printPixelRatio": 3,
        "maskMargin": [
            60,
            0,
            30,
            0
        ],
        "letterClass": [
            "A-Za-z"
        ],
        "contextMenuDisableKeys": [],
        "scrollContainerSelector": "",
        "watermark": {
            "data": "CANVAS-EDITOR",
            "color": "#AEB5C0",
            "opacity": 0.3,
            "size": 120,
            "font": "Microsoft YaHei",
            "repeat": false,
            "gap": [
            10,
            10
            ]
        },
        "pageNumber": {
            "bottom": 60,
            "size": 12,
            "font": "Microsoft YaHei",
            "color": "#000000",
            "rowFlex": "center",
            "format": "第{pageNo}页/共{pageCount}页",
            "numberType": "arabic",
            "disabled": false,
            "startPageNo": 1,
            "fromPageNo": 0,
            "maxPageNo": null
        },
        "placeholder": {
            "data": "请输入正文",
            "color": "#DCDFE6",
            "opacity": 1,
            "size": 16,
            "font": "Microsoft YaHei"
        },
        "zone": {
            "tipDisabled": false
        },
        "table": {
            "tdPadding": [
            0,
            5,
            5,
            5
            ],
            "defaultTrMinHeight": 42,
            "defaultColMinWidth": 40,
            "defaultBorderColor": "#000000"
        },
        "header": {
            "top": 30,
            "maxHeightRadio": "half",
            "disabled": false,
            "editable": true
        },
        "footer": {
            "bottom": 30,
            "maxHeightRadio": "half",
            "disabled": false,
            "editable": true
        },
        "control": {
            "placeholderColor": "#9c9b9b",
            "bracketColor": "#000000",
            "prefix": "{",
            "postfix": "}",
            "borderWidth": 1,
            "borderColor": "#000000",
            "activeBackgroundColor": ""
        },
        "checkbox": {
            "width": 14,
            "height": 14,
            "gap": 5,
            "lineWidth": 1,
            "fillStyle": "#5175f4",
            "strokeStyle": "#ffffff",
            "verticalAlign": "bottom"
        },
        "radio": {
            "width": 14,
            "height": 14,
            "gap": 5,
            "lineWidth": 1,
            "fillStyle": "#5175f4",
            "strokeStyle": "#000000",
            "verticalAlign": "bottom"
        },
        "cursor": {
            "width": 1,
            "color": "#000000",
            "dragWidth": 2,
            "dragColor": "#0000FF"
        },
        "title": {
            "defaultFirstSize": 26,
            "defaultSecondSize": 24,
            "defaultThirdSize": 22,
            "defaultFourthSize": 20,
            "defaultFifthSize": 18,
            "defaultSixthSize": 16
        },
        "group": {
            "opacity": 0.1,
            "backgroundColor": "#E99D00",
            "activeOpacity": 0.5,
            "activeBackgroundColor": "#E99D00",
            "disabled": false
        },
        "pageBreak": {
            "font": "Microsoft YaHei",
            "fontSize": 12,
            "lineDash": [
            3,
            1
            ]
        },
        "background": {
            "color": "#FFFFFF",
            "image": "",
            "size": "cover",
            "repeat": "no-repeat",
            "applyPageNumbers": []
        },
        "lineBreak": {
            "disabled": true,
            "color": "#CCCCCC",
            "lineWidth": 1.5
        },
        "separator": {
            "lineWidth": 1,
            "strokeStyle": "#000000"
        },
        "lineNumber": {
            "size": 12,
            "font": "Microsoft YaHei",
            "color": "#000000",
            "disabled": true,
            "right": 20,
            "type": "continuity"
        },
        "pageBorder": {
            "color": "#000000",
            "lineWidth": 1,
            "padding": [
            0,
            5,
            0,
            5
            ],
            "disabled": true
        },
        "badge": {
            "top": 0,
            "left": 5
        }
    }
}
```
