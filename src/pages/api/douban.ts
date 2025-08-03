import type { APIRoute } from 'astro';
import Parser from 'rss-parser';
import YukinaConfig from '../../../yukina.config';
import { ImageDownloader } from '../../utils/imageDownloader';

type FeedItem = {
  title: string;
  link: string;
  pubDate: string;
  content?: string;
};

type DoubanItem = {
  title: string;
  link: string;
  rating: string;
  poster: string;
  pubDate: string;
  status: '在看' | '看过' | '想看' | '在玩' | '玩过' | '想玩' | '在读' | '读过' | '想读';
  type: 'movie' | 'book' | 'game';
  category?: string;
  releaseDate?: string;
  comment?: string;
};

const parser = new Parser<{}, FeedItem>();
const imageDownloader = new ImageDownloader();

export const GET: APIRoute = async () => {
  try {
    // 从配置文件中获取豆瓣用户ID
    const doubanUserId = YukinaConfig.douban.userId;
    const feed = await parser.parseURL(`https://www.douban.com/feed/people/${doubanUserId}/interests`);
    
    if (!feed.items || feed.items.length === 0) {
      return new Response(JSON.stringify({ error: 'No entries found' }), { status: 404 });
    }

    const items: DoubanItem[] = [];
    
    // 处理前20个条目
    for (const item of feed.items.slice(0, 20)) {
      const processedItem = await processDoubanItem(item);
      if (processedItem) {
        items.push(processedItem);
      }
    }
    
    // 按类型和状态分组
    const groupedData = {
      movies: {
        watching: items.filter(item => item.type === 'movie' && item.status === '在看'),
        watched: items.filter(item => item.type === 'movie' && item.status === '看过'),
        wantToWatch: items.filter(item => item.type === 'movie' && item.status === '想看')
      },
      books: {
        reading: items.filter(item => item.type === 'book' && item.status === '在读'),
        read: items.filter(item => item.type === 'book' && item.status === '读过'),
        wantToRead: items.filter(item => item.type === 'book' && item.status === '想读')
      },
      games: {
        playing: items.filter(item => item.type === 'game' && item.status === '在玩'),
        played: items.filter(item => item.type === 'game' && item.status === '玩过'),
        wantToPlay: items.filter(item => item.type === 'game' && item.status === '想玩')
      }
    };

    return new Response(JSON.stringify(groupedData), { status: 200 });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Failed to fetch data' }), { status: 500 });
  }
};

async function processDoubanItem(item: FeedItem): Promise<DoubanItem | null> {
  try {
    const title = item.title || '';
    
    // 判断类型和状态
    let type: 'movie' | 'book' | 'game';
    let status: DoubanItem['status'];
    
    if (title.includes('在看') || title.includes('看过') || title.includes('想看')) {
      type = 'movie';
      if (title.includes('在看')) status = '在看';
      else if (title.includes('看过')) status = '看过';
      else status = '想看';
    } else if (title.includes('在读') || title.includes('读过') || title.includes('想读')) {
      type = 'book';
      if (title.includes('在读')) status = '在读';
      else if (title.includes('读过')) status = '读过';
      else status = '想读';
    } else if (title.includes('在玩') || title.includes('玩过') || title.includes('想玩')) {
      type = 'game';
      if (title.includes('在玩')) status = '在玩';
      else if (title.includes('玩过')) status = '玩过';
      else status = '想玩';
    } else {
      return null;
    }

    // 提取内容信息
    const content = item.content || '';
    const doc = content;
    
    // 提取评分
    const ratingMatch = doc.match(/推荐: ([^<\n]+)/);
    const rating = ratingMatch ? ratingMatch[1].trim() : '暂无评分';
    
    // 提取海报链接
    const posterMatch = doc.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/);
    let poster = posterMatch ? posterMatch[1] : '';
    
    // 下载并保存海报到本地
    if (poster) {
      const cleanTitle = title.replace(/[在看过想读玩]/g, '').trim();
      const downloadResult = await imageDownloader.downloadImage(poster, cleanTitle);
      if (downloadResult.success && downloadResult.localPath) {
        poster = downloadResult.localPath;
      }
    }
    
    // 提取评论
    const commentMatch = doc.match(/推荐: [^<\n]+[\s\S]*?([^<\n]+)$/);
    const comment = commentMatch ? commentMatch[1].trim() : '';
    
    // 清理标题
    const cleanTitle = title.replace(/^(在看|看过|想看|在读|读过|想读|在玩|玩过|想玩)/, '').trim();
    
    return {
      title: cleanTitle,
      link: item.link || '',
      rating,
      poster,
      pubDate: item.pubDate || '',
      status,
      type,
      comment
    };
  } catch (error) {
    console.error('Error processing item:', error);
    return null;
  }
}