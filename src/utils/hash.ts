import YukinaConfig from "../../yukina.config";
import CryptoJS from "crypto-js";
import { pinyin } from "pinyin-pro";


function convertToPinyinSlug(text: string): string {
  // 使用pinyin-pro转换为拼音，不带音调
  const pinyinResult = pinyin(text, { 
    toneType: "none", 
    type: "array" 
  });
  
  // 将拼音数组用连字符连接，并转换为小写
  return pinyinResult
    .join("-")
    .toLowerCase()
    // 移除非字母数字和连字符的字符
    .replace(/[^a-z0-9\-]/g, "")
    // 移除多余的连字符
    .replace(/-+/g, "-")
    // 移除开头和结尾的连字符
    .replace(/^-+|-+$/g, "");
}
/**
 * Converts a given slug to a hashed slug or returns the raw slug based on the configuration.
 *
 * @param slug - The input slug to be converted.
 * @returns The hashed slug if the configuration mode is "HASH", otherwise the raw slug.
 */
export function IdToSlug(slug: string): string {
  switch (YukinaConfig.slugMode) {
    case "HASH": {
      const hash = CryptoJS.SHA256(slug);
      const hasedSlug = hash.toString(CryptoJS.enc.Hex).slice(0, 8);
      return hasedSlug;
    }
    case "RAW":
      return slug;
    case "PINYIN": {
      // 新增拼音模式
      return convertToPinyinSlug(slug);
    }
    default:
      return slug;
  }
}

/**
 * Computes an index from a given slug ID string using a custom hash algorithm.
 *
 * Each character's ASCII code is multiplied by 31 raised to a decreasing power, and the sum is then reduced
 * by the length of the list. The returned index is guaranteed to be in the range [0, listLength - 1].
 *
 * @param id - The slug ID string to hash.
 * @param listLength - The length of the list for which the index is computed.
 * @returns A zero-based index within the list.
 */
export function GetIndexFromSlugID(id: string, listLength: number): number {
  // Convert the string to a number
  let hashValue = 0;
  for (let i = 0; i < id.length; i++) {
    hashValue += id.charCodeAt(i) * 31 ** (id.length - 1 - i);
  }

  // Modulo the list length to get the index
  const index = hashValue % listLength;
  return index;
}
