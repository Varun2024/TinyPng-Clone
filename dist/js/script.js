import Counter from "./Counter.js";
const counter = new Counter();
const MAX_UPLOAD_MB = 4.2;
const MAX_FILES = 20;
const uploadNotice = document.getElementById("upload_notice");

const setUploadNotice = (message, variant = "error") => {
  if (!uploadNotice) return;
  uploadNotice.textContent = message;
  uploadNotice.classList.remove("none", "upload-notice--info");
  if (variant === "info") {
    uploadNotice.classList.add("upload-notice--info");
  }
};

const clearUploadNotice = () => {
  if (!uploadNotice) return;
  uploadNotice.textContent = "";
  uploadNotice.classList.add("none");
  uploadNotice.classList.remove("upload-notice--info");
};

const initApp = () => {
  const droparea = document.querySelector(".droparea");
  const filePicker = document.getElementById("file_picker");

  if (!droparea) return;

  const openFilePicker = () => filePicker?.click();

  // for when the file is dragged over the drop area
  const active = () => droparea.classList.add("green-border");
  const inactive = () => droparea.classList.remove("green-border");
  const preventDefaults = (e) => e.preventDefault();

  //   prevent the default behavior of the browser when a file is dragged and dropped on the drop area
  {
    ["dragenter","dragover", "drop","dragleave"].forEach((evtName) => {
      droparea.addEventListener(evtName, preventDefaults);
    });
  }
  {
    ["dragenter", "dragover"].forEach((evtName) => {
      droparea.addEventListener(evtName, active);
    });
  }

  // when the file is dragged out of the drop area or dropped
  {
    ["dragleave", "drop"].forEach((evtName) => {
      droparea.addEventListener(evtName, inactive);
    });
  }

  droparea.addEventListener("drop", handleDrop);
  droparea.addEventListener("click", (e) => {
    if (e.target.closest(".droparea__action")) return;
    openFilePicker();
  });
  droparea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFilePicker();
    }
  });
  filePicker?.addEventListener("change", handleFileSelection);
};

// Initialize the app when the DOM is fully loaded , by defer or by listening to the DOMContentLoaded event
document.addEventListener("DOMContentLoaded", initApp);

// event e coming from the drop event listener
const handleDrop = (e) => {
  const data = e.dataTransfer;
  const files = data.files;
  // at this point files is a FileList object which is an array-like object containing the files that were dropped
  // we can convert it to an array using the spread operator or Array.from() method
  const fileArray = [...files];
  if (fileArray.length > MAX_FILES) {
    return setUploadNotice(`You can upload up to ${MAX_FILES} files per batch.`);
  }
  clearUploadNotice();
  handleFiles(fileArray);
};

const handleFileSelection = (e) => {
  const files = e.target.files;
  const fileArray = [...files];
  if (fileArray.length > MAX_FILES) {
    e.target.value = "";
    return setUploadNotice(`You can upload up to ${MAX_FILES} files per batch.`);
  }
  clearUploadNotice();
  handleFiles(fileArray);
  e.target.value = "";
};

const handleFiles = (filesArray) => {
  filesArray.forEach((file) => {
    const fileID = counter.getValue(); //counter\
    //
    counter.increamentValue();
    if (file.size / 1024 / 1024 > MAX_UPLOAD_MB) {
      return setUploadNotice(
        `${file.name} is over ${MAX_UPLOAD_MB}MB. Please upload a smaller file.`
      );
    }
    setUploadNotice("Upload in progress...", "info");
    createResult(file, fileID);
    uploadFile(file, fileID);
  });
};

