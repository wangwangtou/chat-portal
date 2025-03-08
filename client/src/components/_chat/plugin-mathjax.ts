import { tex } from "./plugin-tex";
import type MarkdownIt from "markdown-it";
import { AssistiveMmlHandler } from "mathjax-full/js/a11y/assistive-mml.js";
import type { LiteDocument } from "mathjax-full/js/adaptors/lite/Document.js";
import type {
  LiteElement,
  LiteNode,
} from "mathjax-full/js/adaptors/lite/Element.js";
import type { LiteText } from "mathjax-full/js/adaptors/lite/Text.js";
import type { LiteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import { liteAdaptor } from "mathjax-full/js/adaptors/liteAdaptor.js";
import type { MathDocument } from "mathjax-full/js/core/MathDocument.js";
import { RegisterHTMLHandler } from "mathjax-full/js/handlers/html.js";
import { AllPackages } from "mathjax-full/js/input/tex/AllPackages.js";
import { TeX } from "mathjax-full/js/input/tex.js";
import { mathjax as mathjaxLib } from "mathjax-full/js/mathjax.js";
import { CHTML } from "mathjax-full/js/output/chtml.js";
import { SVG } from "mathjax-full/js/output/svg.js";

import type { MarkdownItMathjaxOptions, TeXTransformer } from "@mdit/plugin-mathjax";

export interface DocumentOptions {
  InputJax: TeX<LiteElement, string, HTMLElement>;
  OutputJax:
    | CHTML<LiteElement, string, HTMLElement>
    | SVG<LiteElement, string, HTMLElement>;
  enableAssistiveMml: boolean;
}

export const getDocumentOptions = (
  options: MarkdownItMathjaxOptions,
): DocumentOptions => ({
  InputJax: new TeX<LiteElement, string, HTMLElement>({
    packages: AllPackages,
    ...options.tex,
  }),
  OutputJax: new SVG<LiteElement, string, HTMLElement>({
    fontCache: "none",
    ...options.svg,
  }),
  enableAssistiveMml: options.a11y !== false,
});

/**
 * Mathjax instance
 */
export interface MathjaxInstance
  extends Required<
    Pick<MarkdownItMathjaxOptions, "allowInlineWithSpace" | "mathFence">
  > {
  /**
   * Mathjax adaptor
   */
  adaptor: LiteAdaptor;

  /**
   * Mathjax document options
   */
  documentOptions: DocumentOptions;

  /**
   * Clear style cache
   */
  clearStyle: () => void;

  /**
   * Output style for rendered content and clears it
   *
   * @returns style
   */
  outputStyle: () => string;

  /**
   * Reset tex (including labels)
   */
  reset: () => void;

  /**
   * Output content transformer
   */
  transformer: TeXTransformer | null;
}

export const createMathjaxInstance = (
  options: MarkdownItMathjaxOptions = {},
): MathjaxInstance | null => {
  const documentOptions = getDocumentOptions(options);

  const { OutputJax, InputJax } = documentOptions;

  const adaptor = liteAdaptor();
  const handler = RegisterHTMLHandler(adaptor);

  if (options.a11y !== false)
    AssistiveMmlHandler<LiteNode, LiteText, LiteDocument>(handler);

  const clearStyle = (): void => {
    // clear style cache
    if (OutputJax instanceof CHTML) OutputJax.clearCache();
  };

  const reset = (): void => {
    InputJax.reset();
  };

  const outputStyle = (): string => {
    const style = adaptor.innerHTML(
      OutputJax.styleSheet(
        mathjaxLib.document("", documentOptions) as MathDocument<
          LiteElement,
          string,
          HTMLElement
        >,
      ),
    );

    clearStyle();

    return style;
  };

  return {
    adaptor,
    documentOptions,
    allowInlineWithSpace: options.allowInlineWithSpace ?? false,
    mathFence: options.mathFence ?? false,
    clearStyle,
    reset,
    outputStyle,
    transformer: options.transformer ?? null,
  };
};

export const mathjax = (
  md: MarkdownIt,
  {
    allowInlineWithSpace,
    adaptor,
    documentOptions,
    mathFence,
    transformer,
  }: MathjaxInstance,
): void => {
  md.use(tex, {
    allowInlineWithSpace,
    mathFence,
    render: (content, displayMode) => {
      const mathDocument = mathjaxLib
        .document(content, documentOptions)
        .convert(content, { display: displayMode }) as LiteElement;

      const result = adaptor.outerHTML(mathDocument);

      return transformer?.(result, displayMode) ?? result;
    },
  });
};

// const adaptor = liteAdaptor();
// const handler = RegisterHTMLHandler(adaptor);
// console.log(adaptor.outerHTML(mathjaxLib.document("a=1", getDocumentOptions({})).convert("a=1", { display: true })));
