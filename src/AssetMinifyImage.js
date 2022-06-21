const fs = require('fs');
const path = require('path');
const FileHelper = require('./FileHelper');
const compressImages = require('compress-images');
const { compress } = require('compress-images/promise');

// 查找所有图片类型
let AssetMinifyImage = {
  fileMap: null,

  // 输出文件日志
  start(sourceFile, destFile) {
    if (!sourceFile || sourceFile.length <= 0 || !destFile || destFile.length <= 0) {
      console.error('Cleaner: invalid source or dest');
    }

    sourceFile = FileHelper.getFullPath(sourceFile);
    destFile = FileHelper.getFullPath(destFile);
    
    
    // 执行压缩
    this.minify(sourceFile, destFile).finally(() => {
      // 拷贝
      this.copy(sourceFile, destFile);
    });

  },

  // 拷贝文件，如果已存在的文件则跳过
  copy: function(srcDir, resultDir) {

    // 源目录不能为空
    if (!fs.existsSync(srcDir)) {
      console.log('do not exist path: ', srcDir);
      return;
    }

    
    if (!fs.existsSync(resultDir)) {
      // 创建目录
      fs.mkdirSync(resultDir);
    }

    let files = fs.readdirSync(srcDir, { withFileTypes: true });
    for (let i = 0, len = files.length; i < len; i++) {
      let file = files[i];
      let srcPath = path.join(srcDir, file.name);
      let resultPath = path.join(resultDir, file.name);

      if (file.isFile()) {

        // 判断文件是否存在
        if (!fs.existsSync(resultPath)) {
          // 创建文件，使用流的形式可以读写大文件
          let readStream = fs.createReadStream(srcPath);
          let writeStream = fs.createWriteStream(resultPath);
          readStream.pipe(writeStream);
        }

      } else {

        try {
          // 判断读(R_OK | W_OK)写权限
          fs.accessSync(path.join(resultPath, '..'), fs.constants.W_OK);
          this.copy(srcPath, resultPath);
        } catch (error) {
          console.log('folder write error:', error);
        }
      }
    }
  },

  // 压缩图片
  minify: async (inputPath, outputPath) => {

    inputPath += '/**/*.{jpg,JPG,jpeg,JPEG,png,svg,gif}';
    outputPath += '/';
    // compressImages(inputPath, outputPath, { compress_force: false, statistic: true, autoupdate: true }, false,
    //   { jpg: { engine: "mozjpeg", command: ["-quality", "60"] } },
    //   { png: { engine: "pngquant", command: ["--quality=20-50", "-o"] } },
    //   { svg: { engine: "svgo", command: "--multipass" } },
    //   { gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] } },
    //   function (error, completed, statistic) {
    //     console.log("-------------");
    //     console.log(error);
    //     console.log(completed);
    //     console.log(statistic);
    //     console.log("-------------");
    //   }
    // );

    // callback();

    const result = await compress({
      source: inputPath,
      destination: outputPath,
      enginesSetup: {
        jpg: { engine: "mozjpeg", command: ["-quality", "60"] },
        png: { engine: "pngquant", command: ["--quality=20-50", "-o"] },
        svg: { engine: "svgo", command: "--multipass" },
        gif: { engine: "gifsicle", command: ["--colors", "64", "--use-col=web"] }
      }
    });

    const { statistic, errors } = result;
  }

};

module.exports = AssetMinifyImage;

