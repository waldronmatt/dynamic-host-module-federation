/*
  This is our remote component constructor

  Usage references:
  https://webpack.js.org/concepts/module-federation/#dynamic-remote-containers
  https://github.com/module-federation/module-federation-examples/blob/master/advanced-api/dynamic-remotes/app1/src/App.js
*/

const loadComponent = (scope, module) => {
  return async () => {
    /* 
      Initializes the shared scope. Fills it with known provided modules from this build and all remotes

      Webpack unit test info: 'should provide both shared versions, but not the unused one'
      https://github.com/webpack/webpack/blob/master/test/configCases/sharing/provide-multiple-versions/index.js
    */
    await __webpack_init_sharing__("default");
    const container = window[scope]; // or get the container somewhere else
    /*
      Initialize the container, it may provide shared modules

      Webpack unit test info: 
        'should be able to consume different shared module version depending on context'
        'should not override an already loaded shared module version'
      https://github.com/webpack/webpack/blob/master/test/configCases/sharing/consume-multiple-versions/index.js
    */
    await container.init(__webpack_share_scopes__.default);
    // get module './initContactForm' from scope (public name) 'FormApp'
    const factory = await window[scope].get(module);
    const Module = factory();
    return Module;
  };
};

export default () => loadComponent;
