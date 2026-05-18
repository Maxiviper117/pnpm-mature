export function sanitizeTerminalText(value: string): string {
  return value.replace(ANSI_ESCAPE_PATTERN, "");
}

// Matches ANSI/CSI escape sequences so untrusted registry or manifest values cannot control the terminal.
const ANSI_ESCAPE_PATTERN = new RegExp(
  String.raw`[\x1B\x9B][[\]()#;?]*(?:(?:(?:\d{1,4};?)*\d{0,4})?[0-9A-ORZcf-nqry=><~]|\d*(?:;\d*)*[A-Za-z])`,
  "g",
);
