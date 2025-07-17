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

async function addImageOnAbstractItem(
  srcPath,
  item,
  imageMaxWidth,
  imageMaxHeight,
  thumbnailMaxWidth,
  thumbnailMaxHeight,
  originalName = "",
  isImageMode = false
) {
  // verifs
  if (!originalName || !originalName.length) {
    originalName = path.basename(srcPath);
  }

  // inits
  const relativeTargetDir = item.etablissement_id + "/images";
  const absoluteTargetDir = path.join(
    process.env.UPLOAD_FILE_PATH + "/" + relativeTargetDir
  );

  // verify extention
  if (originalName.length > 200) {
    return {
      item,
      httpCode: 400,
      errorMsg: "Filename too long (200 char max) : " + originalName,
    };
  }

  if (!is_allowedImageExtention(srcPath, originalName)) {
    return {
      item,
      httpCode: 400,
      errorMsg: "Forbidden mimetype",
    };
  }

  // create dir if not exists
  if (!fs.existsSync(absoluteTargetDir)) {
    fs.mkdirSync(absoluteTargetDir, { recursive: true });
  }

  // set real image
  const relativeTargetPath = path.join(relativeTargetDir, originalName);
  const absoluteTargetPath = path.join(absoluteTargetDir, originalName);
  const imageMode = await resizeImage(srcPath, absoluteTargetPath, 600, 1000);
  item.image = relativeTargetPath;

  // set thumbnail
  const extension = path.extname(originalName); // .jpg
  const filenameWithoutExt = path.basename(originalName, extension);
  const thumbName = filenameWithoutExt + "-thumb" + extension;
  const relativeTargetPathThumb = path.join(relativeTargetDir, thumbName);
  const absoluteTargetPathThumb = path.join(absoluteTargetDir, thumbName);
  resizeImage(srcPath, absoluteTargetPathThumb, 100, 100);
  item.thumbnail = relativeTargetPathThumb;

  // image_mode
  if (isImageMode) {
    item.image_mode = imageMode;
  }
  // save item
  await item.save();

  // return
  return { item, httpCode: 200, errorMsg: "" };
}

async function addImageOnStaticItem(srcPath, staticItem, originalName = "") {
  return await addImageOnAbstractItem(
    srcPath,
    staticItem,
    600,
    1000,
    100,
    100,
    originalName
  );
}

async function addImageOnItem(srcPath, item, originalName = "") {
  return await addImageOnAbstractItem(
    srcPath,
    item,
    600,
    1000,
    100,
    100,
    originalName,
    true
  );
}

async function removeImageOnItem(item) {
  let flag = false;
  // delete image
  if (item.image.length > 0) {
    deleteFile(process.env.UPLOAD_FILE_PATH + "/" + item.image);
    item.image = "";
    flag = true;
  }
  // delete thumbnail
  if (item.thumbnail.length > 0) {
    deleteFile(process.env.UPLOAD_FILE_PATH + "/" + item.thumbnail);
    item.thumbnail = "";
    flag = true;
  }
  // save item
  if (flag === true) {
    await item.save();
  }
}

module.exports = {
  getImageResizeRatio,
  resizeImage,
  is_allowedImageExtention,
  deleteFile,
  addImageOnStaticItem,
  removeImageOnItem,
  addImageOnItem,
};
