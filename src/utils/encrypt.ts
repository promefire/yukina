// 服务端加密函数（构建时使用）
export async function encrypt(data: string, password: string): Promise<string> {
  // 确保密码长度至少16位
  const key = password.padEnd(16, '0');
  
  const dataBuffer = new TextEncoder().encode(data);
  const keyBuffer = new TextEncoder().encode(key);
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyBuffer,
    { name: 'AES-CBC', length: 128 },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    cryptoKey,
    dataBuffer
  );
  
  // 将 IV 和加密数据合并
  const combinedData = new Uint8Array(iv.length + encryptedData.byteLength);
  combinedData.set(iv);
  combinedData.set(new Uint8Array(encryptedData), iv.length);
  
  // 转换为 base64
  return btoa(String.fromCharCode(...combinedData));
}

// 客户端解密函数
export async function decrypt(encryptedData: string, password: string): Promise<string> {
  try {
    // 确保密码长度至少16位
    const key = password.padEnd(16, '0');
    
    // 从 base64 解码
    const combinedData = new Uint8Array(
      atob(encryptedData).split('').map(char => char.charCodeAt(0))
    );
    
    // 分离 IV 和加密数据
    const iv = combinedData.slice(0, 16);
    const encrypted = combinedData.slice(16);
    
    const keyBuffer = new TextEncoder().encode(key);
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyBuffer,
      { name: 'AES-CBC', length: 128 },
      false,
      ['decrypt']
    );
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      cryptoKey,
      encrypted
    );
    
    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    throw new Error('解密失败，请检查密码是否正确');
  }
}