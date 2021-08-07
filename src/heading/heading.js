import './heading.scss';

class Heading {
  render(pageName) {
    const h1 = document.createElement('h1');
    h1.classList.add('header-styling');
    const body = document.querySelector('header');
    h1.innerHTML = `Welcome to ${pageName}`;
    body.appendChild(h1);
  }
}

export default Heading;
