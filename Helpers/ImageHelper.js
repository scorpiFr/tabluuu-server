const FileType = require("file-type");
const sharp = require("sharp");
const fs = require("fs");
const fs2 = require("fs/promises");
const path = require("path");

/*
 * calculate resize ratio
 * Return 0 if resize not needed.
 */
function getImageResizeRatio(width, height, maxwidth, maxheight) {
  // verif
  if (width <= maxwidth && height <= maxheight) {
    return 0;
  }
  // calculate
  const ratioX = width <= maxwidth ? 0 : maxwidth / width;
  const ratioY = height <= maxheight ? 0 : maxheight / height;
  // return smallest ratio
  if (ratioX > 0 && ratioY > 0) {
    return ratioX < ratioY ? ratioX : ratioY;
  }
  if (ratioX === 0) {
    return ratioY;
  }
  return ratioX;
}

/*
 * get image in memory, resize it, and save it.
 * imageSourcePath and imageDestPath can be the same
 */
async function resizeImage(
  imageSourcePath,
  imageDestPath,
  maxwidth,
  maxheight
) {
  try {
    // set image into memory buffer
    const inputBuffer = await fs2.readFile(imageSourcePath);
    // get image size
    const metadata = await sharp(inputBuffer).metadata();
    // image mode
    const imageMode =
      metadata.width > metadata.height ? "horizontal" : "vertical";
    // verif
    const ratio = getImageResizeRatio(
      metadata.width,
      metadata.height,
      maxwidth,
      maxheight
    );
    // no resize need => save
    if (!ratio) {
      await fs2.writeFile(imageDestPath, inputBuffer);
      return imageMode;
    }
    // resize
    const resizedWidth = Math.round(metadata.width * ratio);
    const resizedHeight = Math.round(metadata.height * ratio);
    const outputBuffer = await sharp(inputBuffer)
      .resize(resizedWidth, resizedHeight)
      .toBuffer();
    // save
    await fs2.writeFile(imageDestPath, outputBuffer);
    // return
    return imageMode;
  } catch (err) {
    console.error("❌ Erreur :", err.message);
    return "";
  }
}

/**
 * filePath : real filepath where image is. ex : /var/temp_uploads/fe1daa2e33bdb40735a6ea7c42838e87
 * originalname : original name of image. ex : burger.jpg
 */
async function is_allowedImageExtention(filePath, originalname) {
  // verif with extention
  const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".gif"];
  const ext = path.extname(originalname).toLowerCase(); // ext :  .jpg
  if (!allowedExtensions.includes(ext)) {
    return false;
  }
  // verif with mimetype
  const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
  ];
  const fileType = await FileType.fromFile(filePath); // { ext: 'jpg', mime: 'image/jpeg' }
  if (!allowedMimeTypes.includes(fileType.mime)) {
    return false;
  }
  return true;
}

// delete file without error, without print something, without stops
function deleteFile(filePath) {
  fs.unlink(filePath, (err) => {
    if (err && err.code !== "ENOENT") {
      // console.error("❌ Erreur lors de la suppression :", err.message);
    }
  });
}

module.exports = {
  getImageResizeRatio,
  resizeImage,
  is_allowedImageExtention,
  deleteFile,
};
