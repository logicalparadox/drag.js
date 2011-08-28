# drag.js

Drag.js is a very small javascript utility that facilitates UI drag and drop behavior. It currently has one dependancy of [Bean](https://github.com/fat/bean).

Now includes touch support. Tested on Android Honeycomb (Xoom). Looking for Apple testers! Visit [Documentation](https://logicalparadox.github.com/drag.js) on your touch device and try examples. Please leave feedback in Github Issues.

## Ender Integratiion

Got [Ender](http://ender.no.de)? Well, why not?

    $ npm install ender -g

Add drag.js to your existing Ender build:

    $ ender add drag

Like a boss :D

``` js
$('#content .dragme').drag()
  .axis('x')
  .container('#content')
  .end(function() {
    alert(this.pos.x + 'px, ' + this.pos.y + 'px');
  })
  .bind();
```

## License

(The MIT License)

Copyright (c) 2011 Jake Luer

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.