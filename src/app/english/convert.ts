"use server";

import { convert } from "@/utils/convert_eng";

export async function convertEngToHang(text: string) {
  return convert(text);
}
