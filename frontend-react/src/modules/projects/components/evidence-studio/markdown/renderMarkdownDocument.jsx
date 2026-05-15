import { Fragment, useMemo } from "react";
import { sanitizeText } from "./sanitizeText.js";
import { parseMarkdownBlocks } from "./parseMarkdownBlocks.js";
import { isAllowedEvidenceUrl } from "./urlPolicy.js";
import prevStyles from "../EvidencePreviewPane.module.css";
import { MarkdownInlineImage } from "./MarkdownInlineImage.jsx";

/**
 * @param {string} text
 * @param {(idx: number) => string} keyPrefix
 */
function renderInlineNodes(text, keyPrefix) {
  const s = text == null ? "" : String(text);
  const nodes = [];
  let i = 0;
  let k = 0;

  while (i < s.length) {
    const slice = s.slice(i);

    const imgM = slice.match(/^!\[([^\]]*)\]\(([^)]+)\)/);
    if (imgM) {
      const alt = imgM[1];
      const url = imgM[2].trim();
      const ok = isAllowedEvidenceUrl(url);
      const key = keyPrefix(k++);
      if (ok) {
        nodes.push(<MarkdownInlineImage key={key} url={url} alt={alt} />);
      } else {
        nodes.push(
          <span key={key} className={prevStyles.imagePlaceholder} role="img" aria-label={alt || "Imagen no permitida"}>
            {sanitizeText(alt || "URL no permitida")}
          </span>,
        );
      }
      i += imgM[0].length;
      continue;
    }

    const linkM = slice.match(/^\[([^\]]*)\]\(([^)]+)\)/);
    if (linkM) {
      const label = linkM[1];
      const url = linkM[2].trim();
      const key = keyPrefix(k++);
      if (isAllowedEvidenceUrl(url)) {
        nodes.push(
          <a key={key} href={url} target="_blank" rel="noopener noreferrer" className={prevStyles.docLink}>
            {label || url}
          </a>,
        );
      } else {
        nodes.push(<span key={key}>{sanitizeText(label || url)}</span>);
      }
      i += linkM[0].length;
      continue;
    }

    const boldM = slice.match(/^\*\*([^*]+)\*\*/);
    if (boldM) {
      const key = keyPrefix(k++);
      nodes.push(
        <strong key={key} className={prevStyles.inlineStrong}>
          {sanitizeText(boldM[1])}
        </strong>,
      );
      i += boldM[0].length;
      continue;
    }

    const italicM = slice.match(/^\*([^*]+)\*/);
    if (italicM) {
      const key = keyPrefix(k++);
      nodes.push(
        <em key={key} className={prevStyles.inlineEm}>
          {sanitizeText(italicM[1])}
        </em>,
      );
      i += italicM[0].length;
      continue;
    }

    const nextSpecial = (() => {
      const a = s.indexOf("![", i);
      const b = s.indexOf("[", i);
      const c = s.indexOf("*", i);
      const cands = [a, b, c].filter((x) => x >= i);
      return cands.length ? Math.min(...cands) : -1;
    })();

    if (nextSpecial < 0 || nextSpecial > i) {
      const end = nextSpecial < 0 ? s.length : nextSpecial;
      const plain = s.slice(i, end);
      if (plain) {
        nodes.push(<Fragment key={keyPrefix(k++)}>{sanitizeText(plain)}</Fragment>);
      }
      i = end;
    } else {
      nodes.push(<Fragment key={keyPrefix(k++)}>{sanitizeText(s[i])}</Fragment>);
      i += 1;
    }
  }

  return nodes;
}

function blockKey(base, idx) {
  return `${base}-b-${idx}`;
}

/**
 * @param {object} props
 * @param {string} props.value
 * @param {string} [props.idPrefix]
 * @param {boolean} [props.emphasizeHeadingHierarchy] — estilos de sección (evidencia proyecto agregada)
 */
