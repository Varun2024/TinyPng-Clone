const initApp = () => {
  const droparea = document.querySelector(".droparea");

  if (!droparea) return console.error("Drop area not found in the DOM");
  else console.log("Drop area found in the DOM");

  // for when the file is dragged over the drop area
  const active = () => droparea.classList.add("green-border");
  const inactive = () => droparea.classList.remove("green-border");
  const preventDefaults = (e) => e.preventDefault();

  //   prevent the default behavior of the browser when a file is dragged and dropped on the drop area
  {
    ["dragenter", "dragover", "dragleave", "drop"].forEach((evtName) => {
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

  droparea.addEventListener("drop",handleDrop)
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
    console.log(fileArray);
}
