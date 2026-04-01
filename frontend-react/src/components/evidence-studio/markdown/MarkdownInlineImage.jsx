import { useState } from "react";
import { sanitizeText } from "./sanitizeText.js";
import prevStyles from "../EvidencePreviewPane.module.css";

export function MarkdownInlineImage({ url, alt }) {
  const [loadFailed, setLoadFailed] = useState(false);
  if (loadFailed) {
    return (
      <span className={prevStyles.imagePlaceholder} role="img" aria-label={alt || "Imagen no disponible"}>
        {sanitizeText(alt || "No se pudo cargar la imagen")}
      </span>
    );
  }
  return (
    <span className={prevStyles.imageCard}>
      <img
        className={prevStyles.imageEl}
        src={url}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setLoadFailed(true)}
      />
      <span className={prevStyles.imageCaption}>{alt || "Imagen"}</span>
    </span>
  );
}