export function MarkdownDocument({ value, idPrefix = "ev-prev", emphasizeHeadingHierarchy = false }) {
  const parsed = useMemo(() => {
    try {
      return { ok: true, blocks: parseMarkdownBlocks(value) };
    } catch {
      return { ok: false, blocks: [] };
    }
  }, [value]);

  if (!parsed.ok) {
    return (
      <div className={prevStyles.previewError}>
        <p className={prevStyles.previewErrorTitle}>No se pudo renderizar la vista previa</p>
        <pre className={prevStyles.previewErrorFallback}>{sanitizeText(value)}</pre>
      </div>
    );
  }

  const { blocks } = parsed;
  if (!blocks.length) return null;

  const rootClass = [prevStyles.docRoot, emphasizeHeadingHierarchy ? prevStyles.docRootEvidenceHierarchy : ""]
    .filter(Boolean)
    .join(" ");

  let hierarchyDepth = 0;

  return (
    <div className={rootClass}>
      {blocks.map((b, idx) => {
        const key = blockKey(idPrefix, idx);
        if (b.type === "h1") {
          hierarchyDepth = 1;
          return (
            <h2 key={key} className={prevStyles.docH1}>
              {renderInlineNodes(b.text, (n) => `${key}-i-${n}`)}
            </h2>
          );
        }
        if (b.type === "h2") {
          hierarchyDepth = 2;
          return (
            <h3 key={key} className={prevStyles.docH2}>
              {renderInlineNodes(b.text, (n) => `${key}-i-${n}`)}
            </h3>
          );
        }
        if (b.type === "hr") {
          hierarchyDepth = 0;
          return <hr key={key} className={prevStyles.docHr} />;
        }

        const storyNested = Boolean(emphasizeHeadingHierarchy && hierarchyDepth >= 2);
        const nestClass = storyNested ? prevStyles.docBlockStoryNested : "";

        if (b.type === "code") {
          return (
            <pre key={key} className={[prevStyles.docPre, nestClass].filter(Boolean).join(" ")}>
              <code>{sanitizeText(b.body)}</code>
            </pre>
          );
        }
        if (b.type === "blockquote") {
          return (
            <blockquote key={key} className={[prevStyles.docBlockquote, nestClass].filter(Boolean).join(" ")}>
              {b.lines.map((ln, j) => (
                <p key={`${key}-q-${j}`} className={prevStyles.docQuoteP}>
                  {renderInlineNodes(ln, (n) => `${key}-iq-${j}-${n}`)}
                </p>
              ))}
            </blockquote>
          );
        }
        if (b.type === "ul") {
          return (
            <ul key={key} className={[prevStyles.docUl, nestClass].filter(Boolean).join(" ")}>
              {b.items.map((it, j) => (
                <li key={`${key}-li-${j}`}>{renderInlineNodes(it, (n) => `${key}-i-${j}-${n}`)}</li>
              ))}
            </ul>
          );
        }
        if (b.type === "ol") {
          return (
            <ol key={key} className={[prevStyles.docOl, nestClass].filter(Boolean).join(" ")}>
              {b.items.map((it, j) => (
                <li key={`${key}-li-${j}`}>{renderInlineNodes(it, (n) => `${key}-i-${j}-${n}`)}</li>
              ))}
            </ol>
          );
        }
        if (b.type === "checklist") {
          return (
            <ul key={key} className={[prevStyles.docChecklist, nestClass].filter(Boolean).join(" ")}>
              {b.items.map((it, j) => (
                <li key={`${key}-chk-${j}`}>
                  <span className={prevStyles.checkMark} aria-hidden>
                    {it.checked ? "☑" : "☐"}
                  </span>
                  {renderInlineNodes(it.text, (n) => `${key}-i-${j}-${n}`)}
                </li>
              ))}
            </ul>
          );
        }
        if (b.type === "p") {
          return (
            <p key={key} className={[prevStyles.docP, nestClass].filter(Boolean).join(" ")}>
              {renderInlineNodes(b.text, (n) => `${key}-i-${n}`)}
            </p>
          );
        }
        return null;
      })}
    </div>
  );
}
