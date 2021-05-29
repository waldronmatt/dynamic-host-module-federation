import image from "./module-federation.png";
import "./module-federation.scss";

class moduleFederation {
  render() {
    const img = document.createElement("img");
    img.src = image;
    img.alt = "Module Federation";
    img.classList.add("mf-image");

    const bodyDomElement = document.querySelector("header");
    bodyDomElement.appendChild(img);
  }
}

export default moduleFederation;
