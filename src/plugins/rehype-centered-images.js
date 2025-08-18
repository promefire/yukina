import { visit } from 'unist-util-visit';
import { h } from 'hastscript';

/**
 * @typedef {import('hast').Root} Root
 */

// 默认配置选项
const defaultOptions = {
  // 图片样式配置
  imageWidth: '90%',
  imageMaxWidth: '1200px',
  imageMarginBottom: '10px',
  
  // 图注样式配置
  captionFontSize: '0.9em',
  captionColor: '#666',
  captionFontFamily: 'sans-serif',
  
  // 容器样式配置
  containerTextAlign: 'center',
  
  // 是否启用插件
  enabled: true,
};

/**
 * 一个 rehype 插件，用于将 <img> 转换为带有居中样式和图注的 HTML 结构
 * @param {Partial<defaultOptions>} userOptions 用户的自定义配置
 */
export default function rehypeCenteredImages(userOptions = {}) {
  const options = { ...defaultOptions, ...userOptions };
  
  // 如果插件被禁用，直接返回空函数
  if (!options.enabled) {
    return function () {};
  }

  /**
   * @param {Root} tree
   */
  return function (tree) {
    visit(tree, 'element', (node, index, parent) => {
      // 检查当前节点是否是位于段落 <p> 中的唯一子元素的 <img>
      if (
        parent &&
        parent.type === 'element' &&
        parent.tagName === 'p' &&
        node.tagName === 'img' &&
        parent.children.length === 1
      ) {
        const alt = node.properties.alt || '';
        const src = node.properties.src;
        const title = node.properties.title || '';

        // 1. 创建带有内联样式的 <img> 节点
        const imageNode = h('img', {
          src,
          alt,
          title: title || null,
          style: `
            width: ${options.imageWidth};
            max-width: ${options.imageMaxWidth};
            height: auto;
            display: block;
            margin: 0 auto ${options.imageMarginBottom};
            object-fit: cover;
          `.replace(/\s+/g, ' ').trim()
        });

        // 2. 创建带有内联样式的图注 <p> 节点 (仅当 alt 存在时)
        const captionNode = alt
          ? h('p', {
              style: `
                font-size: ${options.captionFontSize};
                color: ${options.captionColor};
                margin-top: 0;
                font-family: ${options.captionFontFamily};
              `.replace(/\s+/g, ' ').trim()
            }, alt)
          : null;

        // 3. 创建带有内联样式的容器 <div> 节点
        const containerNode = h(
          'div',
          {
            style: `text-align: ${options.containerTextAlign};`
          },
          [imageNode, captionNode].filter(Boolean) // 过滤掉空的 captionNode
        );

        // 4. 用新的容器节点替换掉原来的 <p> 节点
        parent.children[index] = containerNode;
      }
    });
  };
}

/**
 * 预设配置：用户要求的样式
 */
export const presetUserStyle = {
  imageWidth: '90%',
  imageMaxWidth: '1200px',
  imageMarginBottom: '10px',
  captionFontSize: '0.9em',
  captionColor: '#666',
  captionFontFamily: 'sans-serif',
  containerTextAlign: 'center',
  enabled: true,
};

/**
 * 预设配置：简洁样式
 */
export const presetMinimal = {
  imageWidth: '100%',
  imageMaxWidth: '800px',
  imageMarginBottom: '8px',
  captionFontSize: '0.85em',
  captionColor: '#888',
  captionFontFamily: 'inherit',
  containerTextAlign: 'center',
  enabled: true,
};

/**
 * 预设配置：大图样式
 */
export const presetLarge = {
  imageWidth: '95%',
  imageMaxWidth: '1400px',
  imageMarginBottom: '12px',
  captionFontSize: '1em',
  captionColor: '#555',
  captionFontFamily: 'serif',
  containerTextAlign: 'center',
  enabled: true,
};