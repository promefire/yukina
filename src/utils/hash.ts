import YukinaConfig from "../../yukina.config";
import CryptoJS from "crypto-js";
import { pinyin } from "pinyin-pro";


function convertToPinyinSlug(text: string): string {
  // 将文本按中文和非中文字符分组处理
  const segments: string[] = [];
  let currentSegment = "";
  let isChineseSegment = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const isChinese = /[\u4e00-\u9fff]/.test(char);
    
    if (i === 0) {
      // 第一个字符，初始化状态
      currentSegment = char;
      isChineseSegment = isChinese;
    } else if (isChinese === isChineseSegment) {
      // 同类型字符，继续添加到当前段
      currentSegment += char;
    } else {
      // 不同类型字符，保存当前段并开始新段
      segments.push(currentSegment);
      currentSegment = char;
      isChineseSegment = isChinese;
    }
  }
  
  // 添加最后一段
  if (currentSegment) {
    segments.push(currentSegment);
  }
  
  // 处理每个段
  const processedSegments = segments.map(segment => {
    const isChinese = /[\u4e00-\u9fff]/.test(segment[0]);
    
    if (isChinese) {
      // 中文段：转换为拼音
      const pinyinResult = pinyin(segment, { 
        toneType: "none", 
        type: "array" 
      });
      return pinyinResult.join("-");
    } else {
      // 非中文段：保持原样，但清理特殊字符
      return segment
        .toLowerCase()
        // 保留字母数字和连字符，将其他字符替换为连字符
        .replace(/[^a-z0-9\-]/g, "-")
        // 移除多余的连字符
        .replace(/-+/g, "-")
        // 移除开头和结尾的连字符
        .replace(/^-+|-+$/g, "");
    }
  });
  
  // 用连字符连接所有段
  return processedSegments
    .filter(segment => segment.length > 0) // 过滤空段
    .join("-")
    // 最终清理：移除多余的连字符
    .replace(/-+/g, "-")
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
