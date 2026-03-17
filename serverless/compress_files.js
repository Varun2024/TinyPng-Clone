const imageminModule = require("imagemin");
const imageminJpegRecompress = require("imagemin-jpeg-recompress");
const imageminPngquantModule = require("imagemin-pngquant");

const imagemin = imageminModule.default || imageminModule;
const imageminPngquant = imageminPngquantModule.default || imageminPngquantModule;

const getPluginsForExtension = (extension) => {
  const normalizedExtension = extension.toLowerCase();

  if (normalizedExtension === "png") {
    return [
      imageminPngquant({
        quality: [0.2, 0.6],
      }),
    ];
  }

  if (normalizedExtension === "jpg" || normalizedExtension === "jpeg") {
    return [
      imageminJpegRecompress({
        min: 20,
        max: 60,
      }),
    ];
  }

  return [];
};

exports.handler = async (event, context) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing request body." }),
      };
    }

    const params = JSON.parse(event.body);
    const { base64String, name, extensions } = params;

    if (!base64String || !name || !extensions) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing required image fields." }),
      };
    }

    const plugins = getPluginsForExtension(extensions);
    if (plugins.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Unsupported file format." }),
      };
    }

    const normalizedExtension = extensions.toLowerCase();
    const base64Image = base64String.split(";base64,").pop();
    const filename = `${name}.${normalizedExtension}`;
    const result = Buffer.from(base64Image, "base64");
    const newImgBuffer = await imagemin.buffer(result, {
      plugins,
    });

    const filesize = newImgBuffer.length;
    const base64CompString = `${newImgBuffer.toString("base64")}`;
    const imageDataObj = { base64CompString, filename, filesize };
    return {
      statusCode: 200,
      body: JSON.stringify(imageDataObj),
    };
  } catch (err) {
    console.error("Compression function failed", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
