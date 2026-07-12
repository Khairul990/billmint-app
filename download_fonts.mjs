import fs from 'fs';
import https from 'https';

const download = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        https.get(response.headers.location, (response2) => {
           response2.pipe(file);
           file.on('finish', () => { file.close(resolve); });
        });
      } else {
        response.pipe(file);
        file.on('finish', () => {
          file.close(resolve);
        });
      }
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

console.log("Downloading fonts...");
Promise.all([
  download('https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSans/NotoSans-Regular.ttf', 'public/fonts/NotoSans-Regular.ttf'),
  download('https://github.com/googlefonts/noto-fonts/raw/main/hinted/ttf/NotoSansBengali/NotoSansBengali-Regular.ttf', 'public/fonts/NotoSansBengali-Regular.ttf')
]).then(() => console.log('Done')).catch(console.error);
