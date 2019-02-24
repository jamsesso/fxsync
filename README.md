<p align="center">
  <img src="https://raw.githubusercontent.com/jamsesso/fxsync/master/fxsync.png" alt="FXSync" />
</p>
<h1 align="center">fxsync</h1>

**fxsync** is a bundler allows you to import React components from your existing projects into a Framer X file without changes to your existing code.

## Installation

```sh
npm install -g fxsync
```

**Important:** Node.js >= 10.12.0 is required!

## Usage

### Setup

First, create a `.framerx` file that you want to inject your project's components into.

Next, In your npm project, annotate each component file you want to inject to your Framer X design with a pragma. For example:

```js
/** @framerx MyProductionButton */
import React from 'react';

function Button({children, onClick}) {
  return <button type="button" onClick={onClick}>{children}</button>;
}

export default Button;
```

**Important:** The name in the `@framerx` pragma does not need to match the component name, but it must be a valid JSX identifier. Your component must also be the default export in the file.

The name you specify in the pragma is the name that the component will have inside your Framer X design file (in this case it is `MyProductionButton`; see line 1 of the previous example).

### Bundling your Components

Next, run `fxsync` with the path to your npm project (the directory containing the project's `package.json`) and the path to your existing `.framerx` file. This works best if you do not have the Framer file open in Framer while this command is executing.

```sh
fxsync <path to your npm project> <path to your .framerx file>
```

This will build a common-js compatible file named after your npm project (`name` in the `package.json` file) and inject it into your `.framerx` file at `code/lib/<your npm project name>.js`.

`fxsync` can be run any number of times against the same `.framerx` file. When your production React code is updated, re-run the `fxsync` bundler to update the components in Framer X.

### Integrating Components into Framer X

Now that your production code is available inside of your Framer X design file, we can use them in our designs.

In Framer X, create a new component from Code. This will generate a file that you can modify. For this example, I am going to create a code component called `MyFramerXButton`:

```ts
import * as React from "react";
import { PropertyControls, ControlType } from "framer";

// Import your production components.
// my-project-name should be replaced by the name from your 
// project's package.json file.
import {MyProductionButton} from './fxsync/my-project-name';

type Props = { text: string };

export class MyFramerXButton extends React.Component<Props> {
  static defaultProps: Props = {
    text: "Hello World!"
  };
  
  static propertyControls: PropertyControls<Props> = {
    text: { type: ControlType.String, title: "Text" }
  };

  render() {
    return <MyProductionButton>{this.props.text}</MyProductionButton>;
  }
}
```

## API

`fxsync` offers an API for running the build in code.

```js
const fxsync = require('fxsync');
fxsync('/path-to-project', '/path-to-design.framerx');
```

## Testing & Issues

This bundler was developed against a project that uses `create-react-app` and `styled-components`. It may not work for every type of project structure at this point.

If you find issues, I will do my best to explain how this bundler needs to be changed in order to support your project's requirements - however, it will likely be up to you to submit a PR with a fix.