/**
 * Message moderation: keeps deals on-platform and blocks abusive content.
 * Applied server-side before a message is persisted.
 */

const EMAIL = /[\w.+-]+\s?(?:@|\(at\)|\[at\]|\sat\s)\s?[\w-]+(?:\s?(?:\.|\(dot\)|\sdot\s)\s?[\w-]+)+/gi;
const URL = /\b(?:https?:\/\/|www\.)\S+/gi;
// 7+ digits, tolerating spaces, dots, dashes, parens and spelled separators.
const PHONE = /(?:\+?\d[\d\s().-]{6,}\d)/g;
const HANDLE = /(?:^|\s)@[A-Za-z0-9_.]{3,}/g;
const MESSENGERS = /\b(whats\s?app|telegram|signal|viber|wechat|imessage|venmo|zelle|cash\s?app|paypal)\b/gi;

const REDACTION = "[hidden — keep chat on DockFront]";

export type ModerationResult = {
  body: string;
  redacted: boolean;
  reasons: string[];
};

export function moderateMessage(input: string): ModerationResult {
  const reasons: string[] = [];
  let body = input;

  const apply = (re: RegExp, reason: string) => {
    if (re.test(body)) {
      reasons.push(reason);
      body = body.replace(re, ` ${REDACTION} `);
    }
    re.lastIndex = 0;
  };

  apply(EMAIL, "email address");
  apply(URL, "external link");
  apply(PHONE, "phone number");
  apply(HANDLE, "social handle");
  apply(MESSENGERS, "off-platform payment or messaging app");

  body = body.replace(/\s{2,}/g, " ").trim();
  return { body, redacted: reasons.length > 0, reasons };
}
