import SparkMD5 from 'spark-md5';

interface FileChunk {
  chunkFile: Blob;
}
/**
 * @description 创建文件切片
 * @param file 文件对象
 * @param chunkSize 切片大小
 * @returns
 */
function createFileChunk(file: File, chunkSize: number): Promise<FileChunk[]> {
  return new Promise((resolve) => {
    const fileChunkList: FileChunk[] = [];
    let cur = 0;
    while (cur < file.size) {
      // Blob 接口的 slice() 方法创建并返回一个新的 Blob 对象，该对象包含调用它的 blob 的子集中的数据。
      fileChunkList.push({ chunkFile: file.slice(cur, cur + chunkSize) });
      cur += chunkSize;
    }
    // 返回全部文件切片
    resolve(fileChunkList);
  });
}

// 加载并计算文件切片的MD5
async function calculateChunksHash(fileChunkList: FileChunk[]) {
  // 初始化脚本
  const spark = new SparkMD5.ArrayBuffer();

  // 计算切片进度（拓展功能，可自行添加）
  let percentage = 0;
  // 计算切片次数
  let count = 0;

  // 递归函数，用于处理文件切片
  async function loadNext(index: number) {
    if (index >= fileChunkList.length) {
      // 所有切片都已处理完毕
      return spark.end(); // 返回最终的MD5值
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(fileChunkList[index].chunkFile);
      reader.onload = (e) => {
        if (!e.target) {
          reject(new Error('未读取到文件切片'));
          return;
        }
        count++;
        console.log('已处理切片数：', count);
        spark.append(e.target.result as ArrayBuffer);

        // 更新进度并处理下一个切片
        percentage += 100 / fileChunkList.length;
        self.postMessage({ percentage }); // 发送进度到主线程

        resolve(loadNext(index + 1)); // 递归调用，处理下一个切片
      };
      reader.onerror = (err) => {
        reject(err); // 如果读取错误，则拒绝Promise
      };
    });
  }

  try {
    // 开始计算切片
    const fileHash = await loadNext(0); // 等待所有切片处理完毕
    self.postMessage({ percentage: 100, fileHash, fileChunkList }); // 发送最终结果到主线程
    self.close(); // 关闭Worker
  } catch (err) {
    self.postMessage({ name: 'error', data: err }); // 发送错误到主线程
    self.close(); // 关闭Worker
  }
}

// 监听消息
self.addEventListener(
  'message',
  async (e) => {
    try {
      const { file, chunkSize } = e.data;
      const fileChunkList = await createFileChunk(file, chunkSize); // 创建文件切片
      await calculateChunksHash(fileChunkList); // 等待计算完成
    } catch (err) {
      // 这里实际上不会捕获到calculateChunksHash中的错误，因为错误已经在Worker内部处理了
      // 但如果未来有其他的异步操作，这里可以捕获到它们
      console.error('worker监听发生错误:', err);
    }
  },
  false,
);

// 主线程可以监听 Worker 是否发生错误。如果发生错误，Worker 会触发主线程的error事件。
self.addEventListener('error', (event) => {
  console.log('Worker触发主线程的error事件：', event);
  self.close(); // 关闭Worker
});
