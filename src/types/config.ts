import type I18nKeys from "../locales/keys";

interface Configuration {
  title: string;
  subTitle: string;
  brandTitle: string;

  description: string;

  site: string;

  locale: "en" | "zh-CN";

  navigators: { nameKey: I18nKeys; href: string }[];

  username: string;
  sign: string;
  avatarUrl: string;

  socialLinks: { icon: string; link: string }[];

  maxSidebarCategoryChip: number;
  maxSidebarTagChip: number;
  maxFooterCategoryChip: number;
  maxFooterTagChip: number;

  banners: string[];

  slugMode: "HASH" | "RAW" | "PINYIN";

  license: {
    name: string;
    url: string;
  };

  bannerStyle: "LOOP";

  // Giscus评论系统配置
  giscus: {
    enable: boolean; // 新增：评论系统开关
    repo: string;
    repoId: string;
    category: string;
    categoryId: string;
    mapping: "url" | "title" | "og:title" | "specific" | "number" | "pathname";
    strict: "0" | "1";
    reactionsEnabled: "0" | "1";
    emitMetadata: "0" | "1";
    inputPosition: "top" | "bottom";
    lang: string;
    loading: "lazy" | "eager";
  };
}

export type { Configuration };
