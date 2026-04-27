/**
 * Play studio — brief moderation.
 *
 * Lightweight keyword guard for the user-supplied brief. The goal is
 * NOT to be a full safety system — that's the upstream model's job
 * (Replicate / OpenAI both refuse outright NSFW). The goal here is to:
 *
 *   • Refuse obvious abuse (NSFW, minor-coded language, slurs) before
 *     we burn AI credits on a doomed call.
 *   • Surface a friendly, localised reason in the UI so the user
 *     knows *why* it was rejected — better than a generic 500 from
 *     the upstream provider.
 *
 * The implementation is a flat list of word patterns matched
 * case-insensitively on the sanitised brief. We use `\b…\b` boundaries
 * so "scared" doesn't trip a "scar" rule etc.
 *
 * Maintenance:
 *   • Extend the per-category arrays below as edge cases appear.
 *   • Don't try to handle Unicode-confusable evasion here — that's a
 *     never-ending arms race. The upstream model and Caelinus
 *     reporting flow are the real safety net.
 */

export type ModerationReason = "nsfw" | "minor" | "hate";

export type ModerationResult =
  | { ok: true }
  | { ok: false; reason: ModerationReason };

// ── Word lists ────────────────────────────────────────────────
// Tone:
//   - NSFW: explicit sexual acts, body parts in explicit context.
//     We don't block "naked" alone (could be metaphorical) but we do
//     block the unambiguous explicit terms.
//   - MINOR: anything that combines a child reference with a person
//     descriptor. We block the bare child terms outright — there is
//     no legitimate use of "child" in a fashion-portrait brief.
//   - HATE: a small core list of slurs. Kept short on purpose; we
//     rely on the upstream model + the report flow for the long tail.

const NSFW_PATTERNS: RegExp[] = [
  /\bnsfw\b/i,
  /\bporn\w*/i,
  /\bxxx\b/i,
  /\bsex(?:ual|y)?\b/i,
  /\bnude(?:s|d)?\b/i,
  /\bnaked\s+(?:body|breasts?|chest|woman|girl|man)\b/i,
  /\bgenital\w*/i,
  /\bvagina\w*/i,
  /\bpenis\w*/i,
  /\bnipple\w*/i,
  /\borgasm\w*/i,
  /\b(?:hand|blow|foot|rim)\s*job\b/i,
  /\bcum\w*/i,
  /\bfuck\w*/i,
  /\bbukkake\b/i,
  /\bhentai\b/i,
  // TR
  /\bpornografi\w*/i,
  /\bçıplak\b/i,
  /\bsiki[sş]\w*/i,
  /\bmemeler\b/i,
  /\borospu\w*/i,
];

const MINOR_PATTERNS: RegExp[] = [
  /\bchild(?:ren)?\b/i,
  /\bkid(?:s|do)?\b/i,
  /\binfant\w*/i,
  /\btoddler\w*/i,
  /\bbaby\b/i,
  /\bunderage\b/i,
  /\bteen(?:ager|aged)?\b/i,
  /\bminor\s+(?:girl|boy|woman|man)\b/i,
  /\bschool\s*girl\b/i,
  /\bschool\s*boy\b/i,
  /\bloli\w*/i,
  /\bshota\w*/i,
  // TR
  /\bçocuk\w*/i,
  /\bbebek\w*/i,
  /\bergen\w*/i,
];

const HATE_PATTERNS: RegExp[] = [
  // Core slurs only. Kept abbreviated by category to avoid printing
  // lists of slurs in source files; expand defensively.
  /\bn[i1]gg(?:er|a)\w*/i,
  /\bf[a4]gg(?:ot|s)?\b/i,
  /\bk[i1]ke\b/i,
  /\btr[a4]nn[iy]\w*/i,
  /\bret[a4]rd\w*/i,
  /\bch[i1]nk\b/i,
  /\bsp[i1]c\b/i,
  // TR
  /\bibne\w*/i,
];

/**
 * Run all moderation rules in order of specificity. Minor patterns
 * win over NSFW (a brief with "child sex" is reported as `minor`
 * because that's the more serious category for the audit trail).
 */
export function checkBrief(text: string): ModerationResult {
  if (!text) return { ok: true };

  for (const r of MINOR_PATTERNS) {
    if (r.test(text)) return { ok: false, reason: "minor" };
  }
  for (const r of HATE_PATTERNS) {
    if (r.test(text)) return { ok: false, reason: "hate" };
  }
  for (const r of NSFW_PATTERNS) {
    if (r.test(text)) return { ok: false, reason: "nsfw" };
  }
  return { ok: true };
}

/**
 * User-facing reason copy. Short on detail by design — we don't want
 * to teach evasion patterns by being explicit about which token tripped.
 */
export function moderationMessage(
  reason: ModerationReason,
  lang: "tr" | "en" = "en",
): string {
  if (lang === "tr") {
    switch (reason) {
      case "nsfw":
        return "Briefin Caelinus topluluk kurallarına uymuyor. Daha hafif bir tarif dener misin?";
      case "minor":
        return "Briefte küçük yaş referansı kullanılamaz. Lütfen yetişkin tasvirine geç.";
      case "hate":
        return "Briefin nefret söylemi içeriyor görünüyor. Lütfen tekrar düzenle.";
    }
  }
  switch (reason) {
    case "nsfw":
      return "Your brief doesn't fit Caelinus' community guidelines. Try a softer description.";
    case "minor":
      return "Briefs cannot reference minors. Please describe an adult subject.";
    case "hate":
      return "Your brief looks like it contains hateful language. Please rewrite.";
  }
}
