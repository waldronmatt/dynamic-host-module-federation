<a href="https://user-images.githubusercontent.com/15273233/93658796-e2797000-fa92-11ea-8226-bf1e528251c5.png"><img width="100%" height="100%" src="https://user-images.githubusercontent.com/15273233/93658796-e2797000-fa92-11ea-8226-bf1e528251c5.png"></a>

# Dynamic Module Federation (Host App)

An environment-agnostic, federated host that consumes remote applications dynamically.

## Introduction

This stand-alone application dynamically consumes (hosts) the portion of the remote app that is exposed at runtime.

## Features
- Dynamic Remote Containers
    - Connect remote containers to a host container dynamically at runtime
    - Negotiate shared libraries dynamically
- Environment-Agonstic
    - Uses environment context to set `publicPath` dynamically at runtime
    - Maps local and remote `chunks` to the current environment
- Code-Splitting
    - Lazy-load dynamic remote apps
    - Asynchronously `splitChunks` local and remote code
- Cache-busting
    - Generates a `manifest` file to dynamically load cache-busted `entrypoints`
- Reusable Configurations
    - Utilizes `webpack-merge` to abstract out common webpack configurations
    - Runtime configurations can be reused as part of a boilerplate

## Installation

Install dependencies:

        npm install

## Usage

Run dev environment:

        npm run dev

Navigate to local server:

**[http://localhost:8000](http://localhost:8000)**

## Notes

**Run this project alongside [the remote app](https://github.com/waldronmatt/dynamic-remote-module-federation)**. 

## License

MIT
