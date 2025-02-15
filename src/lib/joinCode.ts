import { randomInt } from "crypto";

const ALLOWED_CHARACTERS: string =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH: number = 6;

export function generate_join_code(): string {
  let output = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    output += ALLOWED_CHARACTERS[randomInt(0, ALLOWED_CHARACTERS.length)];
  }
  return output;
}
