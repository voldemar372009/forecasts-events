"use client";

/** Картинка с автозаменой при ошибке загрузки (fallback или скрытие). */
export default function FogImage({
  src,
  fallback,
  alt = "",
  className = "",
}: {
  src: string;
  fallback?: string;
  alt?: string;
  className?: string;
}) {
  return (
    <img
      src={src}
      alt={alt}
      aria-hidden={alt === ""}
      onError={(e) => {
        e.currentTarget.onerror = null;
        if (fallback) e.currentTarget.src = fallback;
        else e.currentTarget.style.opacity = "0";
      }}
      className={className}
    />
  );
}
