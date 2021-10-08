import { transform } from "../../utils";
import { FbtOptions } from "../types";

function runTest({ source, ...options }: { source: string } & FbtOptions) {
  expect(
    transform(source, { mode: "fbt", fbtOptions: options })
  ).toMatchSnapshot();
}

it("object property", () => {
  runTest({
    source: `
const test = {prop: 'test'};
  `,
  });
});

it("literal variable", () => {
  runTest({
    source: `
const test = 'text';
  `,
  });
});

it("literal variable with custom description", () => {
  runTest({
    description: "my desc",
    source: `
const test = 'text';
  `,
  });
});

it("literal variable if needed", () => {
  runTest({
    source: `
const test = 'text';
const test2 = fbt('text2', 'my description');
  `,
  });
});

it("prevent transform fbt options", () => {
  runTest({
    source: `
const test2 = fbt('text2', 'my description', {project:"foo"});
  `,
  });
});

it("jsx attributes", () => {
  runTest({
    source: `
<input title="need to translate" className="ignore"/>
  `,
  });
});

it("jsx simple text", () => {
  runTest({
    source: `
<span>Text</span>;
<span>{'Text'}</span>;
<span>{"Text"}</span>;
<span>{\`Text\`}</span>;
  `,
  });
});

it("jsx with custom description", () => {
  runTest({
    description: "my desc",
    source: `
<span>Text</span>
  `,
  });
});

it("ignore empty jsx text", () => {
  runTest({
    source: `
<div>
  <div/>
</div>
  `,
  });
});

it("auto parametrization on end", () => {
  runTest({
    source: `
<span>text <a>end</a></span>
  `,
  });
});

it("auto parametrization on start", () => {
  runTest({
    source: `
<span><a>start</a> text</span>
  `,
  });
});

it("add jsx wrapper on same deep level", () => {
  runTest({
    source: `
<>
  <div>
    <div>
      <span>
        <a>1 link</a> from friends 1
      </span>    
    </div>
  </div>
  <div>
    <div>
      <span>
        2 from friends <a>2 link</a>
      </span>    
    </div>
  </div>
</>
  `,
  });
});

it("2 levels of nested jsx elements", () => {
  runTest({
    source: `
<div>
  text
  <level1>
    <level2>222</level2>
  </level1>
</div>;
  `,
  });
});

it("3 levels of nested jsx elements", () => {
  runTest({
    source: `
<div>
  text
  <level1>
    <level2>
      <level3>333</level3>
    </level2>
  </level1>
</div>;
  `,
  });
});

it("4 levels of nested jsx elements", () => {
  runTest({
    source: `
<div>
  text
  <level1>
    <level2>
      <level3>
        <level4>444</level4>
      </level3>
    </level2>
  </level1>
</div>;
  `,
  });
});

it("real world example", () => {
  runTest({
    source: `
<main>
  <div>
    <div>
      <h1>Sign in to GitHub</h1>
    </div>
    <div>
      <form>
        <label>Username or email address</label>
        <input name="login" />
        <div>
          <label>Password</label>
          <input name="password" />
          <input type="submit" name="commit" />
          <div>Don't remember password? <a>restore</a></div>
        </div>
      </form>
    </div>
    <p>
      New to GitHub?
      <a>Create an account</a>.
    </p>
  </div>
</main>
    `,
  });
});

it("jsx with params", () => {
  runTest({
    source: `
<span>Hi, {person.getName()}</span>
  `,
  });
});

it("import and require ignore", () => {
  runTest({
    source: `
import module1 from 'moduleName1';

const module2 = require('moduleName2');

function test1(a){
  function test2(b){
    function test3(c){
      return <div>text {a} {b} {c}</div>
    }
  }
}
  `,
  });
});
