<a href="https://miro.medium.com/max/1000/0*jcNZd6Gx5xtDjOoF.png"><img width="100%" height="100%" src="https://miro.medium.com/max/1000/0*jcNZd6Gx5xtDjOoF.png"></a>

# Dynamic Module Federation (Host App)

[![Netlify Status](https://api.netlify.com/api/v1/badges/d9255f2f-8d7d-4f47-a998-c8d2fe26d32e/deploy-status)](https://app.netlify.com/sites/dynamic-host-module-federation/deploys)

An environment-agnostic, federated host that consumes remote applications dynamically. [Click here to see it live on Netlify](https://dynamic-host-module-federation.netlify.app/).

## Introduction

This stand-alone application dynamically consumes (hosts) the portion of the remote app that is exposed at runtime.

## Features

- Supports a multi-environment setup (`dev`, `testing`, `stage`, etc.)
- Eliminate hard-coded URLs from your code and build tooling
- Connect to remote containers and negotiate libraries dynamically
- Supports remote container lazy-loading, chunk splitting, asset cache-busting, and Webpack merge

## Installation

Install dependencies:

        npm install

## Usage

Run dev environment:

        npm run dev

Navigate to local server:

**[http://localhost:8000](http://localhost:8000)**

## Getting Started

See [Tutorial - A Guide to Module Federation for Enterprise](https://dev.to/waldronmatt/tutorial-a-guide-to-module-federation-for-enterprise-n5) for more information and to learn how this repository works.

## Notes

**Run this project alongside [the remote app](https://github.com/waldronmatt/dynamic-remote-module-federation)**.

## Supplementary Repositories

This repository employs additional code from the following repositories:

- [remote app repo](https://github.com/waldronmatt/dynamic-remote-module-federation)
- [module federation assets](https://github.com/waldronmatt/dynamic-module-federation-assets)
- [dynamic-container-path-webpack-plugin](https://github.com/waldronmatt/dynamic-container-path-webpack-plugin)

## License

MIT
