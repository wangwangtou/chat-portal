import Markdown from "markdown-it";
import highlight from "highlight.js";
import hljs from 'highlight.js/lib/common';
import { createMathjaxInstance, mathjax } from "./plugin-mathjax";
const mathjaxInstance = createMathjaxInstance({
  a11y: false,
});

const mdOptions: Markdown.Options = {
  linkify: true,
  typographer: true,
  breaks: true,
  langPrefix: "language-",
  // 代码高亮
  highlight(str: string, lang: string) {
    if (lang && highlight.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs"><code>' +
          hljs.highlight(str, {language: lang}).value +
          // highlight.highlight(lang, str, true).value +
          "</code></pre>"
        );
      } catch (__) {}
    }
    return "";
  },
};


export const md = new Markdown(mdOptions);
md.use(mathjax, mathjaxInstance);
