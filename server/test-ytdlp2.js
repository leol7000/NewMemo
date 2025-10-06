const YTDlpWrap = require('yt-dlp-wrap');

async function testYtDlp() {
  try {
    console.log('Testing yt-dlp...');
    
    const ytDlpPath = '/Users/leo/Library/Python/3.9/bin/yt-dlp';
    const ytDlpWrap = new YTDlpWrap.default(ytDlpPath);
    
    console.log('yt-dlp wrapper created');
    
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    
    // 测试获取视频信息
    console.log('Getting video info...');
    const videoInfoResult = await ytDlpWrap.exec([
      '--dump-json',
      '--no-download',
      videoUrl
    ]);
    
    console.log('Video info result type:', typeof videoInfoResult);
    
    // 等待结果
    const videoInfoData = await new Promise((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      
      videoInfoResult.on('data', (data) => {
        console.log('Received data chunk:', data.toString().substring(0, 100));
        stdout += data.toString();
      });
      
      videoInfoResult.on('error', (error) => {
        console.log('Error event:', error);
        reject(error);
      });
      
      videoInfoResult.on('close', (code) => {
        console.log('Close event with code:', code);
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`yt-dlp exited with code ${code}: ${stderr}`));
        }
      });
    });
    
    console.log('Video info data length:', videoInfoData.length);
    console.log('First 200 chars:', videoInfoData.substring(0, 200));
    
    const videoInfo = JSON.parse(videoInfoData);
    console.log('Video title:', videoInfo.title);
    console.log('Video thumbnail:', videoInfo.thumbnail);
    
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testYtDlp();
