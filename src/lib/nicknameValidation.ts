const NG_PATTERNS: RegExp[] = [
  /fuck|shit|dick|cock|pussy|ass(?:hole)?|bitch|cunt|nigger|faggot/i,
  /セックス|ちんこ|まんこ|おっぱい|ちんぽ|性器|レイプ|強姦|売春|淫乱/,
  /殺す|死ね|殺せ|爆破|テロ|ナチス/,
  /^[!-/:-@[-`{-~\s]+$/,
];

/** OKならnull、NGならエラーメッセージを返す */
export function validateNickname(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return null;
  for (const p of NG_PATTERNS) {
    if (p.test(trimmed)) return "その名前は使用できません";
  }
  return null;
}
