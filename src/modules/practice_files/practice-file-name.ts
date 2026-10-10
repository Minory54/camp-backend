// Practice files share one directory. Reject paths and names that resolve to it.
export const FLAT_PRACTICE_FILENAME_PATTERN =
  "^(?!\\s*\\.{1,2}\\s*$)(?=[\\s\\S]*\\S)[^/\\\\\\u0000-\\u001F\\u007F]+(?![\\s\\S])";

const flatFilename = new RegExp(FLAT_PRACTICE_FILENAME_PATTERN);

export function isFlatPracticeFilename(filename: string): boolean {
  return flatFilename.test(filename);
}
