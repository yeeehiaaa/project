"use client";

import { useState } from "react";

/**
 * Logo officiel DOCTORZ Co. avec bascule selon le thème :
 * - thème blanc  -> logo fond bleu  (/logo-doctorz-blue-bg.png)
 * - thème saphir -> logo fond blanc (/logo-doctorz-white-bg.png)
 * Placez les deux fichiers PNG dans le dossier `public/`.
 * Repli automatique (tuile "D") si un fichier est absent.
 */
export default function DoctorzBrand({
  isDark,
  size = 40,
  showName = true,
  compact = false,
}: {
  isDark: boolean;
  size?: number;
  showName?: boolean;
  compact?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const src = isDark
    ? "/logo-doctorz-white-bg.png"
    : "/logo-doctorz-blue-bg.png";

  return (
    <span className="flex items-center gap-2.5 shrink-0">
      {failed ? (
        <span
          className="flex items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-700 via-blue-600 to-sky-500 text-white shadow-md shadow-blue-600/25 border border-white/10 font-extrabold"
          style={{ width: size, height: size, fontSize: size * 0.42 }}
        >
          D
        </span>
      ) : (
        <img
          src={src}
          alt="DOCTORZ Co."
          width={size}
          height={size}
          onError={() => setFailed(true)}
          className="rounded-2xl object-cover shadow-md shadow-blue-600/25 border border-white/10"
          style={{ width: size, height: size }}
        />
      )}
      {showName && !compact && (
        <span className="flex items-center gap-2">
          <span
            className={`text-base font-bold tracking-tight ${
              isDark ? "text-white" : "text-slate-900"
            }`}
          >
            DOCTORZ Co.
          </span>
          <span
            className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md border ${
              isDark
                ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
          >
            DZ
          </span>
        </span>
      )}
    </span>
  );
}
