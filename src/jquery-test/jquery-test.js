const printVersion = () => {
  const body = document.querySelector('header');
  const h3 = document.createElement('h3');
  body.appendChild(h3);
  h3.setAttribute('id', 'host-version-root');
  const text = `
    jQuery HOST: ${$().jquery}
  `;
  document.getElementById('host-version-root').innerText = text;
};

const jQueryTest = () => {
  // https://www.telerik.com/blogs/whats-new-in-jquery-3
  var deferred = $.Deferred();

  deferred
    .then(function () {
      throw new Error('An error');
    })
    .then(
      // the first fn in chain is FAIL callback
      function () {
        console.log('Success 1');
      },
      // the second fn in chain is PROGRESS callback
      function () {
        console.log('Failure 1');
      }
    )
    .then(
      function () {
        console.log('Success 2');
      },
      function () {
        console.log('Failure 2');
      }
    );

  /*
    In jQuery 1.x and 2.x, an uncaught exception inside a callback function 
    passed to a Deferred halts the program's execution. Unlike the native 
    Promise object, the thrown exception bubbles up until it (usually) 
    reaches window.onerror. If you haven't defined a function for this event 
    (which is uncommon), the exception's message is displayed and the program's 
    execution is aborted.
  */

  /*
    jQuery 3 follows the same pattern followed by the native Promise object. 
    Therefore, a thrown exception is translated into a rejection and the failure 
    callback is executed. Once done, the process continues and the subsequent 
    success callbacks are executed.
  */
  deferred.resolve();
};

export default () => {
  printVersion();
  jQueryTest();
};