const createResult = (file, fileID) => {
  const origFileSizeString = getFileSizeString(file.size);

  const p1 = document.createElement("p");
  p1.className = "results__title";
  p1.textContent = file.name;

  const p2 = document.createElement("p");
  p2.id = `orig_size_${file.name}_${fileID}`;
  p2.className = "results__size";
  p2.textContent = origFileSizeString;

  const dOne = document.createElement("div");
  dOne.appendChild(p1);
  dOne.appendChild(p2);

  const progress = document.createElement("progress");
  progress.id = `progress_${file.name}_${fileID}`;
  progress.className = "results__bar";
  progress.max = 10;
  progress.value = 0;

  const p3 = document.createElement("p");
  p3.id = `new_size_${file.name}_${fileID}`;
  p3.className = "results__size";

  const p4 = document.createElement("p");
  p4.id = `download_${file.name}_${fileID}`;
  p4.className = "results__download";

  const p5 = document.createElement("p");
  p5.id = `saved_${file.name}_${fileID}`;
  p5.className = "results__saved";

  const dDL = document.createElement("div");
  dDL.className = "divDL";
  dDL.appendChild(p4);
  dDL.appendChild(p5);

  const dTwo = document.createElement("div");
  dTwo.appendChild(p3);
  dTwo.appendChild(dDL);

  const li = document.createElement("li");
  li.appendChild(dOne);
  li.appendChild(progress);
  li.appendChild(dTwo);

  document.querySelector(".results__list").appendChild(li);
  displayResults();
};

const getFileSizeString = (filesize) => {
  const sizeInKB = parseFloat(filesize) / 1024;
  const sizeInMB = parseFloat(filesize / 1024) / 1024;
  return sizeInKB > 1024
    ? `${sizeInMB.toFixed(1)} MB`
    : `${sizeInKB.toFixed(1)} KB`;
};

const displayResults = () => {
  const results = document.querySelector(".results");
  if (results.classList.contains("none")) {
    results.classList.remove("none");
    results.classList.add("block");
  }
};

const uploadFile = (file, fileID) => {
  const reader = new FileReader();
  reader.addEventListener("loadend", async (e) => {
    const filename = file.name;
    const base64String = e.target.result;
    const extensions = filename.split(".").pop();
    const name = filename.slice(0, filename.length - (extensions.length + 1));
    const body = {
      base64String,
      name,
      extensions,
    };
    const url = "./.netlify/functions/compress_files";

    try {
      const fileStream = await fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        isBase64Encoded: true,
      });
      const imgJson = await fileStream.json();
      if (imgJson.error) return handleFileError(filename, fileID);
      updateProgressBar(file, fileID, imgJson);
    } catch (err) {
      console.error(err);
    }
  });

  reader.readAsDataURL(file);
};

const handleFileError = (filename, fileID) => {
  const progress = document.getElementById(`progress_${filename}_${fileID}`);
  progress.value = 10;
  progress.classList.add("error");
  setUploadNotice(`Could not compress ${filename}. Try a different image.`);
};

const updateProgressBar = (file, fileID, imgJson) => {
  const progress = document.getElementById(`progress_${file.name}_${fileID}`);
  const addProgress = setInterval(() => {
    progress.value += 1;
    if (progress.value === 10) {
      clearInterval(addProgress);
      progress.classList.add("finished");
      populateResult(file, fileID, imgJson);
      clearUploadNotice();
    }
  }, 50);
};

const populateResult = (file, fileID, imgJson) => {
  const compressedSize = Number(imgJson.newSize ?? imgJson.filesize);
  if (!Number.isFinite(compressedSize) || compressedSize <= 0) {
    return handleFileError(file.name, fileID);
  }

  const newSizeString = getFileSizeString(compressedSize);
  const percentageSaved = getPercentageSaved(file.size, compressedSize);

  const newSize = document.getElementById(`new_size_${file.name}_${fileID}`);
  newSize.textContent = newSizeString;

  const download = document.getElementById(`download_${file.name}_${fileID}`);
  const link = createDownloadLink(imgJson);
  download.appendChild(link);

  const saved = document.getElementById(`saved_${file.name}_${fileID}`);
  saved.textContent = `Saved ${percentageSaved.toFixed(1)}%`;
};

const getPercentageSaved = (origSize, newSize) => {
  const origFS = parseFloat(origSize);
  const newFS = parseFloat(newSize);
  if (!Number.isFinite(origFS) || !Number.isFinite(newFS) || origFS <= 0) {
    return 0;
  }
  return ((origFS - newFS) / origFS) * 100;
};

const createDownloadLink = (imgJson) => {
  const extension = (imgJson.filename).split(".").pop();
  const link = document.createElement("a");
  link.href = `data:image/${extension};base64,${imgJson.base64CompString}`;
  link.download = imgJson.filename;
  link.textContent = "download";
  return link;
};
