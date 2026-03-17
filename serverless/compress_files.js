exports.handler = async (event, context) => {
  try {
    const { default: imagemin } = await import("imagemin");
    const { default: imageminJpegRecompress } = await import("imagemin-jpeg-recompress");
    const { default: imageminPngquant } = await import("imagemin-pngquant");

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

    const normalizedExtension = extensions.toLowerCase();

    let plugins;
    if (normalizedExtension === "png") {
      plugins = [imageminPngquant({ quality: [0.2, 0.6] })];
    } else if (normalizedExtension === "jpg" || normalizedExtension === "jpeg") {
      plugins = [imageminJpegRecompress({ min: 20, max: 60 })];
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Unsupported file format." }),
      };
    }

    const base64Image = base64String.split(";base64,").pop();
    const filename = `${name}.${normalizedExtension}`;
    const result = Buffer.from(base64Image, "base64");
    const newImgBuffer = await imagemin.buffer(result, { plugins });

    const filesize = newImgBuffer.length;
    const base64CompString = newImgBuffer.toString("base64");
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
